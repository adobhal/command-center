'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export function WelcomeSection() {
  // TODO: Fetch user name and AI insights from API
  const userName = 'Chief Excellence Officer';
  const priorities = [
    '3 transactions need reconciliation review',
    'Cash flow forecast updated - positive trend',
    'New automation workflow completed successfully',
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back, {userName}
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Here's what needs your attention today
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              AI Active
            </span>
          </div>
        </div>
        {priorities.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Top Priorities:
            </p>
            <ul className="space-y-1">
              {priorities.map((priority, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {priority}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
