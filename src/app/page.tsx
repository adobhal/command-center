import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            Command Center
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Chief Excellence Officer Platform
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            AI-powered finance automation, strategic insights, and operational excellence
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Finance Intelligence
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Automated reconciliation and financial insights
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              AI Insights
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Strategic recommendations and anomaly detection
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Automation
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Workflow automation and scheduled processes
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Strategic Analytics
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Predictive analytics and health scoring
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
