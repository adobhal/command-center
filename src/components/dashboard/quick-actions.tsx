'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Upload, Search, FileText, Sparkles } from 'lucide-react';

const actions = [
  {
    label: 'Sync QuickBooks',
    icon: RefreshCw,
    action: () => {
      window.location.href = '/quickbooks/connect';
    },
  },
  {
    label: 'Upload Statement',
    icon: Upload,
    action: () => {
      window.location.href = '/bank-statements/upload';
    },
  },
  {
    label: 'AI Analysis',
    icon: Sparkles,
    action: () => console.log('AI Analysis'),
  },
  {
    label: 'Start Reconciliation',
    icon: Search,
    action: () => {
      window.location.href = '/reconciliation';
    },
  },
  {
    label: 'Generate Report',
    icon: FileText,
    action: () => console.log('Generate Report'),
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
