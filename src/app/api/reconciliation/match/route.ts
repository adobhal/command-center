import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { TransactionMatcher } from '@/lib/infrastructure/reconciliation/matcher';
import { logger } from '@/lib/shared/utils/logger';
import { slackNotifications } from '@/lib/infrastructure/slack/notifications';

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
    const {
      accountId,
      startDate,
      endDate,
      dateTolerance = 3,
      amountTolerance = 0.01,
      minConfidence = 0.7,
      autoMatch = false,
      useAI = false,
    } = body;

    const matcher = new TransactionMatcher({
      dateTolerance,
      amountTolerance,
      minConfidence,
    });

    const result = await matcher.matchTransactions({
      accountId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      dateTolerance,
      amountTolerance,
      minConfidence,
      useAI,
    });

    logger.info('Reconciliation match completed', {
      matched: result.matched.length,
      unmatchedBank: result.unmatchedBank.length,
      unmatchedQuickBooks: result.unmatchedQuickBooks.length,
      discrepancies: result.discrepancies.length,
      userId: session.user.id,
    });

    // Auto-match if requested
    if (autoMatch && result.matched.length > 0) {
      const saved = await matcher.saveMatches(result.matched, 'ai');
      logger.info('Auto-matched transactions', { saved });
    }

    // Calculate health score
    const totalTransactions = result.matched.length + result.unmatchedBank.length + result.unmatchedQuickBooks.length;
    const healthScore = totalTransactions > 0 
      ? Math.round((result.matched.length / totalTransactions) * 100)
      : 100;

    // Send Slack notification if reconciliation completed
    if (result.matched.length > 0 || result.unmatchedBank.length > 0 || result.unmatchedQuickBooks.length > 0) {
      await slackNotifications.notifyReconciliationComplete({
        matched: result.matched.length,
        unmatchedBank: result.unmatchedBank.length,
        unmatchedQuickBooks: result.unmatchedQuickBooks.length,
        discrepancies: result.discrepancies.length,
        healthScore,
      });
    }

    return NextResponse.json({
      data: {
        ...result,
        autoMatched: autoMatch ? result.matched.length : 0,
        healthScore,
      },
    });
  } catch (error: any) {
    logger.error('Error matching transactions', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: {
          code: 'MATCH_ERROR',
          message: error.message || 'Failed to match transactions',
        },
      },
      { status: 500 }
    );
  }
}
