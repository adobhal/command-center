import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/shared/types/api-response';

interface ActivityItem {
  id: string;
  type: 'sync' | 'upload' | 'reconciliation' | 'ai' | 'automation';
  message: string;
  timestamp: string;
}

export async function GET() {
  try {
    const { db } = await import('@/lib/infrastructure/db');
    const { automationRuns, reconciliations } = await import('@/lib/infrastructure/db/schema');
    const { desc, sql } = await import('drizzle-orm');

    const activities: ActivityItem[] = [];

    // Get recent reconciliations
    const recentReconciliations = await db
      .select({
        id: reconciliations.id,
        completedAt: reconciliations.completedAt,
        bankAccountName: reconciliations.bankAccountName,
      })
      .from(reconciliations)
      .where(sql`${reconciliations.status} = 'completed'`)
      .orderBy(desc(reconciliations.completedAt))
      .limit(5);

    recentReconciliations.forEach((rec) => {
      if (rec.completedAt) {
        activities.push({
          id: rec.id,
          type: 'reconciliation',
          message: `Reconciliation completed for ${rec.bankAccountName}`,
          timestamp: formatTimestamp(rec.completedAt),
        });
      }
    });

    // Get recent automation runs
    const recentAutomations = await db
      .select({
        id: automationRuns.id,
        startedAt: automationRuns.startedAt,
        status: automationRuns.status,
      })
      .from(automationRuns)
      .orderBy(desc(automationRuns.startedAt))
      .limit(5);

    recentAutomations.forEach((auto) => {
      activities.push({
        id: auto.id,
        type: 'automation',
        message: `Automation workflow ${auto.status}`,
        timestamp: formatTimestamp(auto.startedAt),
      });
    });

    // Sort by timestamp (most recent first) and limit to 10
    activities.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const response: ApiResponse<ActivityItem[]> = {
      data: activities.slice(0, 10),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching activity:', error);
    // Return empty activity when DB is not configured so dashboard can load
    return NextResponse.json({
      data: [],
    } as ApiResponse<ActivityItem[]>);
  }
}

function formatTimestamp(date: Date | null): string {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
