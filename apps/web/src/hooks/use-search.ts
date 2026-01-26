import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export interface SearchResult {
  id: string;
  type: 'transaction' | 'account' | 'category' | 'budget' | 'tag';
  title: string;
  subtitle?: string;
  icon?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface GlobalSearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export function useGlobalSearch(query: string, enabled = true) {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return useQuery<GlobalSearchResponse>({
    queryKey: ['global-search', query],
    queryFn: async () => {
      const response = await apiClient.get<GlobalSearchResponse>('/search', {
        q: query,
        limit: 15,
      });
      return response;
    },
    enabled: isAuthenticated && enabled && query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60, // 1 minute
  });
}
