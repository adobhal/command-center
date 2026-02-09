import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { ComprehensiveAnalyzer } from '@/lib/infrastructure/analytics/comprehensive-analysis';
import { slackNotifications } from '@/lib/infrastructure/slack/notifications';
import { logger } from '@/lib/shared/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Comprehensive business analysis endpoint
 * Analyzes all financial data files and generates powerful insights
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

    const body = await request.json();
    const dataDir = body.dataDir;

    if (!dataDir || !fs.existsSync(dataDir)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Data directory not found' } },
        { status: 400 }
      );
    }

    logger.info('Starting comprehensive analysis', {
      dataDir,
      userId: session.user.id,
    });

    const analyzer = new ComprehensiveAnalyzer();
    const { metrics, insights } = await analyzer.analyzeAll(dataDir);

    // Store insights in database
    const storedCount = await analyzer.storeInsights(insights);

    // Send high-priority insights to Slack
    const highPriorityInsights = insights.filter((i) => i.priority >= 8);
    for (const insight of highPriorityInsights.slice(0, 5)) {
      await slackNotifications.notifyAIInsight({
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        actionable: insight.actionable,
        actionUrl: insight.actionable ? '/dashboard' : undefined,
      });
    }

    logger.info('Comprehensive analysis complete', {
      insightsGenerated: insights.length,
      insightsStored: storedCount,
      highPriority: highPriorityInsights.length,
      userId: session.user.id,
    });

    return NextResponse.json({
      data: {
        metrics,
        insights: insights.map((i) => ({
          type: i.type,
          category: i.category,
          title: i.title,
          description: i.description,
          impact: i.impact,
          priority: i.priority,
          recommendation: i.recommendation,
          actionable: i.actionable,
          metrics: i.metrics,
        })),
        summary: {
          totalInsights: insights.length,
          stored: storedCount,
          highPriority: highPriorityInsights.length,
          critical: insights.filter((i) => i.priority >= 9).length,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error in comprehensive analysis', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: {
          code: 'ANALYSIS_ERROR',
          message: error.message || 'Failed to perform comprehensive analysis',
        },
      },
      { status: 500 }
    );
  }
}
