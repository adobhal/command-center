import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { db } from '@/lib/infrastructure/db';
import { bankTransactions } from '@/lib/infrastructure/db/schema';
import { desc, sql, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let transactions;
    let countResult;

    if (accountId) {
      transactions = await db
        .select()
        .from(bankTransactions)
        .where(eq(bankTransactions.bankAccountId, accountId))
        .orderBy(desc(bankTransactions.transactionDate))
        .limit(limit)
        .offset(offset);

      countResult = await db
        .select({ count: sql`count(*)` })
        .from(bankTransactions)
        .where(eq(bankTransactions.bankAccountId, accountId));
    } else {
      transactions = await db
        .select()
        .from(bankTransactions)
        .orderBy(desc(bankTransactions.transactionDate))
        .limit(limit)
        .offset(offset);

      countResult = await db.select({ count: sql`count(*)` }).from(bankTransactions);
    }

    const [{ count }] = countResult;

    return NextResponse.json({
      data: transactions,
      meta: {
        total: Number(count),
        limit,
        offset,
        hasMore: offset + limit < Number(count),
      },
    });
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch bank transactions',
        },
      },
      { status: 500 }
    );
  }
}
