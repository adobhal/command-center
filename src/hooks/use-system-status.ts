import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/lib/shared/types/api-response';

interface SystemStatus {
  responseTime: number;
  uptime: number;
  aiStatus: 'online' | 'offline' | 'degraded';
  automationStatus: 'healthy' | 'warning' | 'error';
  quickbooksStatus: 'connected' | 'disconnected' | 'error';
}

export function useSystemStatus() {
  return useQuery<ApiResponse<SystemStatus>>({
    queryKey: ['dashboard', 'system-status'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/system-status');
      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
