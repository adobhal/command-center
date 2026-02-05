import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { QuickBooksSyncService } from '@/lib/infrastructure/quickbooks/sync';
import { db } from '@/lib/infrastructure/db';
import { quickbooksConnections } from '@/lib/infrastructure/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { connectionId, startDate, endDate } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'connectionId is required' } },
        { status: 400 }
      );
    }

    // Verify connection belongs to user
    const connection = await db.query.quickbooksConnections.findFirst({
      where: eq(quickbooksConnections.id, connectionId),
    });

    if (!connection || connection.userId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'QuickBooks connection not found' } },
        { status: 404 }
      );
    }

    const syncService = new QuickBooksSyncService();

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const result = await syncService.syncJournalEntries({
      connectionId,
      startDate: start,
      endDate: end,
    });

    return NextResponse.json({
      data: {
        synced: result.synced,
        errors: result.errors,
        message: `Synced ${result.synced} transactions${result.errors > 0 ? ` with ${result.errors} errors` : ''}`,
      },
    });
  } catch (error: any) {
    console.error('Error syncing QuickBooks:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SYNC_ERROR',
          message: error.message || 'Failed to sync QuickBooks data',
        },
      },
      { status: 500 }
    );
  }
}
