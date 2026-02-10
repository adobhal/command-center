'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Rocket, Package } from 'lucide-react';

export default function GrowthGoalsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Growth Goals
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Begin with the end in mind — make growth intentional vs haphazard
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              5-Year Shape of Company
            </CardTitle>
            <CardDescription>
              How large and complex in 5 years? Headcount bands, product lines, geo expansion, systems maturity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-zinc-500">Headcount</p>
                <p className="text-xl font-bold">50 → 200</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-zinc-500">Product Lines</p>
                <p className="text-xl font-bold">1 → 3</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-zinc-500">Geography</p>
                <p className="text-xl font-bold">US → US + EU</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-zinc-500">Systems Maturity</p>
                <p className="text-xl font-bold">Manual → Automated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Stage Leap Readiness
            </CardTitle>
            <CardDescription>
              Should we jump to next stage? Gating metrics + required buildouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Revenue threshold ($2M ARR)', done: true },
                { label: 'Process documentation complete', done: true },
                { label: 'Key hires in place (CFO, Ops)', done: false },
                { label: 'Systems integration complete', done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Badge variant={item.done ? 'default' : 'secondary'}>
                    {item.done ? '✓' : '—'}
                  </Badge>
                  <span className={item.done ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-50'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Growth Asset Inventory
            </CardTitle>
            <CardDescription>
              People/process/trends you control that make incremental growth easier. Warning: easy ≠ profitable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                <p className="font-medium text-green-800 dark:text-green-200">Assets (what scales)</p>
                <ul className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Established brand in niche</li>
                  <li>• Repeatable sales process</li>
                  <li>• Low churn customer base</li>
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                <p className="font-medium text-amber-800 dark:text-amber-200">Profitability check</p>
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  Easy growth ≠ profitable growth. Validate unit economics before scaling.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
