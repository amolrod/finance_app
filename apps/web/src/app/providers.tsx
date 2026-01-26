'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AxiosError } from 'axios';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { CurrencyProvider } from '@/contexts/currency-context';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - datos considerados frescos
            gcTime: 30 * 60 * 1000, // 30 minutes - mantener en caché
            refetchOnWindowFocus: false,
            refetchOnMount: false, // No refetch si datos están frescos
            retry: (failureCount, error) => {
              const status = error instanceof AxiosError
                ? error.response?.status
                : (error as { status?: number } | undefined)?.status;
              if (status === 401 || status === 403) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <CurrencyProvider defaultCurrency="USD">
          {children}
        </CurrencyProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
