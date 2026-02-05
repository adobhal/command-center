import { NextResponse } from 'next/server';
import { db } from '@/lib/infrastructure/db';
import { transactions, bankTransactions, reconciliations, matchedTransactions } from '@/lib/infrastructure/db/schema';
import { count, sql } from 'drizzle-orm';
import { ApiResponse } from '@/lib/shared/types/api-response';

export async function GET() {
  try {
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
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch dashboard metrics',
        },
      },
      { status: 500 }
    );
  }
}
