'use client';

import Link from 'next/link';
import { Wallet, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { cn } from '@/lib/utils';

export type Role = 'ceo' | 'cfo' | 'cso';

interface RoleStripProps {
  role: Role;
}

export function CFORoleStrip() {
  const { data } = useDashboardMetrics();
  const metrics = data?.data;
  const unmatchedItems = metrics?.unmatchedItems ?? 0;

  const items = [
    { label: 'Runway', value: '8.2', unit: 'mo', status: 'ok' as const },
    { label: 'Burn', value: '$45K', unit: '/mo', status: 'ok' as const },
    { label: 'Cash', value: '$368K', unit: '', status: 'ok' as const },
    { label: 'Unmatched', value: String(unmatchedItems), unit: ' items', status: unmatchedItems > 0 ? 'warn' as const : 'ok' as const, href: '/bookkeeping/reconciliation' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200/80 bg-white shadow-sm px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/50">
      <Wallet className="h-4 w-4 text-slate-500 shrink-0" />
      {items.map((item, i) => {
        const content = (
          <div className={cn(
            'flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-700',
            i === 0 && 'border-0 pl-0',
            item.href && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded transition-colors'
          )}>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{item.label}</span>
            <span className={cn(
              'font-semibold',
              item.status === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-50'
            )}>
              {item.value}{item.unit}
            </span>
          </div>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="flex items-center">
            {content}
          </Link>
        ) : (
          <div key={item.label} className="flex items-center">
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function CEORoleStrip() {
  const items = [
    { label: 'Decisions', value: '2', unit: 'pending', href: '/growth-framework/excellence-review' },
    { label: 'Commitments', value: '8/10', unit: 'delivered', status: 'ok' as const },
    { label: 'Run/Build/Scan', value: '52/28/20', unit: '%', href: '/growth-framework/priorities' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200/80 bg-white shadow-sm px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/50">
      <CheckCircle2 className="h-4 w-4 text-slate-500 shrink-0" />
      {items.map((item, i) => {
        const content = (
          <div className={cn(
            'flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-700',
            i === 0 && 'border-0 pl-0',
            item.href && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded transition-colors'
          )}>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{item.label}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-50">
              {item.value} {item.unit}
            </span>
          </div>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="flex items-center">
            {content}
          </Link>
        ) : (
          <div key={item.label} className="flex items-center">
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function CSORoleStrip() {
  const items = [
    { label: 'Growth', value: '+12%', unit: 'YoY', status: 'ok' as const },
    { label: 'Pipeline', value: '$420K', unit: '', href: '/growth-framework/priorities' },
    { label: 'Win rate', value: '34%', unit: '', status: 'warn' as const },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200/80 bg-white shadow-sm px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/50">
      <TrendingUp className="h-4 w-4 text-slate-500 shrink-0" />
      {items.map((item, i) => {
        const content = (
          <div className={cn(
            'flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-700',
            i === 0 && 'border-0 pl-0',
            item.href && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded transition-colors'
          )}>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{item.label}</span>
            <span className={cn(
              'font-semibold',
              item.status === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-50'
            )}>
              {item.value}{item.unit}
            </span>
          </div>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="flex items-center">
            {content}
          </Link>
        ) : (
          <div key={item.label} className="flex items-center">
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function RoleStrip({ role }: RoleStripProps) {
  if (role === 'cfo') return <CFORoleStrip />;
  if (role === 'ceo') return <CEORoleStrip />;
  return <CSORoleStrip />;
}
