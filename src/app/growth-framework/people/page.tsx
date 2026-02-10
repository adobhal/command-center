'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Shield, BarChart3, Users2, Calendar } from 'lucide-react';

export default function PeopleAlignmentPage() {
  const levers = [
    {
      type: 'Belief systems',
      icon: MessageSquare,
      desc: 'Narrative + principles (what we stand for)',
      examples: ['Mission statement', 'Core values', 'Culture doc'],
    },
    {
      type: 'Boundary systems',
      icon: Shield,
      desc: 'Explicit "won\'t do" rules, risk limits, quality bars',
      examples: ['Quality gates', 'Risk limits', 'Compliance checklist'],
    },
    {
      type: 'Diagnostic systems',
      icon: BarChart3,
      desc: 'Metrics, OKRs, incentives, scorecards',
      examples: ['KPI dashboard', 'OKR reviews', 'Incentive plan'],
    },
    {
      type: 'Interactive systems',
      icon: Users2,
      desc: 'Coaching, 1:1s, skip-levels, learning loops',
      examples: ['Weekly 1:1s', 'Skip-level meetings', 'Retrospectives'],
    },
  ];

  const rhythms = [
    { cadence: 'Daily', items: ['Standup', 'Ops check'] },
    { cadence: 'Weekly', items: ['Exec ops review', 'KPI review', 'Constraint removal'] },
    { cadence: 'Monthly', items: ['Process health', 'Capacity planning'] },
    { cadence: 'Quarterly', items: ['Goals reset', 'Org design', 'Stage readiness'] },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          People Alignment
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Levers of control + rhythms — make execution repeatable through culture + systems, not heroics
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Levers of Control Dashboard
            </CardTitle>
            <CardDescription>
              Four control systems that shape behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {levers.map((lever) => {
                const Icon = lever.icon;
                return (
                  <div
                    key={lever.type}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <p className="font-medium">{lever.type}</p>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">{lever.desc}</p>
                    <ul className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {lever.examples.map((e) => (
                        <li key={e}>• {e}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Operating Rhythm Calendar
            </CardTitle>
            <CardDescription>
              Embedded cadence: agenda templates + required inputs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {rhythms.map((r) => (
                <div key={r.cadence} className="rounded-lg border p-4">
                  <p className="font-medium">{r.cadence}</p>
                  <ul className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                    {r.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
