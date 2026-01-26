import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import type {
  BankFormat,
  ImportPreview,
  ConfirmImportDto,
  ImportResultDto,
} from '@/types/api';
import { transactionKeys } from './use-transactions';
import { accountKeys } from './use-accounts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const importKeys = {
  all: ['import'] as const,
  formats: () => [...importKeys.all, 'formats'] as const,
  preview: (accountId: string) => [...importKeys.all, 'preview', accountId] as const,
};

// Get supported bank formats
export function useImportFormats() {
  const accessToken = useAuthStore((state) => state.accessToken);
  
  return useQuery({
    queryKey: importKeys.formats(),
    queryFn: async () => {
      const response = await axios.get<BankFormat[]>(`${API_URL}/api/v1/import/formats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    },
    enabled: !!accessToken,
  });
}

// Preview import (upload file)
export function usePreviewImport() {
  const accessToken = useAuthStore((state) => state.accessToken);
  
  return useMutation({
    mutationFn: async ({
      file,
      accountId,
    }: {
      file: File;
      accountId: string;
    }): Promise<ImportPreview> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountId', accountId);

      const response = await axios.post<ImportPreview>(
        `${API_URL}/api/v1/import/preview`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
  });
}

// Confirm import
export function useConfirmImport() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async (data: ConfirmImportDto): Promise<ImportResultDto> => {
      const response = await axios.post<ImportResultDto>(
        `${API_URL}/api/v1/import/confirm`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
