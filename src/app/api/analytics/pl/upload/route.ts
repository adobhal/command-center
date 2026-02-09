import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { PLParser } from '@/lib/infrastructure/analytics/pl-parser';
import { db } from '@/lib/infrastructure/db';
import { aiInsights } from '@/lib/infrastructure/db/schema';
import { slackNotifications } from '@/lib/infrastructure/slack/notifications';
import { logger } from '@/lib/shared/utils/logger';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Ensure we always return JSON, even for auth errors
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (authError: any) {
      logger.error('Auth error in P&L upload', { error: authError.message });
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: 'Authentication check failed' } },
        { status: 401 }
      );
    }

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

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Please upload an Excel file (.xlsx or .xls)' } },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse P&L file
    const parser = new PLParser();
    const plData = await parser.parseBuffer(buffer, file.name);

    logger.info('P&L file parsed', {
      filename: file.name,
      revenue: plData.revenue,
      netIncome: plData.netIncome,
      userId: session.user.id,
    });

    // Generate insights
    const insights = parser.generateInsights(plData);

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

    // Store insights in database (check for duplicates first)
    const insertedInsights: any[] = [];
    for (const insight of insights) {
      const categoryKey = `pl_${insight.category}`;
      
      // Check if this exact insight already exists
      const existing = await db
        .select()
        .from(aiInsights)
        .where(
          and(
            eq(aiInsights.category, categoryKey),
            eq(aiInsights.title, insight.title)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(aiInsights).values({
          type: mapPLTypeToAIType(insight.type),
          category: categoryKey,
          title: insight.title,
          description: insight.description,
          priority: insight.priority,
          actionable: !!insight.recommendation,
          actionUrl: insight.recommendation ? '/analytics/pl-analysis' : undefined,
          confidence: '0.9',
          metadata: {
            plAnalysis: true,
            value: insight.value,
            percentage: insight.percentage,
            recommendation: insight.recommendation,
            period: plData.period,
            revenue: plData.revenue,
            netIncome: plData.netIncome,
          },
        });
        insertedInsights.push(insight);
      }
    }

    // Send high-priority insights to Slack
    const highPriorityInsights = insertedInsights.filter((i) => i.priority >= 8);
    for (const insight of highPriorityInsights) {
      await slackNotifications.notifyAIInsight({
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        actionable: !!insight.recommendation,
        actionUrl: insight.recommendation ? '/analytics/pl-analysis' : undefined,
      });
    }

    return NextResponse.json({
      data: {
        plData: {
          period: plData.period,
          revenue: plData.revenue,
          costOfGoodsSold: plData.costOfGoodsSold,
          grossProfit: plData.grossProfit,
          totalOperatingExpenses: plData.totalOperatingExpenses,
          operatingIncome: plData.operatingIncome,
          netIncome: plData.netIncome,
          grossMargin: plData.revenue > 0 ? (plData.grossProfit / plData.revenue) * 100 : 0,
          operatingMargin: plData.revenue > 0 ? (plData.operatingIncome / plData.revenue) * 100 : 0,
          netMargin: plData.revenue > 0 ? (plData.netIncome / plData.revenue) * 100 : 0,
        },
        insights: insights.map((i) => ({
          type: i.type,
          category: i.category,
          title: i.title,
          description: i.description,
          value: i.value,
          percentage: i.percentage,
          recommendation: i.recommendation,
          priority: i.priority,
        })),
        insightsCount: insights.length,
        insertedCount: insertedInsights.length,
        highPriorityCount: highPriorityInsights.length,
      },
    });
  } catch (error: any) {
    logger.error('Error parsing P&L file', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Ensure we always return JSON, never HTML
    return NextResponse.json(
      {
        error: {
          code: 'PL_PARSE_ERROR',
          message: error.message || 'Failed to parse P&L file',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
