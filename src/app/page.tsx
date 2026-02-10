import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, BarChart2, Target, ChevronRight } from 'lucide-react';

const sections = [
  {
    title: 'Dashboard',
    description: 'Executive home with role-based views (CEO/CFO/CSO), health metrics, focus panel, and AI insights',
    href: '/dashboard',
    icon: LayoutDashboard,
    primary: true,
  },
  {
    title: 'Bookkeeping',
    description: 'Sync QuickBooks, upload bank statements, and reconcile transactions with AI-powered matching',
    href: '/bookkeeping',
    icon: BookOpen,
    primary: false,
  },
  {
    title: 'Analysis',
    description: 'P&L analysis and comprehensive business insights from your financial data',
    href: '/analysis',
    icon: BarChart2,
    primary: false,
  },
  {
    title: 'Growth Framework',
    description: 'Goals, process design, priorities, people alignment, and the weekly excellence review',
    href: '/growth-framework',
    icon: Target,
    primary: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950/95">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Chief Excellence Officer Platform
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Finance automation. Strategic insights. Growth clarity.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Where to go
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.title} href={section.href}>
                  <Card
                    className={`h-full transition-all hover:shadow-md border-slate-200/80 dark:border-slate-700/80
                      ${section.primary
                        ? 'hover:border-slate-300 dark:hover:border-slate-600 ring-1 ring-slate-200/50 dark:ring-slate-700/50'
                        : 'hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-lg p-2 ${
                              section.primary
                                ? 'bg-slate-800 text-slate-100 dark:bg-slate-700 dark:text-slate-50'
                                : 'bg-slate-100 dark:bg-slate-800'
                            }`}
                          >
                            <Icon className={`h-6 w-6 ${section.primary ? 'text-slate-100 dark:text-slate-50' : 'text-slate-600 dark:text-slate-400'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{section.title}</CardTitle>
                            {section.primary && (
                              <span className="ml-2 text-xs font-medium text-slate-500">Start here</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                      </div>
                      <CardDescription className="mt-2 text-slate-600 dark:text-slate-400">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant={section.primary ? 'default' : 'outline'}
                        className={`w-full ${section.primary ? 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'}`}
                      >
                        Open {section.title}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white/80 p-6 dark:border-slate-700/80 dark:bg-slate-900/50">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Quick start
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Most users begin at the Dashboard for an executive overview, then use Bookkeeping for daily finance tasks and Analysis for deeper insights.
          </p>
        </div>
      </main>
    </div>
  );
}
