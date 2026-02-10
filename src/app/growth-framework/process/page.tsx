'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Gauge, DollarSign, FlipHorizontal } from 'lucide-react';

export default function ProcessDesignPage() {
  const processStages = [
    { name: 'Lead', time: '2d', defectRate: '2%', handoffs: 1 },
    { name: 'Quote', time: '1d', defectRate: '5%', handoffs: 2 },
    { name: 'Order', time: '0.5d', defectRate: '1%', handoffs: 1 },
    { name: 'Fulfill', time: '3d', defectRate: '3%', handoffs: 2 },
    { name: 'Cash', time: '15d', defectRate: '2%', handoffs: 1 },
  ];

  const ksfs = [
    { name: 'Quote accuracy', category: 'quality', target: '>95%', current: '92%' },
    { name: 'Order-to-ship time', category: 'speed', target: '<5d', current: '4.5d' },
    { name: 'Defect rate', category: 'reliability', target: '<3%', current: '2.8%' },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Process Design
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Primary process + KSFs — the one process that must be optimized for the next phase
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Primary Process Map (Value Chain View)
            </CardTitle>
            <CardDescription>
              Swimlane with timestamps + defect rates + handoffs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-4">
              {processStages.map((stage, i) => (
                <div key={i} className="flex items-center gap-1 flex-shrink-0">
                  <div className="rounded-lg border border-zinc-200 bg-white p-4 min-w-[120px] dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="font-medium text-sm">{stage.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">{stage.time} · {stage.defectRate} defect</p>
                    <p className="text-xs text-zinc-500">{stage.handoffs} handoff(s)</p>
                  </div>
                  {i < processStages.length - 1 && (
                    <span className="text-zinc-400">→</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              KSF Tracker
            </CardTitle>
            <CardDescription>
              5–7 KSFs with leading indicators (quality, speed, cost, reliability, compliance)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ksfs.map((ksf, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{ksf.name}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{ksf.category}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Current: {ksf.current}</p>
                    <p className="text-xs text-zinc-500">Target: {ksf.target}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost-to-Serve & Unit Economics by Segment
            </CardTitle>
            <CardDescription>
              Where complexity is compounding — complexity grows exponentially if unchecked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { segment: 'SMB', costToServe: '$45', margin: '32%' },
                { segment: 'Mid-Market', costToServe: '$120', margin: '28%' },
                { segment: 'Enterprise', costToServe: '$380', margin: '22%' },
              ].map((s) => (
                <div key={s.segment} className="rounded-lg border p-4">
                  <p className="font-medium">{s.segment}</p>
                  <p className="text-sm text-zinc-500">Cost-to-serve: {s.costToServe}</p>
                  <p className="text-sm text-zinc-500">Margin: {s.margin}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlipHorizontal className="h-5 w-5" />
              Growth Assets vs Barriers Canvas
            </CardTitle>
            <CardDescription>
              Two-column: Assets (what scales) vs Barriers (bottlenecks requiring irreversible investment)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-green-200 p-4 dark:border-green-800">
                <p className="font-medium text-green-800 dark:text-green-200">Assets</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Brand, process, team, IP</p>
              </div>
              <div className="rounded-lg border border-amber-200 p-4 dark:border-amber-800">
                <p className="font-medium text-amber-800 dark:text-amber-200">Barriers</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Capacity gaps, systems, compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
