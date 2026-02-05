import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/lib/shared/types/api-response';

interface DashboardMetrics {
  transactions: number;
  reconciliations: number;
  bankStatements: number;
  unmatchedItems: number;
}

export function useDashboardMetrics() {
  return useQuery<ApiResponse<DashboardMetrics>>({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
}
