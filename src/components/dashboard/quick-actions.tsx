'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Upload, Search, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { FileSpreadsheet, BarChart3 } from 'lucide-react';

const actions = [
  {
    label: 'Sync QuickBooks',
    icon: RefreshCw,
    href: '/quickbooks/connect',
  },
  {
    label: 'Upload Statement',
    icon: Upload,
    href: '/bank-statements/upload',
  },
  {
    label: 'Start Reconciliation',
    icon: Search,
    href: '/reconciliation',
  },
  {
    label: 'P&L Analysis',
    icon: FileSpreadsheet,
    href: '/analytics/pl-analysis',
  },
  {
    label: 'Comprehensive Analysis',
    icon: BarChart3,
    href: '/analytics/comprehensive',
  },
  {
    label: 'AI Insights',
    icon: Sparkles,
    href: '/dashboard#insights',
    action: () => {
      document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;
            if (action.href) {
              return (
                <Link key={action.label} href={action.href}>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              );
            }
            return (
              <Button
                key={action.label}
                variant="outline"
                className="w-full justify-start"
                onClick={action.action}
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
