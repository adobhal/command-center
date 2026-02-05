'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Zap, BarChart3 } from 'lucide-react';

const pillars = [
  {
    title: 'Finance Intelligence',
    description: 'The Data Intelligence Engine that drives ROI decisions',
    icon: DollarSign,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Strategic Insights',
    description: 'AI-powered recommendations and predictive analytics',
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Automation Excellence',
    description: 'Maximum automation for operational efficiency',
    icon: Zap,
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    title: 'Operational Health',
    description: 'Real-time monitoring and performance metrics',
    icon: BarChart3,
    color: 'text-green-600 dark:text-green-400',
  },
];

export function CorePillars() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Core Excellence Pillars</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="flex items-start gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className={`${pillar.color} flex-shrink-0`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
