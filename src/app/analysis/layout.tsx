'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileSpreadsheet, BarChart3, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const analysisNav = [
  { name: 'P&L Analysis', href: '/analysis/pl-analysis', icon: FileSpreadsheet },
  { name: 'Comprehensive Analysis', href: '/analysis/comprehensive', icon: BarChart3 },
];

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950">
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-1">
            <Link
              href="/analysis"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              <BarChart2 className="h-4 w-4" />
              Analysis
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            {analysisNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-50'
                  )}
                >
                  <Icon className="h-4 w-4 opacity-80" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
