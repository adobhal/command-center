'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CheckSquare, ChevronRight } from 'lucide-react';

const CONSTRAINTS = [
  { name: 'Manufacturing capacity at 92%', owner: 'Ops', severity: 'high' },
  { name: 'ERP integration delays', owner: 'IT', severity: 'high' },
  { name: 'Cash flow runway under 6 months', owner: 'CFO', severity: 'critical' },
];

const TODOS = [
  { title: 'Approve Q1 budget', due: 'Fri', tag: 'survival' },
  { title: 'Review constraint #1', due: 'Wed', tag: 'survival' },
  { title: 'Sign vendor contract', due: 'Thu', tag: 'important' },
];

export function FocusPanel() {
  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-700/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold tracking-tight">Focus</CardTitle>
          <Link
            href="/growth-framework/excellence-review"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 flex items-center gap-0.5 transition-colors"
          >
            Full review <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Constraints</p>
          <div className="space-y-2">
            {CONSTRAINTS.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5">
                <span className="text-slate-900 dark:text-slate-50">{c.name}</span>
                <Badge variant={c.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs font-medium">
                  {c.owner}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">This week</p>
          <div className="space-y-2">
            {TODOS.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1.5">
                <CheckSquare className="h-4 w-4 text-slate-400" />
                <span className="text-slate-900 dark:text-slate-50">{t.title}</span>
                <span className="text-xs text-slate-500 ml-auto">Due {t.due}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
