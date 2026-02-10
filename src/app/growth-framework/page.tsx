import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, GitBranch, Zap, Users, ClipboardCheck } from 'lucide-react';

const modules = [
  {
    title: 'Growth Goals',
    description: 'Begin with the end in mind. 5-year shape, stage leap readiness, growth asset inventory.',
    href: '/growth-framework/goals',
    icon: Target,
  },
  {
    title: 'Process Design',
    description: 'Primary process + KSFs. Value chain view, KSF tracker, cost-to-serve by segment.',
    href: '/growth-framework/process',
    icon: GitBranch,
  },
  {
    title: 'Growth Priorities',
    description: 'Run vs Build vs Scan allocator. Priority stack, weekly execution pulse.',
    href: '/growth-framework/priorities',
    icon: Zap,
  },
  {
    title: 'People Alignment',
    description: 'Levers of control + rhythms. Belief systems, boundary systems, operating calendar.',
    href: '/growth-framework/people',
    icon: Users,
  },
  {
    title: 'Excellence Review',
    description: "The CXO's weekly meeting in software. Goal delta, process health, constraints.",
    href: '/growth-framework/excellence-review',
    icon: ClipboardCheck,
  },
];

export default function GrowthFrameworkPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Growth Framework
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Make growth intentional vs haphazard. Force clarity on how fast and what shape growth takes.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.title} href={module.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Open {module.title}
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
