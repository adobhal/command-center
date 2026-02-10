'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RefreshCw, Upload, Search, ClipboardCheck, FileText, BarChart3 } from 'lucide-react';

const GROUPS = [
  {
    label: 'Bookkeeping',
    actions: [
      { label: 'Sync QuickBooks', icon: RefreshCw, href: '/bookkeeping/quickbooks' },
      { label: 'Upload Statement', icon: Upload, href: '/bookkeeping/bank-statements' },
      { label: 'Reconcile', icon: Search, href: '/bookkeeping/reconciliation' },
    ],
  },
  {
    label: 'Growth',
    actions: [
      { label: 'Excellence Review', icon: ClipboardCheck, href: '/growth-framework/excellence-review' },
    ],
  },
  {
    label: 'Analysis',
    actions: [
      { label: 'P&L Analysis', icon: FileText, href: '/analysis/pl-analysis' },
      { label: 'Comprehensive', icon: BarChart3, href: '/analysis/comprehensive' },
    ],
  },
];

export function SidebarActions() {
  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-700/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
            <div className="space-y-1">
              {group.actions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.label} href={a.href}>
                    <Button variant="outline" size="sm" className="w-full justify-start text-sm border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:hover:bg-slate-800/50">
                      <Icon className="mr-2 h-4 w-4 opacity-80" />
                      {a.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
