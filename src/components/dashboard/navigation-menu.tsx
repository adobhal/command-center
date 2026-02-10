'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, BarChart2, BookOpen, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Growth Framework', href: '/growth-framework', icon: Target },
  { name: 'Bookkeeping', href: '/bookkeeping', icon: BookOpen },
  { name: 'Analysis', href: '/analysis', icon: BarChart2 },
];

export function NavigationMenu() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200/80 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 dark:bg-slate-700">
                <Sparkles className="h-4 w-4 text-slate-100" />
              </div>
              <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Command Center
              </span>
            </Link>
          </div>
          <div className="flex space-x-0.5">
            {navigation.map((item) => {
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
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
