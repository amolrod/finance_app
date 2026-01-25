import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type {
  Category,
  CategoryType,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@/types/api';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (type?: CategoryType) => [...categoryKeys.lists(), type] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
};

// Get all categories
export function useCategories(type?: CategoryType) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  return useQuery({
    queryKey: categoryKeys.list(type),
    queryFn: async () => {
      const params = type ? { type } : undefined;
      return apiClient.get<Category[]>('/categories', params);
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}

// Get single category
export function useCategory(id: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async () => {
      return apiClient.get<Category>(`/categories/${id}`);
    },
    enabled: isAuthenticated && !!id,
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryDto) => {
      return apiClient.post<Category>('/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryDto }) => {
      return apiClient.patch<Category>(`/categories/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
