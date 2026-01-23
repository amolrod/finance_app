import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  InvestmentOperation,
  CreateInvestmentOperationDto,
  UpdateInvestmentOperationDto,
  HoldingSummary,
  PortfolioSummary,
  OperationType,
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
};

// Get all operations
export function useInvestmentOperations(filters: OperationFilters = {}) {
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
  });
}

// Get single operation
export function useInvestmentOperation(id: string) {
  return useQuery({
    queryKey: investmentKeys.operation(id),
    queryFn: async () => {
      return apiClient.get<InvestmentOperation>(`/investments/operations/${id}`);
    },
    enabled: !!id,
  });
}

// Get holdings
export function useHoldings() {
  return useQuery({
    queryKey: investmentKeys.holdings(),
    queryFn: async () => {
      return apiClient.get<HoldingSummary[]>('/investments/holdings');
    },
  });
}

// Get portfolio summary
export function usePortfolioSummary() {
  return useQuery({
    queryKey: investmentKeys.portfolio(),
    queryFn: async () => {
      return apiClient.get<PortfolioSummary>('/investments/portfolio');
    },
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

  return useQuery({
    queryKey: [...investmentKeys.all, 'auto-refresh'],
    queryFn: async () => {
      const result = await apiClient.post<{ message: string; results: unknown[] }>('/investments/prices/refresh-all', {});
      // Invalidate holdings and portfolio to reflect new prices
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
      queryClient.invalidateQueries({ queryKey: investmentKeys.portfolio() });
      return { ...result, lastUpdated: new Date().toISOString() };
    },
    enabled,
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    refetchIntervalInBackground: false, // Solo cuando la pestaña está activa
    staleTime: 4 * 60 * 1000, // Considerar stale después de 4 minutos
  });
}
