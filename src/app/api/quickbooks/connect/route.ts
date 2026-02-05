import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { QuickBooksOAuth } from '@/lib/infrastructure/quickbooks/oauth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/quickbooks/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'QuickBooks credentials not configured',
          },
        },
        { status: 500 }
      );
    }

    const oauth = new QuickBooksOAuth({
      clientId,
      clientSecret,
      redirectUri,
      environment: (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    });

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');

    const authUrl = oauth.getAuthorizationUrl(state);

    return NextResponse.json({
      data: {
        authUrl,
        state,
      },
    });
  } catch (error) {
    console.error('Error generating QuickBooks auth URL:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate authorization URL',
        },
      },
      { status: 500 }
    );
  }
}
