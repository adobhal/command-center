'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Upload, CheckCircle2, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { useRecentActivity, ActivityItem } from '@/hooks/use-recent-activity';
import Link from 'next/link';

const activityIcons = {
  sync: RefreshCw,
  upload: Upload,
  reconciliation: CheckCircle2,
  ai: Sparkles,
  automation: Clock,
};

const activityColors = {
  sync: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  upload: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  reconciliation: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  ai: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  automation: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
};

const activityLinks: { [key: string]: string } = {
  sync: '/quickbooks/connect',
  upload: '/bank-statements/upload',
  reconciliation: '/reconciliation',
  ai: '/dashboard#insights',
  automation: '/dashboard',
};

export function RecentActivity() {
  const { data, isLoading } = useRecentActivity();
  const activities = data?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const href = activityLinks[activity.type];
            const ActivityWrapper = href ? Link : 'div';
            const wrapperProps = href ? { href, className: 'block' } : { className: 'block' };

            return (
              <ActivityWrapper key={activity.id} {...wrapperProps}>
                <div
                  className={`flex items-start gap-3 ${
                    href ? 'cursor-pointer rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900' : ''
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${activityColors[activity.type]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-zinc-900 dark:text-zinc-50">{activity.message}</p>
                    <p className="text-xs text-zinc-500">{activity.timestamp}</p>
                  </div>
                </div>
              </ActivityWrapper>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
