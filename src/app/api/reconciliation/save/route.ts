import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { TransactionMatcher } from '@/lib/infrastructure/reconciliation/matcher';
import { MatchCandidate } from '@/lib/infrastructure/reconciliation/types';

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
    const { matches, matchedBy = 'manual' } = body;

    if (!matches || !Array.isArray(matches)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'matches array is required' } },
        { status: 400 }
      );
    }

    const matcher = new TransactionMatcher();
    const saved = await matcher.saveMatches(matches as MatchCandidate[], matchedBy);

    return NextResponse.json({
      data: {
        saved,
        total: matches.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'SAVE_ERROR',
          message: error.message || 'Failed to save matches',
        },
      },
      { status: 500 }
    );
  }
}
