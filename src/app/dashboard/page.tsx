import { SystemStatusBar } from '@/components/dashboard/system-status-bar';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { ResourceCards } from '@/components/dashboard/resource-cards';
import { CorePillars } from '@/components/dashboard/core-pillars';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { AIInsightsPanel } from '@/components/dashboard/ai-insights-panel';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SystemStatusBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WelcomeSection />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ResourceCards />
            <AIInsightsPanel />
            <CorePillars />
          </div>
          <div className="space-y-6">
            <RecentActivity />
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  );
}
