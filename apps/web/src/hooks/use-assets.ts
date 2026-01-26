import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  AssetType,
  AssetSearchResult,
} from '@/types/api';

// Query keys
const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: { search?: string; type?: string }) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  search: (query: string) => [...assetKeys.all, 'search', query] as const,
};

// Get all assets
export function useAssets(filters: { search?: string; type?: AssetType } = {}) {
  return useQuery({
    queryKey: assetKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.search) params.search = filters.search;
      if (filters.type) params.type = filters.type;
      const response = await apiClient.get<Asset[]>('/assets', params);
      return response;
    },
  });
}

export function useAssetSearch(query: string) {
  const normalized = query.trim();
  return useQuery({
    queryKey: assetKeys.search(normalized),
    queryFn: async () => {
      return apiClient.get<AssetSearchResult[]>('/assets/search', { query: normalized });
    },
    enabled: normalized.length >= 2,
  });
}

// Get single asset
export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: async () => {
      return apiClient.get<Asset>(`/assets/${id}`);
    },
    enabled: !!id,
  });
}

// Create asset
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssetDto) => apiClient.post<Asset>('/assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

// Update asset
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetDto }) =>
      apiClient.put<Asset>(`/assets/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) });
    },
  });
}

// Delete asset
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}
