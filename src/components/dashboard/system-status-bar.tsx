'use client';

import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useSystemStatus } from '@/hooks/use-system-status';

export function SystemStatusBar() {
  const { data, isLoading } = useSystemStatus();
  const systemStatus = data?.data || {
    responseTime: 0,
    uptime: 0,
    aiStatus: 'offline' as const,
    automationStatus: 'error' as const,
    quickbooksStatus: 'disconnected' as const,
  };

  const getStatusColor = (status: string) => {
    if (status === 'online' || status === 'healthy' || status === 'connected') {
      return 'bg-green-500';
    }
    return 'bg-yellow-500';
  };

  return (
    <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {systemStatus.responseTime}ms
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {systemStatus.uptime}%
              </span>
            </div>
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-green-500 text-green-700 dark:text-green-400"
            >
              <div className={`h-2 w-2 rounded-full ${getStatusColor(systemStatus.aiStatus)}`} />
              AI Online
            </Badge>
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-green-500 text-green-700 dark:text-green-400"
            >
              <div
                className={`h-2 w-2 rounded-full ${getStatusColor(systemStatus.automationStatus)}`}
              />
              Automation Healthy
            </Badge>
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-green-500 text-green-700 dark:text-green-400"
            >
              <div
                className={`h-2 w-2 rounded-full ${getStatusColor(systemStatus.quickbooksStatus)}`}
              />
              QuickBooks Connected
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Clock className="h-4 w-4" />
            <span>System Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
