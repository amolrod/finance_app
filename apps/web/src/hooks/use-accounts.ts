import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Account,
  AccountListResponse,
  AccountSummary,
  CreateAccountDto,
  UpdateAccountDto,
} from '@/types/api';

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (filters?: object) => [...accountKeys.lists(), filters] as const,
  detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
  summary: () => [...accountKeys.all, 'summary'] as const,
};

// Get all accounts
export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: accountKeys.list({ includeArchived }),
    queryFn: async () => {
      const params = includeArchived ? { includeArchived: 'true' } : undefined;
      const response = await apiClient.get<AccountListResponse>('/accounts', params);
      return response.data;
    },
    placeholderData: (previousData) => previousData, // Mostrar datos previos mientras carga
  });
}

// Get single account
export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: async () => {
      return apiClient.get<Account>(`/accounts/${id}`);
    },
    enabled: !!id,
  });
}

// Get account summary
export function useAccountSummary(targetCurrency?: string) {
  return useQuery({
    queryKey: [...accountKeys.summary(), targetCurrency],
    queryFn: async () => {
      const params = targetCurrency ? { currency: targetCurrency } : undefined;
      return apiClient.get<AccountSummary>('/accounts/summary', params);
    },
    placeholderData: (previousData) => previousData,
  });
}

// Create account
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAccountDto) => {
      return apiClient.post<Account>('/accounts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

// Update account
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccountDto }) => {
      return apiClient.patch<Account>(`/accounts/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.id) });
    },
  });
}

// Delete account (soft delete)
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
