import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Budget,
  CreateBudgetDto,
  UpdateBudgetDto,
} from '@/types/api';

export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (periodMonth?: string) => [...budgetKeys.lists(), { periodMonth }] as const,
  detail: (id: string) => [...budgetKeys.all, 'detail', id] as const,
  status: () => [...budgetKeys.all, 'status'] as const,
};

// Get all budgets for a period
export function useBudgets(periodMonth?: string) {
  return useQuery({
    queryKey: budgetKeys.list(periodMonth),
    queryFn: async () => {
      const params = periodMonth ? { periodMonth } : undefined;
      return apiClient.get<Budget[]>('/budgets', params);
    },
    placeholderData: (previousData) => previousData,
  });
}

// Get single budget
export function useBudget(id: string) {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: async () => {
      return apiClient.get<Budget>(`/budgets/${id}`);
    },
    enabled: !!id,
  });
}

// Get budget status (current month budget summary)
export function useBudgetStatus() {
  return useQuery({
    queryKey: budgetKeys.status(),
    queryFn: async () => {
      return apiClient.get<Budget[]>('/budgets/status');
    },
    refetchInterval: 60 * 1000, // Refresh every minute
    placeholderData: (previousData) => previousData,
  });
}

// Create budget
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBudgetDto) => {
      return apiClient.post<Budget>('/budgets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

// Update budget
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBudgetDto }) => {
      return apiClient.patch<Budget>(`/budgets/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(variables.id) });
    },
  });
}

// Delete budget
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
