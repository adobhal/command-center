'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';

interface ResourceCard {
  title: string;
  value: number | string;
  trend?: number;
  trendLabel?: string;
}

function TrendIndicator({ trend }: { trend: number }) {
  if (trend > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{Math.abs(trend).toFixed(1)}%</span>
      </div>
    );
  }
  if (trend < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{trend.toFixed(1)}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-zinc-500">
      <Minus className="h-4 w-4" />
      <span className="text-sm font-medium">0%</span>
    </div>
  );
}

export function ResourceCards() {
  const { data, isLoading } = useDashboardMetrics();
  const metrics = data?.data;

  const resources: ResourceCard[] = [
    {
      title: 'Transactions Synced',
      value: metrics?.transactions.toLocaleString() || '0',
      trend: 8.2, // TODO: Calculate from historical data
      trendLabel: 'vs last month',
    },
    {
      title: 'Reconciliations',
      value: metrics?.reconciliations.toLocaleString() || '0',
      trend: -2.1, // TODO: Calculate from historical data
      trendLabel: 'vs last month',
    },
    {
      title: 'Bank Statements',
      value: metrics?.bankStatements.toLocaleString() || '0',
      trend: 0, // TODO: Calculate from historical data
      trendLabel: 'this month',
    },
    {
      title: 'Unmatched Items',
      value: metrics?.unmatchedItems.toLocaleString() || '0',
      trend: -15.3, // TODO: Calculate from historical data
      trendLabel: 'vs last week',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {resources.map((resource) => (
        <Card key={resource.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {resource.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {resource.value}
            </div>
            <div className="mt-2 flex items-center justify-between">
              {resource.trend !== undefined && <TrendIndicator trend={resource.trend} />}
              {resource.trendLabel && (
                <p className="text-xs text-zinc-500">{resource.trendLabel}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
