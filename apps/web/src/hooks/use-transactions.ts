import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilters,
  TransactionListResponse,
} from '@/types/api';
import { accountKeys } from './use-accounts';
import { budgetKeys } from './use-budgets';

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters?: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  infinite: (filters?: TransactionFilters) => [...transactionKeys.all, 'infinite', filters] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
};

// Get transactions with pagination
export function useTransactions(filters?: TransactionFilters) {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      return apiClient.get<TransactionListResponse>('/transactions', filters);
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}

// Infinite scroll transactions
export function useInfiniteTransactions(filters?: Omit<TransactionFilters, 'page'>) {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  
  return useInfiniteQuery({
    queryKey: transactionKeys.infinite(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return apiClient.get<TransactionListResponse>('/transactions', {
        ...filters,
        page: pageParam,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: isAuthenticated,
  });
}

// Get single transaction
export function useTransaction(id: string) {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: async () => {
      return apiClient.get<Transaction>(`/transactions/${id}`);
    },
    enabled: isAuthenticated && !!id,
  });
}

// Create transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionDto) => {
      return apiClient.post<Transaction>('/transactions', data);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

// Update transaction (via reversal + new)
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransactionDto }) => {
      return apiClient.put<Transaction>(`/transactions/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

// Delete transaction (cancel/reverse)
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/transactions/${id}`);
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });

      // Snapshot previous values for all transaction lists
      const previousQueries: { queryKey: readonly unknown[]; data: unknown }[] = [];
      
      // Get all transaction list queries
      queryClient.getQueriesData({ queryKey: transactionKeys.lists() }).forEach(([queryKey, data]) => {
        previousQueries.push({ queryKey, data });
        
        // Optimistically remove the transaction from each list
        if (data && typeof data === 'object' && 'data' in data) {
          const listData = data as TransactionListResponse;
          queryClient.setQueryData(queryKey, {
            ...listData,
            data: listData.data.filter((t) => t.id !== deletedId),
            total: listData.total - 1,
          });
        }
      });

      return { previousQueries };
    },
    onError: (_err, _deletedId, context) => {
      // Rollback to previous values on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

// Export transactions to CSV
export async function exportTransactionsCsv(filters?: TransactionFilters): Promise<Blob> {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/transactions/export?${params}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.accessToken : ''}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
}
