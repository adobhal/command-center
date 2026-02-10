'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PLSummaryCardProps {
  revenue?: number;
  expenses?: number;
  netIncome?: number;
  period?: string;
}

export function PLSummaryCard({
  revenue = 84700,
  expenses = 49800,
  netIncome = 34900,
  period = 'MTD',
}: PLSummaryCardProps) {
  const margin = revenue > 0 ? ((netIncome / revenue) * 100).toFixed(1) : '0';

  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-700/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <DollarSign className="h-4 w-4 text-slate-500" />
          P&L Summary
        </CardTitle>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{period}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Revenue</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              ${revenue.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Expenses</p>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              ${expenses.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net</p>
            <p className={cn(
              'font-semibold',
              netIncome >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            )}>
              ${netIncome.toLocaleString()}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs font-medium text-slate-500">
          Margin: {margin}%
        </p>
      </CardContent>
    </Card>
  );
}
