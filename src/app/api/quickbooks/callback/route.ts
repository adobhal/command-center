import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { QuickBooksOAuth } from '@/lib/infrastructure/quickbooks/oauth';
import { QuickBooksClient } from '@/lib/infrastructure/quickbooks/client';
import { db } from '@/lib/infrastructure/db';
import { quickbooksConnections } from '@/lib/infrastructure/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const realmId = searchParams.get('realmId');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/quickbooks/connect?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !realmId) {
      return NextResponse.redirect(
        new URL('/quickbooks/connect?error=missing_params', request.url)
      );
    }

    // Verify state
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
        if (decodedState.userId !== session.user.id) {
          return NextResponse.redirect(
            new URL('/quickbooks/connect?error=invalid_state', request.url)
          );
        }
      } catch (e) {
        // State verification failed, but continue (in production, you might want to be stricter)
      }
    }

    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/quickbooks/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/quickbooks/connect?error=not_configured', request.url)
      );
    }

    const oauth = new QuickBooksOAuth({
      clientId,
      clientSecret,
      redirectUri,
      environment: (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    });

    // Exchange code for tokens
    const tokens = await oauth.exchangeCodeForToken(code);

    // Get company info
    const client = new QuickBooksClient({
      accessToken: tokens.access_token,
      realmId: tokens.realmId,
      environment: (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    });

    const company = await client.getCompany();

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Check if connection already exists
    const existingConnection = await db.query.quickbooksConnections.findFirst({
      where: eq(quickbooksConnections.realmId, tokens.realmId),
    });

    if (existingConnection) {
      // Update existing connection
      await db
        .update(quickbooksConnections)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          companyName: company.CompanyName,
          updatedAt: new Date(),
        })
        .where(eq(quickbooksConnections.id, existingConnection.id));
    } else {
      // Create new connection
      await db.insert(quickbooksConnections).values({
        userId: session.user.id,
        companyId: tokens.realmId,
        companyName: company.CompanyName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        realmId: tokens.realmId,
        expiresAt,
      });
    }

    return NextResponse.redirect(new URL('/quickbooks/connect?success=true', request.url));
  } catch (error) {
    console.error('Error in QuickBooks callback:', error);
    return NextResponse.redirect(
      new URL(`/quickbooks/connect?error=callback_failed`, request.url)
    );
  }
}
