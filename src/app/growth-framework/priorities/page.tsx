'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, ListOrdered, Activity } from 'lucide-react';

export default function GrowthPrioritiesPage() {
  const allocation = [
    { bucket: 'Run', pct: 55, time: '55%', budget: '$12K', initiatives: ['Ops review', 'Customer support'] },
    { bucket: 'Build', pct: 30, time: '30%', budget: '$8K', initiatives: ['ERP integration', 'New feature'] },
    { bucket: 'Scan', pct: 15, time: '15%', budget: '$2K', initiatives: ['Competitive intel', 'Tech trends'] },
  ];

  const priorityStack = [
    { rank: 1, title: 'Complete ERP integration', impact: 'critical', effort: 'high', ksf: true },
    { rank: 2, title: 'Hire Ops lead', impact: 'high', effort: 'medium', ksf: true },
    { rank: 3, title: 'Fix quote accuracy', impact: 'high', effort: 'low', ksf: true },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Growth Priorities
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Force the tradeoff: allocate scarce time/dollars between Run / Build / Scan
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Run vs Build vs Scan Allocation
            </CardTitle>
            <CardDescription>
              This week/month: % time + $ budget + top initiatives. Guardrails: min Build if scaling, min Scan if disruption risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {allocation.map((a) => (
                <div key={a.bucket} className="rounded-lg border p-4">
                  <p className="font-medium">{a.bucket}</p>
                  <p className="text-2xl font-bold mt-2">{a.time}</p>
                  <p className="text-sm text-zinc-500">Budget: {a.budget}</p>
                  <ul className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {a.initiatives.map((i) => (
                      <li key={i}>• {i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              Priority Stack (Top 10)
            </CardTitle>
            <CardDescription>
              Ranked list: impact, effort, dependency risk, &quot;supports KSF?&quot; tag
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityStack.map((p) => (
                <div key={p.rank} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-400 w-6">{p.rank}</span>
                    <p className="font-medium">{p.title}</p>
                    <Badge variant="outline">{p.impact}</Badge>
                    <Badge variant="outline">{p.effort}</Badge>
                    {p.ksf && <Badge>KSF</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Weekly Execution Pulse
            </CardTitle>
            <CardDescription>
              Commitments made vs delivered · Blockers aging · Decision queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-zinc-500">Commitments</p>
                <p className="text-2xl font-bold">8/10 <span className="text-sm font-normal text-zinc-500">delivered</span></p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-zinc-500">Blockers aging</p>
                <p className="text-2xl font-bold text-amber-600">3</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-zinc-500">Decision queue</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
