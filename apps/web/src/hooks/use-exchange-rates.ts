import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Types
export interface ExchangeRate {
  currency: string;
  rate: number;
  source: string;
  fetchedAt: string;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  rate: number;
}

export interface RateHistoryEntry {
  date: string;
  rate: number;
}

// Query keys
export const exchangeRateKeys = {
  all: ['exchange-rates'] as const,
  currencies: () => [...exchangeRateKeys.all, 'currencies'] as const,
  rate: (from: string, to: string) => [...exchangeRateKeys.all, 'rate', from, to] as const,
  allRates: (base: string) => [...exchangeRateKeys.all, 'all', base] as const,
  history: (from: string, to: string, days: number) => 
    [...exchangeRateKeys.all, 'history', from, to, days] as const,
};

// Hook para obtener monedas soportadas
export function useSupportedCurrencies() {
  return useQuery({
    queryKey: exchangeRateKeys.currencies(),
    queryFn: async () => {
      const result = await apiClient.get<{ data: { currencies: string[] } }>(
        '/exchange-rates/currencies'
      );
      return result.data?.currencies ?? [];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Hook para obtener tipo de cambio entre dos monedas
export function useExchangeRate(from: string, to: string, enabled: boolean = true) {
  return useQuery({
    queryKey: exchangeRateKeys.rate(from, to),
    queryFn: async () => {
      const result = await apiClient.get<{ data: { from: string; to: string; rate: number; fetchedAt: string } }>(
        '/exchange-rates/rate',
        { from, to }
      );
      return result.data;
    },
    enabled: enabled && !!from && !!to && from !== to,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook para obtener todos los tipos de cambio de una moneda base
export function useAllExchangeRates(baseCurrency: string = 'USD') {
  return useQuery({
    queryKey: exchangeRateKeys.allRates(baseCurrency),
    queryFn: async () => {
      const result = await apiClient.get<{ data: { baseCurrency: string; rates: ExchangeRate[] } }>(
        '/exchange-rates/all',
        { base: baseCurrency }
      );
      return result.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook para obtener historial de tipos de cambio
export function useExchangeRateHistory(from: string, to: string, days: number = 30) {
  return useQuery({
    queryKey: exchangeRateKeys.history(from, to, days),
    queryFn: async () => {
      const result = await apiClient.get<{
        data: {
          from: string;
          to: string;
          days: number;
          history: RateHistoryEntry[];
        };
      }>('/exchange-rates/history', { from, to, days: days.toString() });
      return result.data;
    },
    enabled: !!from && !!to && from !== to,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook para convertir cantidades
export function useConvertCurrency() {
  return useMutation({
    mutationFn: async ({ amount, from, to }: { amount: number; from: string; to: string }) => {
      const result = await apiClient.get<{ data: ConversionResult }>(
        '/exchange-rates/convert',
        { amount: amount.toString(), from, to }
      );
      return result.data;
    },
  });
}

// Hook para refrescar tipos de cambio manualmente
export function useRefreshExchangeRates() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const result = await apiClient.get<{ data: { message: string } }>('/exchange-rates/refresh');
      return result.data;
    },
    onSuccess: () => {
      // Invalidate all exchange rate queries
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all });
    },
  });
}

// Utilidad para formatear moneda
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Símbolos de moneda
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  MXN: '$',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CHF: 'Fr',
  CNY: '¥',
  BRL: 'R$',
  ARS: '$',
  COP: '$',
  CLP: '$',
  PEN: 'S/',
};

// Nombres de monedas
export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  MXN: 'Mexican Peso',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  BRL: 'Brazilian Real',
  ARS: 'Argentine Peso',
  COP: 'Colombian Peso',
  CLP: 'Chilean Peso',
  PEN: 'Peruvian Sol',
};
