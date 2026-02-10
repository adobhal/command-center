'use client';

import { Badge } from '@/components/ui/badge';
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

  const allHealthy =
    getStatusColor(systemStatus.aiStatus) === 'bg-green-500' &&
    getStatusColor(systemStatus.automationStatus) === 'bg-green-500' &&
    getStatusColor(systemStatus.quickbooksStatus) === 'bg-green-500';

  return (
    <div className="border-b border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span>{systemStatus.responseTime}ms</span>
            <span>{systemStatus.uptime}% uptime</span>
            <Badge
              variant="outline"
              className={`flex items-center gap-1.5 text-xs font-medium ${allHealthy ? 'border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300' : 'border-amber-400/60 text-amber-700 dark:text-amber-400'}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${allHealthy ? 'bg-slate-500' : 'bg-amber-500'}`} />
              {allHealthy ? 'All systems connected' : 'Check connections'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
