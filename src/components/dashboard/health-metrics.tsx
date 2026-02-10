'use client';

import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const METRICS = [
  { label: 'Burn Multiple', value: '2.4x', status: 'ok' },
  { label: 'Opex', value: '34%', status: 'warn' },
  { label: 'Gross Margin', value: '42%', status: 'ok' },
  { label: 'Cycle Time', value: '0.92', status: 'ok' },
] as const;

const STATUS_COLOR = { ok: 'text-slate-700 dark:text-slate-300', warn: 'text-amber-700 dark:text-amber-400' };

export function HealthMetrics() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200/80 bg-white shadow-sm px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/50">
      <Activity className="h-4 w-4 text-slate-500 shrink-0" />
      {METRICS.map((m, i) => (
        <div key={m.label} className={cn(
          'flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-700',
          i === 0 && 'border-0 pl-0'
        )}>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{m.label}</span>
          <span className={cn('font-semibold', STATUS_COLOR[m.status])}>{m.value}</span>
        </div>
      ))}
    </div>
  );
}
