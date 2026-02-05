import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { db } from '@/lib/infrastructure/db';
import { quickbooksConnections } from '@/lib/infrastructure/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const connections = await db.query.quickbooksConnections.findMany({
      where: eq(quickbooksConnections.userId, session.user.id),
      columns: {
        id: true,
        companyName: true,
        companyId: true,
        realmId: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose tokens
        accessToken: false,
        refreshToken: false,
      },
    });

    return NextResponse.json({
      data: connections.map((conn) => ({
        ...conn,
        isExpired: conn.expiresAt < new Date(),
      })),
    });
  } catch (error) {
    console.error('Error fetching QuickBooks connections:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch connections',
        },
      },
      { status: 500 }
    );
  }
}
