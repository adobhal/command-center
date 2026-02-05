import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/lib/shared/types/api-response';

export interface ActivityItem {
  id: string;
  type: 'sync' | 'upload' | 'reconciliation' | 'ai' | 'automation';
  message: string;
  timestamp: string;
}

export function useRecentActivity() {
  return useQuery<ApiResponse<ActivityItem[]>>({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/activity');
      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
}
