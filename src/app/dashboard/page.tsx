'use client';

import { useState, useEffect } from 'react';
import { SystemStatusBar } from '@/components/dashboard/system-status-bar';
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { HealthMetrics } from '@/components/dashboard/health-metrics';
import { RoleToggle, type Role } from '@/components/dashboard/role-toggle';
import { RoleStrip } from '@/components/dashboard/role-strip';
import { FocusPanel } from '@/components/dashboard/focus-panel';
import { PLSummaryCard } from '@/components/dashboard/pl-summary-card';
import { AIInsightsPanel } from '@/components/dashboard/ai-insights-panel';
import { SidebarActions } from '@/components/dashboard/sidebar-actions';

const ROLE_STORAGE_KEY = 'dashboard-role';

export default function DashboardPage() {
  const [role, setRole] = useState<Role>('ceo');

  useEffect(() => {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY) as Role | null;
    if (stored && ['ceo', 'cfo', 'cso'].includes(stored)) setRole(stored);
  }, []);

  const handleRoleChange = (r: Role) => {
    setRole(r);
    if (typeof localStorage !== 'undefined') localStorage.setItem(ROLE_STORAGE_KEY, r);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950/95 executive-dashboard">
      <SystemStatusBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DashboardHero />
          <RoleToggle role={role} onRoleChange={handleRoleChange} />
        </div>
        <div className="mt-4 flex flex-col gap-4">
          <HealthMetrics />
          <RoleStrip role={role} />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <FocusPanel />
            {role === 'cfo' && <PLSummaryCard />}
            <AIInsightsPanel />
          </div>
          <div className="space-y-6">
            <SidebarActions />
          </div>
        </div>
      </main>
    </div>
  );
}
