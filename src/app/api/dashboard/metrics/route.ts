import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/shared/types/api-response';

const fallbackMetrics = {
  transactions: 0,
  reconciliations: 0,
  bankStatements: 0,
  unmatchedItems: 0,
};

export async function GET() {
  try {
    const { db } = await import('@/lib/infrastructure/db');
    const { transactions, bankTransactions, reconciliations, matchedTransactions } = await import(
      '@/lib/infrastructure/db/schema'
    );
    const { count, sql } = await import('drizzle-orm');

    // Get transaction counts
    const [transactionCount] = await db
      .select({ count: count() })
      .from(transactions);

    // Get bank transaction counts
    const [bankTransactionCount] = await db
      .select({ count: count() })
      .from(bankTransactions);

    // Get reconciliation counts
    const [reconciliationCount] = await db
      .select({ count: count() })
      .from(reconciliations);

    // Get unmatched transactions (bank transactions without matches)
    const unmatchedCount = await db
      .select({ count: count() })
      .from(bankTransactions)
      .leftJoin(
        matchedTransactions,
        sql`${bankTransactions.id} = ${matchedTransactions.bankTransactionId}`
      )
      .where(sql`${matchedTransactions.id} IS NULL`);

    const response: ApiResponse<{
      transactions: number;
      reconciliations: number;
      bankStatements: number;
      unmatchedItems: number;
    }> = {
      data: {
        transactions: transactionCount?.count || 0,
        reconciliations: reconciliationCount?.count || 0,
        bankStatements: bankTransactionCount?.count || 0,
        unmatchedItems: unmatchedCount[0]?.count || 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    // Return fallback data when DB is not configured so dashboard can load
    return NextResponse.json({
      data: fallbackMetrics,
    } as ApiResponse<typeof fallbackMetrics>);
  }
}
