'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, GitBranch, AlertTriangle, Zap, CheckSquare } from 'lucide-react';
import Link from 'next/link';

export default function ExcellenceReviewPage() {
  const offTargetGoals = [
    { metric: 'Revenue', target: '$100K', actual: '$84K', delta: '-16%' },
    { metric: 'Gross margin', target: '45%', actual: '42%', delta: '-3pp' },
  ];

  const processHealth = [
    { name: 'Lead-to-cash cycle time', value: '21.5d', target: '<20d', status: 'at_risk' },
    { name: 'Defect rate', value: '2.8%', target: '<3%', status: 'ok' },
    { name: 'Throughput', value: '142/wk', target: '140/wk', status: 'ok' },
  ];

  const topConstraints = [
    { name: 'Manufacturing capacity at 92%', owner: 'Ops' },
    { name: 'ERP integration delays', owner: 'IT' },
  ];

  const runBuildScan = [
    { bucket: 'Run', planned: 55, actual: 52 },
    { bucket: 'Build', planned: 30, actual: 28 },
    { bucket: 'Scan', planned: 15, actual: 20 },
  ];

  const nextWeekTodos = [
    { title: 'Approve Q1 budget', owner: 'CEO', due: 'Fri' },
    { title: 'Review constraint #1', owner: 'Ops', due: 'Wed' },
    { title: 'Sign vendor contract', owner: 'CFO', due: 'Thu' },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Excellence Review
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          The CXO&apos;s weekly meeting in software — one recurring meeting that runs the company
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Delta
            </CardTitle>
            <CardDescription>
              What&apos;s off-target and why
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offTargetGoals.map((g) => (
                <div key={g.metric} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{g.metric}</p>
                    <p className="text-sm text-zinc-500">
                      {g.actual} / {g.target}
                    </p>
                  </div>
                  <Badge variant="destructive">{g.delta}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Primary Process Health
            </CardTitle>
            <CardDescription>
              Cycle time, defects, throughput
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processHealth.map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-zinc-500">
                      {p.value} (target: {p.target})
                    </p>
                  </div>
                  <Badge variant={p.status === 'ok' ? 'default' : 'destructive'}>
                    {p.status === 'ok' ? 'OK' : 'At risk'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top Constraints
            </CardTitle>
            <CardDescription>
              What&apos;s limiting growth now
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topConstraints.map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-zinc-500">{c.owner}</p>
                </div>
              ))}
            </div>
            <Link href="/growth-framework/priorities" className="text-sm text-blue-600 dark:text-blue-400 mt-2 block">
              View all constraints →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Run/Build/Scan Allocation
            </CardTitle>
            <CardDescription>
              Did we invest where we said we would?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {runBuildScan.map((r) => (
                <div key={r.bucket} className="rounded-lg border p-4">
                  <p className="font-medium">{r.bucket}</p>
                  <p className="text-2xl font-bold mt-2">
                    {r.actual}% <span className="text-sm font-normal text-zinc-500">/ {r.planned}% planned</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Next-Week To-Do
            </CardTitle>
            <CardDescription>
              5–10 actions, owners, dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nextWeekTodos.map((t) => (
                <div key={t.title} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="font-medium">{t.title}</p>
                  <span className="text-sm text-zinc-500">
                    {t.owner} · Due {t.due}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
