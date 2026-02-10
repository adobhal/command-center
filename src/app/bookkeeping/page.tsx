import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Upload, Search } from 'lucide-react';

const bookkeepingSections = [
  {
    title: 'QuickBooks',
    description: 'Connect your QuickBooks Online account to sync transactions and journal entries',
    href: '/bookkeeping/quickbooks',
    icon: RefreshCw,
  },
  {
    title: 'Bank Statements',
    description: 'Upload CSV or OFX bank statement files to import transactions',
    href: '/bookkeeping/bank-statements',
    icon: Upload,
  },
  {
    title: 'Reconciliation',
    description: 'Match bank transactions with QuickBooks entries using AI-powered matching',
    href: '/bookkeeping/reconciliation',
    icon: Search,
  },
];

export default function BookkeepingPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Bookkeeping
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage your financial data: sync QuickBooks, upload bank statements, and reconcile transactions
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
        {bookkeepingSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.title} href={section.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
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
