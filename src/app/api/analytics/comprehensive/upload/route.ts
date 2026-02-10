import { NextResponse } from 'next/server';

type Insight = { type: string; category: string; title: string; description: string; impact: string; priority: number; recommendation: string; actionable: boolean; metrics?: unknown };

// Lazy imports to avoid build-time database errors
let ComprehensiveAnalyzer: any;
let slackNotifications: any;
let fs: any;
let path: any;
let AdmZip: any;
let getServerSession: any;
let authOptions: any;
let logger: any;

async function loadDependencies() {
  if (!getServerSession) {
    const nextAuth = await import('next-auth');
    getServerSession = nextAuth.getServerSession;
  }
  if (!authOptions) {
    // Skip auth if database isn't configured - create minimal authOptions
    // This allows the analysis to work without database
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
    
    // Try to load real auth config if database is available
    try {
      const authConfig = await import('@/lib/infrastructure/auth/config');
      // Only use it if it loaded successfully (database is configured)
      if (authConfig.authOptions) {
        authOptions = authConfig.authOptions;
      }
    } catch (authError: any) {
      console.warn('Auth config failed to load (database may not be configured):', authError.message);
      // Use the minimal authOptions we created above
    }
  }
  if (!logger) {
    const loggerModule = await import('@/lib/shared/utils/logger');
    logger = loggerModule.logger;
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
  if (!path) {
    path = await import('path');
  }
  if (!AdmZip) {
    AdmZip = (await import('adm-zip')).default;
  }
}

export const runtime = 'nodejs';
export const maxDuration = 120;

// Top-level error handler to ensure we always return JSON
function handleError(error: any): NextResponse {
  const errorMessage = error?.message || 'Unknown error occurred';
  const errorStack = error?.stack;
  
  console.error('=== API ERROR ===');
  console.error('Message:', errorMessage);
  console.error('Stack:', errorStack);
  console.error('Full error:', error);
  console.error('===============');

  return NextResponse.json(
    {
      error: {
        code: 'SERVER_ERROR',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: errorStack,
            name: error?.name,
          },
        }),
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

/**
 * Upload and analyze comprehensive business data (zip file with multiple Excel files)
 */
export async function POST(request: Request) {
  // Wrap everything in try-catch to ensure we always return JSON
  try {
    // Load dependencies first (lazy load to avoid build-time errors)
    await loadDependencies();

    // Try to get session, but don't fail if auth isn't configured
    let session: any = null;
    try {
      session = await getServerSession(authOptions);
    } catch (authError: any) {
      console.warn('Session check failed (auth may not be configured):', authError.message);
      // For development, allow proceeding without auth
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: { code: 'AUTH_ERROR', message: 'Authentication check failed: ' + authError.message } },
          { status: 401 }
        );
      }
    }

    // Warn if no session but continue for development
    if (!session?.user?.id) {
      console.warn('No session found - proceeding without authentication');
      // In production, require auth
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        );
      }
    }

    if (logger?.info) {
      logger.info('Received upload request', { userId: session.user.id });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (logger?.info) {
      logger.info('FormData received', { 
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
      });
    }

    if (!file) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'File is required' } },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.match(/\.zip$/i)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Please upload a ZIP file' } },
        { status: 400 }
      );
    }

    // Create temp directory for extraction
    const tempDir = path.default.join('/tmp', `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    fs.default.mkdirSync(tempDir, { recursive: true });

    try {
      // Read and extract zip file
      console.log('Reading file buffer', { fileSize: file.size });
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log('File buffer read', { bufferLength: buffer.length });
      
      console.log('Creating ZIP instance');
      const zip = new AdmZip(buffer);
      console.log('Extracting ZIP file', { tempDir });
      zip.extractAllTo(tempDir, true);
      console.log('ZIP extraction complete');

      console.log('ZIP file extracted', {
        filename: file.name,
        tempDir,
        userId: session.user.id,
      });

      // List extracted files for debugging
      const extractedFiles = fs.default.readdirSync(tempDir);
      console.log('Extracted files', { files: extractedFiles });

      // Analyze all files
      console.log('Starting comprehensive analysis', { tempDir });
      const analyzer = new ComprehensiveAnalyzer();
      let metrics, insights;
      try {
        const result = await analyzer.analyzeAll(tempDir);
        metrics = result.metrics;
        insights = result.insights;
        console.log('Analysis completed successfully', { 
          insightsCount: insights.length,
          metrics: {
            revenue: metrics.revenue,
            netIncome: metrics.netIncome,
            customerCount: metrics.customerCount,
          },
        });
      } catch (analysisError: any) {
        console.error('Analysis failed', {
          error: analysisError.message,
          stack: analysisError.stack,
        });
        throw analysisError;
      }

      // Store insights in database
      let storedCount = 0;
      try {
        storedCount = await analyzer.storeInsights(insights);
        console.log('Insights stored', { storedCount });
      } catch (storeError: any) {
        console.error('Failed to store insights', {
          error: storeError.message,
          stack: storeError.stack,
        });
        // Continue even if storing fails - we still want to return the analysis
      }

      // Calculate high-priority insights for summary
      const highPriorityInsights = insights.filter((i: Insight) => i.priority >= 8);
      const criticalInsights = insights.filter((i: Insight) => i.priority >= 9);

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
        // Continue even if Slack fails
      }

      console.log('Comprehensive analysis complete', {
        filename: file.name,
        insightsGenerated: insights.length,
        insightsStored: storedCount,
        highPriority: highPriorityInsights.length,
        userId: session?.user?.id || 'unknown',
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
            critical: criticalInsights.length,
          },
        },
      });
    } finally {
      // Clean up temp directory
      try {
        if (tempDir && fs?.default) {
          fs.default.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError: any) {
        console.warn('Failed to cleanup temp directory', { tempDir, error: cleanupError?.message });
      }
    }
  } catch (error: any) {
    return handleError(error);
  }
}
