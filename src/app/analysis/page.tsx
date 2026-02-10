import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, BarChart3 } from 'lucide-react';

const analysisSections = [
  {
    title: 'P&L Analysis',
    description: 'Upload your P&L statement to get AI-powered financial insights and recommendations',
    href: '/analysis/pl-analysis',
    icon: FileSpreadsheet,
  },
  {
    title: 'Comprehensive Analysis',
    description: 'Upload a ZIP of all financial data (P&L, Balance Sheet, GL, Customers, Employees, Vendors) for full business insights',
    href: '/analysis/comprehensive',
    icon: BarChart3,
  },
];

export default function AnalysisPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Analysis
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Financial and business analysis tools for P&L insights and comprehensive data review
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {analysisSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.title} href={section.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 border-slate-200/80 dark:border-slate-700/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                      <Icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                    Open {section.title}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
