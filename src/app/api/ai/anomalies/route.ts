import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { AnomalyDetector } from '@/lib/infrastructure/ai/anomaly-detector';
import { db } from '@/lib/infrastructure/db';
import { aiInsights } from '@/lib/infrastructure/db/schema';
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
    const { accountId, startDate, endDate } = body;

    const detector = new AnomalyDetector();
    const anomalies = await detector.detectAnomalies(
      accountId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    // Store anomalies as insights and send to Slack
    for (const anomaly of anomalies) {
      await db.insert(aiInsights).values({
        type: 'anomaly',
        category: 'finance',
        title: anomaly.title,
        description: anomaly.description,
        priority: anomaly.severity === 'critical' ? 10 : anomaly.severity === 'high' ? 8 : 5,
        actionable: true,
        confidence: '0.8',
        metadata: {
          anomalyType: anomaly.type,
          severity: anomaly.severity,
          transactionIds: anomaly.transactionIds,
          ...anomaly.metadata,
        },
      });

      // Send critical/high severity anomalies to Slack
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        await slackNotifications.notifyAnomaly(anomaly);
      }
    }

    return NextResponse.json({
      data: {
        anomalies,
        count: anomalies.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'ANOMALY_DETECTION_ERROR',
          message: error.message || 'Failed to detect anomalies',
        },
      },
      { status: 500 }
    );
  }
}
