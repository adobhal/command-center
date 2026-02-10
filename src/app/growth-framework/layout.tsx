'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Target, GitBranch, Zap, Users, ClipboardCheck, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const growthNav = [
  { name: 'Growth Goals', href: '/growth-framework/goals', icon: Target },
  { name: 'Process Design', href: '/growth-framework/process', icon: GitBranch },
  { name: 'Growth Priorities', href: '/growth-framework/priorities', icon: Zap },
  { name: 'People Alignment', href: '/growth-framework/people', icon: Users },
  { name: 'Excellence Review', href: '/growth-framework/excellence-review', icon: ClipboardCheck },
];

export default function GrowthFrameworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-1">
            <Link
              href="/growth-framework"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              <BookOpen className="h-4 w-4" />
              Growth Framework
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            {growthNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
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
