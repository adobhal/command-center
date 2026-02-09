import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { InsightsGenerator } from '@/lib/infrastructure/ai/insights';
import { db } from '@/lib/infrastructure/db';
import { aiInsights } from '@/lib/infrastructure/db/schema';
import { slackNotifications } from '@/lib/infrastructure/slack/notifications';

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
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');

    // Get stored insights (including P&L insights)
    const storedInsights = await db.query.aiInsights.findMany({
      where: category
        ? (insight, { eq }) => eq(insight.category, category)
        : undefined,
      limit,
      orderBy: (insight, { desc }) => [desc(insight.priority), desc(insight.createdAt)],
    });

    return NextResponse.json({
      data: storedInsights,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'INSIGHTS_ERROR',
          message: error.message || 'Failed to fetch insights',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const generator = new InsightsGenerator();
    const newInsights = await generator.generateInsights();

    // Store new insights and send high-priority ones to Slack
    for (const insight of newInsights) {
      await db.insert(aiInsights).values({
        type: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        actionable: insight.actionable,
        actionUrl: insight.actionUrl,
        confidence: insight.confidence.toString(),
        metadata: insight.metadata,
      });

      // Send high-priority insights to Slack
      if (insight.priority >= 7) {
        await slackNotifications.notifyAIInsight({
          title: insight.title,
          description: insight.description,
          priority: insight.priority,
          actionable: insight.actionable,
          actionUrl: insight.actionUrl,
        });
      }
    }

    return NextResponse.json({
      data: {
        insights: newInsights,
        count: newInsights.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'INSIGHTS_GENERATION_ERROR',
          message: error.message || 'Failed to generate insights',
        },
      },
      { status: 500 }
    );
  }
}
