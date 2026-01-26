import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type {
  RecurringTransaction,
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
  RecurringTransactionFilters,
} from '@/types/api';

export const recurringKeys = {
  all: ['recurring-transactions'] as const,
  lists: () => [...recurringKeys.all, 'list'] as const,
  list: (filters?: RecurringTransactionFilters) => [...recurringKeys.lists(), filters] as const,
  detail: (id: string) => [...recurringKeys.all, 'detail', id] as const,
  upcoming: (days?: number) => [...recurringKeys.all, 'upcoming', days] as const,
};

// Get all recurring transactions
export function useRecurringTransactions(filters?: RecurringTransactionFilters) {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return useQuery({
    queryKey: recurringKeys.list(filters),
    queryFn: async () => {
      return apiClient.get<RecurringTransaction[]>('/recurring-transactions', filters);
    },
    enabled: isAuthenticated,
  });
}

// Get upcoming transactions preview
export function useUpcomingTransactions(days: number = 30) {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return useQuery({
    queryKey: recurringKeys.upcoming(days),
    queryFn: async () => {
      return apiClient.get<{ recurringId: string; description: string; amount: string; date: string; type: string }[]>(
        '/recurring-transactions/upcoming',
        { days }
      );
    },
    enabled: isAuthenticated,
  });
}

// Get single recurring transaction
export function useRecurringTransaction(id: string) {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return useQuery({
    queryKey: recurringKeys.detail(id),
    queryFn: async () => {
      return apiClient.get<RecurringTransaction>(`/recurring-transactions/${id}`);
    },
    enabled: isAuthenticated && !!id,
  });
}

// Create recurring transaction
export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecurringTransactionDto) => {
      return apiClient.post<RecurringTransaction>('/recurring-transactions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}

// Update recurring transaction
export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecurringTransactionDto }) => {
      return apiClient.patch<RecurringTransaction>(`/recurring-transactions/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      queryClient.invalidateQueries({ queryKey: recurringKeys.detail(variables.id) });
    },
  });
}

// Delete recurring transaction
export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/recurring-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}

// Pause recurring transaction
export function usePauseRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post<RecurringTransaction>(`/recurring-transactions/${id}/pause`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      queryClient.invalidateQueries({ queryKey: recurringKeys.detail(id) });
    },
  });
}

// Resume recurring transaction
export function useResumeRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post<RecurringTransaction>(`/recurring-transactions/${id}/resume`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      queryClient.invalidateQueries({ queryKey: recurringKeys.detail(id) });
    },
  });
}
