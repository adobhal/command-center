import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { PLParser } from '@/lib/infrastructure/analytics/pl-parser';
import { db } from '@/lib/infrastructure/db';
import { aiInsights } from '@/lib/infrastructure/db/schema';
import { slackNotifications } from '@/lib/infrastructure/slack/notifications';
import { logger } from '@/lib/shared/utils/logger';
import { eq, and } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Direct import endpoint - reads file from request body
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'File is required' } },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    const parser = new PLParser();
    const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
    let totalInserted = 0;

    // Map P&L insight types to AI insight types
    const mapPLTypeToAIType = (plType: string): 'recommendation' | 'prediction' | 'anomaly' | 'optimization' => {
      switch (plType) {
        case 'anomaly':
          return 'anomaly';
        case 'trend':
          return 'prediction';
        case 'profitability':
        case 'expense':
          return 'optimization';
        default:
          return 'recommendation';
      }
    };

    // Parse each year
    for (let yearIdx = 1; yearIdx <= 6; yearIdx++) {
      const year = years[yearIdx - 1];
      
      // Extract data for this year
      const yearData = data.map((row: any[]) => {
        const label = row[0];
        const value = row[yearIdx];
        return [label, value];
      });

      // Parse this year's data
      const plData = await parser.parseData(yearData as any[][], `${file.name} - ${year}`, 1);
      
      // Generate insights
      const yearInsights = parser.generateInsights(plData);

      // Store insights in database
      for (const insight of yearInsights) {
        const categoryKey = `pl_${insight.category}_${year}`;
        const titleWithYear = `${insight.title} (${year})`;

        // Check if insight already exists
        const existing = await db
          .select()
          .from(aiInsights)
          .where(
            and(
              eq(aiInsights.category, categoryKey),
              eq(aiInsights.title, titleWithYear)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(aiInsights).values({
            type: mapPLTypeToAIType(insight.type),
            category: categoryKey,
            title: titleWithYear,
            description: `${insight.description} [Year: ${year}]`,
            priority: insight.priority,
            actionable: !!insight.recommendation,
            actionUrl: insight.recommendation ? '/analytics/pl-analysis' : undefined,
            confidence: '0.9',
            metadata: {
              plAnalysis: true,
              year,
              value: insight.value,
              percentage: insight.percentage,
              recommendation: insight.recommendation,
              period: plData.period,
              revenue: plData.revenue,
              netIncome: plData.netIncome,
              grossMargin: plData.revenue > 0 ? (plData.grossProfit / plData.revenue) * 100 : 0,
              operatingMargin: plData.revenue > 0 ? (plData.operatingIncome / plData.revenue) * 100 : 0,
              netMargin: plData.revenue > 0 ? (plData.netIncome / plData.revenue) * 100 : 0,
            },
          });
          totalInserted++;
        }
      }
    }

    logger.info('P&L insights imported directly', {
      filename: file.name,
      inserted: totalInserted,
      userId: session.user.id,
    });

    return NextResponse.json({
      data: {
        message: 'P&L insights imported successfully',
        inserted: totalInserted,
      },
    });
  } catch (error: any) {
    logger.error('Error importing P&L insights', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: {
          code: 'PL_IMPORT_ERROR',
          message: error.message || 'Failed to import P&L insights',
        },
      },
      { status: 500 }
    );
  }
}
