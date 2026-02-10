'use client';

import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Target, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Verdict = 'winning' | 'drifting' | 'breaking';

const VERDICT_STYLES: Record<Verdict, string> = {
  winning: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
  drifting: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
  breaking: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30',
};

export function DashboardHero({
  verdict = 'drifting',
  metric = 'Revenue',
  actual = 84700,
  target = 100000,
  vsPriorPeriod = -8.2,
  period = 'Monthly',
}: {
  verdict?: Verdict;
  metric?: string;
  actual?: number;
  target?: number;
  vsPriorPeriod?: number;
  period?: string;
}) {
  const trendUp = vsPriorPeriod >= 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Executive Home
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          How is the business performing?
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">{metric} · {period}</p>
          <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            ${actual.toLocaleString()}
            <span className="text-sm font-normal text-slate-500"> / ${target.toLocaleString()}</span>
          </p>
          <p className={cn(
            'text-xs flex items-center gap-1 mt-0.5 font-medium',
            trendUp ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
          )}>
            {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trendUp ? '+' : ''}{vsPriorPeriod}% vs prior period
          </p>
        </div>
        <Badge variant="outline" className={cn('border font-medium capitalize shrink-0', VERDICT_STYLES[verdict])}>
          <Target className="mr-1.5 h-3.5 w-3.5" />
          {verdict}
        </Badge>
        <Link
          href="/growth-framework/goals"
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-0.5 shrink-0 transition-colors"
        >
          Change metric <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
