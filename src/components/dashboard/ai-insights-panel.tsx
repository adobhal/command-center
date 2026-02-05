'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'anomaly' | 'optimization';
  category: string;
  title: string;
  description: string;
  priority: number;
  actionable: boolean;
  actionUrl?: string;
  confidence?: string;
}

export function AIInsightsPanel() {
  const { data, isLoading, refetch } = useQuery<{ data: AIInsight[] }>({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const response = await fetch('/api/ai/insights?limit=5');
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const generateInsights = async () => {
    try {
      await fetch('/api/ai/insights', { method: 'POST' });
      refetch();
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  };

  const insights = data?.data || [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return AlertTriangle;
      case 'prediction':
        return TrendingUp;
      case 'optimization':
        return Zap;
      default:
        return Sparkles;
    }
  };

  const getBadgeVariant = (priority: number) => {
    if (priority >= 8) return 'destructive';
    if (priority >= 6) return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Insights</CardTitle>
          <Button onClick={generateInsights} size="sm" variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="py-8 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-500">No insights yet</p>
            <Button onClick={generateInsights} size="sm" variant="outline" className="mt-4">
              Generate Insights
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => {
              const Icon = getIcon(insight.type);
              return (
                <div
                  key={insight.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                            {insight.title}
                          </h4>
                          <Badge variant={getBadgeVariant(insight.priority)} className="text-xs">
                            P{insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {insight.description}
                        </p>
                        {insight.actionable && insight.actionUrl && (
                          <Button
                            size="sm"
                            variant="link"
                            className="mt-2 h-auto p-0 text-xs"
                            onClick={() => {
                              window.location.href = insight.actionUrl!;
                            }}
                          >
                            Take Action →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
