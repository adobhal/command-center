import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { TransactionMatcher } from '@/lib/infrastructure/reconciliation/matcher';

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
    const { bankTransactionId, transactionId } = body;

    if (!bankTransactionId || !transactionId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'bankTransactionId and transactionId are required',
          },
        },
        { status: 400 }
      );
    }

    const matcher = new TransactionMatcher();
    await matcher.unmatch(bankTransactionId, transactionId);

    return NextResponse.json({
      data: {
        success: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'UNMATCH_ERROR',
          message: error.message || 'Failed to unmatch transactions',
        },
      },
      { status: 500 }
    );
  }
}
