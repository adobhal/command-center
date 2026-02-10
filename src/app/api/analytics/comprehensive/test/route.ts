import { NextResponse } from 'next/server';

type Insight = { type: string; category: string; title: string; description: string; impact: string; priority: number; recommendation: string; actionable: boolean; metrics?: unknown };

// Lazy imports to avoid build-time database errors
let ComprehensiveAnalyzer: any;
let slackNotifications: any;
let fs: any;
let getServerSession: any;
let authOptions: any;

async function loadDependencies() {
  // Skip auth entirely for test endpoint - it's meant for testing without database
  if (!authOptions) {
    authOptions = {
      providers: [],
      session: { strategy: 'jwt' },
      callbacks: {
        async jwt({ token, user }: { token: { id?: string }; user?: { id: string } }) {
          if (user) token.id = user.id;
          return token;
        },
        async session({ session, token }: { session: { user?: { id?: string } }; token: { id?: string } }) {
          if (session.user) (session.user as any).id = token.id as string;
          return session;
        },
      },
    };
  }
  if (!ComprehensiveAnalyzer) {
    const analyzerModule = await import('@/lib/infrastructure/analytics/comprehensive-analysis');
    ComprehensiveAnalyzer = analyzerModule.ComprehensiveAnalyzer;
  }
  if (!slackNotifications) {
    const slackModule = await import('@/lib/infrastructure/slack/notifications');
    slackNotifications = slackModule.slackNotifications;
  }
  if (!fs) {
    fs = await import('fs');
  }
}

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Test endpoint to analyze Warehouse Republic data
 */
export async function POST(request: Request) {
  try {
    // Load dependencies first
    await loadDependencies();

    // Skip authentication for test endpoint - it's for testing without database
    // In production, you'd want to enable this
    const session: any = { user: { id: 'test-user' } };
    console.log('Test endpoint - skipping authentication');

    const dataDir = '/tmp/warehouse_republic_feb8';

    if (!fs.default.existsSync(dataDir)) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Data directory not found. Please upload the ZIP file first.' } },
        { status: 404 }
      );
    }

    console.log('Starting comprehensive analysis', {
      dataDir,
      userId: session.user.id,
    });

    const analyzer = new ComprehensiveAnalyzer();
    const { metrics, insights } = await analyzer.analyzeAll(dataDir);

    // Store insights in database
    const storedCount = await analyzer.storeInsights(insights);

    const highPriorityInsights = insights.filter((i: Insight) => i.priority >= 8);

    // Send high-priority insights to Slack (don't fail if this fails)
    try {
      for (const insight of highPriorityInsights.slice(0, 5)) {
        try {
          await slackNotifications.notifyAIInsight({
            title: insight.title,
            description: insight.description,
            priority: insight.priority,
            actionable: insight.actionable,
            actionUrl: insight.actionable ? '/dashboard' : undefined,
          });
        } catch (slackError: any) {
          console.warn('Failed to send Slack notification', { error: slackError.message });
        }
      }
    } catch (slackError: any) {
      console.warn('Slack notification failed', { error: slackError.message });
    }

    console.log('Comprehensive analysis complete', {
      insightsGenerated: insights.length,
      insightsStored: storedCount,
      highPriority: insights.filter((i: Insight) => i.priority >= 8).length,
      userId: session.user.id,
    });

    return NextResponse.json({
      data: {
        metrics,
        insights: insights.map((i: Insight) => ({
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
          critical: insights.filter((i: Insight) => i.priority >= 9).length,
        },
      },
    });
  } catch (error: any) {
    console.error('=== COMPREHENSIVE ANALYSIS TEST ERROR ===');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('========================================');

    return NextResponse.json(
      {
        error: {
          code: 'ANALYSIS_ERROR',
          message: error?.message || 'Failed to perform comprehensive analysis',
          details: process.env.NODE_ENV === 'development' 
            ? {
                stack: error?.stack,
                name: error?.name,
              }
            : undefined,
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
