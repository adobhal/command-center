import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { AIMatchingEnhancer } from '@/lib/infrastructure/ai/matching';
import { db } from '@/lib/infrastructure/db';
import { bankTransactions, transactions } from '@/lib/infrastructure/db/schema';
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
    const { matches } = body;

    if (!matches || !Array.isArray(matches)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'matches array is required' } },
        { status: 400 }
      );
    }

    // Get full transaction data
    const bankTxIds = [...new Set(matches.map((m: any) => m.bankTransactionId))];
    const qbTxIds = [...new Set(matches.map((m: any) => m.transactionId))];

    const bankTxList = await Promise.all(
      bankTxIds.map((id) =>
        db.query.bankTransactions.findFirst({
          where: eq(bankTransactions.id, id),
        })
      )
    );

    const qbTxList = await Promise.all(
      qbTxIds.map((id) =>
        db.query.transactions.findFirst({
          where: eq(transactions.id, id),
        })
      )
    );

    const enhancer = new AIMatchingEnhancer();
    const enhanced = await enhancer.enhanceMatches(
      matches,
      bankTxList.filter(Boolean) as any[],
      qbTxList.filter(Boolean) as any[]
    );

    return NextResponse.json({
      data: {
        enhanced,
        originalCount: matches.length,
        enhancedCount: enhanced.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'AI_ENHANCEMENT_ERROR',
          message: error.message || 'Failed to enhance matches with AI',
        },
      },
      { status: 500 }
    );
  }
}
