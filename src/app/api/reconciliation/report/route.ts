import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { ReconciliationReportGenerator } from '@/lib/infrastructure/reconciliation/report';

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
    const { bankAccountId, periodStart, periodEnd } = body;

    if (!bankAccountId || !periodStart || !periodEnd) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'bankAccountId, periodStart, and periodEnd are required',
          },
        },
        { status: 400 }
      );
    }

    const generator = new ReconciliationReportGenerator();
    const report = await generator.generateReport(
      bankAccountId,
      new Date(periodStart),
      new Date(periodEnd)
    );

    const reportId = await generator.saveReport(report);

    return NextResponse.json({
      data: {
        ...report,
        id: reportId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'REPORT_ERROR',
          message: error.message || 'Failed to generate report',
        },
      },
      { status: 500 }
    );
  }
}

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
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'report id is required' } },
        { status: 400 }
      );
    }

    const generator = new ReconciliationReportGenerator();
    const report = await generator.getReport(reportId);

    if (!report) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Report not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: report,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'REPORT_ERROR',
          message: error.message || 'Failed to fetch report',
        },
      },
      { status: 500 }
    );
  }
}
