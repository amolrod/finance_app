import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type {
  InvestmentOperation,
  CreateInvestmentOperationDto,
  UpdateInvestmentOperationDto,
  HoldingSummary,
  PortfolioSummary,
  OperationType,
  PriceHistoryResponse,
  InvestmentGoal,
  CreateInvestmentGoalDto,
  UpdateInvestmentGoalDto,
} from '@/types/api';

interface OperationsResponse {
  data: InvestmentOperation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OperationFilters {
  assetId?: string;
  type?: OperationType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Query keys
const investmentKeys = {
  all: ['investments'] as const,
  operations: () => [...investmentKeys.all, 'operations'] as const,
  operationsList: (filters: OperationFilters) => [...investmentKeys.operations(), filters] as const,
  operation: (id: string) => [...investmentKeys.operations(), id] as const,
  holdings: () => [...investmentKeys.all, 'holdings'] as const,
  portfolio: () => [...investmentKeys.all, 'portfolio'] as const,
  priceHistory: (range: string, assetIds: string[]) => [
    ...investmentKeys.all,
    'price-history',
    range,
    assetIds.join(','),
  ] as const,
  goals: () => [...investmentKeys.all, 'goals'] as const,
  goal: (id: string) => [...investmentKeys.all, 'goals', id] as const,
};

// Get all operations
export function useInvestmentOperations(filters: OperationFilters = {}) {
  const isAuthenticated = useAuthStore((state) => !state.isLoading && !!state.accessToken);

  return useQuery({
    queryKey: investmentKeys.operationsList(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.assetId) params.assetId = filters.assetId;
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.page) params.page = String(filters.page);
      if (filters.limit) params.limit = String(filters.limit);
      
      return apiClient.get<OperationsResponse>('/investments/operations', params);
    },
    enabled: isAuthenticated,
  });
}

// Get single operation
export function useInvestmentOperation(id: string) {
  const isAuthenticated = useAuthStore((state) => !state.isLoading && !!state.accessToken);

  return useQuery({
    queryKey: investmentKeys.operation(id),
    queryFn: async () => {
      return apiClient.get<InvestmentOperation>(`/investments/operations/${id}`);
    },
    enabled: isAuthenticated && !!id,
  });
}

// Get holdings
export function useHoldings() {
  const isAuthenticated = useAuthStore((state) => !state.isLoading && !!state.accessToken);

  return useQuery({
    queryKey: investmentKeys.holdings(),
    queryFn: async () => {
      return apiClient.get<HoldingSummary[]>('/investments/holdings');
    },
    enabled: isAuthenticated,
  });
}

// Get portfolio summary
export function usePortfolioSummary() {
  const isAuthenticated = useAuthStore((state) => !state.isLoading && !!state.accessToken);

  return useQuery({
    queryKey: investmentKeys.portfolio(),
    queryFn: async () => {
      return apiClient.get<PortfolioSummary>('/investments/portfolio');
    },
    enabled: isAuthenticated,
  });
}

// Create operation
export function useCreateInvestmentOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvestmentOperationDto) =>
      apiClient.post<InvestmentOperation>('/investments/operations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.operations() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.portfolio() });
    },
  });
}

// Update operation
export function useUpdateInvestmentOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvestmentOperationDto }) =>
      apiClient.put<InvestmentOperation>(`/investments/operations/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.operations() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.operation(id) });
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.portfolio() });
    },
  });
}

// Delete operation
export function useDeleteInvestmentOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/investments/operations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.operations() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.portfolio() });
    },
  });
}

export function useInvestmentPriceHistory(assetIds: string[], range: string) {
  const isAuthenticated = useAuthStore((state) => !state.isLoading && !!state.accessToken);

  return useQuery({
    queryKey: investmentKeys.priceHistory(range, assetIds),
    queryFn: async () => {
      const params: Record<string, string> = { range };
      if (assetIds.length > 0) {
        params.assetIds = assetIds.join(',');
      }
      return apiClient.get<PriceHistoryResponse>('/investments/price-history', params);
    },
    enabled: isAuthenticated && assetIds.length > 0,
  });
}

export function useInvestmentGoals() {
  const isAuthenticated = useAuthStore((state) => !state.isLoading && !!state.accessToken);

  return useQuery({
    queryKey: investmentKeys.goals(),
    queryFn: async () => apiClient.get<InvestmentGoal[]>('/investments/goals'),
    enabled: isAuthenticated,
  });
}

export function useCreateInvestmentGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvestmentGoalDto) =>
      apiClient.post<InvestmentGoal>('/investments/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.goals() });
    },
  });
}

export function useUpdateInvestmentGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvestmentGoalDto }) =>
      apiClient.put<InvestmentGoal>(`/investments/goals/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.goals() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.goal(id) });
    },
  });
}

export function useDeleteInvestmentGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/investments/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.goals() });
    },
  });
}

export function useCreateInvestmentOperationsBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (operations: CreateInvestmentOperationDto[]) =>
      apiClient.post<{ created: number }>('/investments/operations/batch', { operations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.operations() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.portfolio() });
    },
  });
}

// Refresh market prices for all assets (manual)
export function useRefreshPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post<{ message: string; results: unknown[] }>('/investments/prices/refresh-all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.portfolio() });
    },
  });
}

// Auto-refresh prices every 5 minutes
export function useAutoRefreshPrices(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => !state.isLoading && !!state.accessToken);

  return useQuery({
    queryKey: [...investmentKeys.all, 'auto-refresh'],
    queryFn: async () => {
      const result = await apiClient.post<{ message: string; results: unknown[] }>('/investments/prices/refresh-all', {});
      // Invalidate holdings and portfolio to reflect new prices
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.portfolio() });
      return { ...result, lastUpdated: new Date().toISOString() };
    },
    enabled: enabled && isAuthenticated,
    refetchInterval: enabled && isAuthenticated ? 5 * 60 * 1000 : false, // 5 minutos
    refetchIntervalInBackground: false, // Solo cuando la pestaña está activa
    staleTime: 4 * 60 * 1000, // Considerar stale después de 4 minutos
  });
}
