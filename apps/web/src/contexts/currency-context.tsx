'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useExchangeRate, formatCurrency, CURRENCY_SYMBOLS, CURRENCY_NAMES } from '@/hooks/use-exchange-rates';
import { useAuthStore } from '@/stores/auth-store';

interface CurrencyContextType {
  // Moneda preferida del usuario
  preferredCurrency: string;
  setPreferredCurrency: (currency: string) => void;
  
  // Funciones de conversión
  convertAmount: (amount: number, fromCurrency: string) => number | null;
  formatAmount: (amount: number, currency?: string) => string;
  convertAndFormat: (amount: number, fromCurrency: string) => string;
  
  // Información de monedas
  getCurrencySymbol: (currency: string) => string;
  getCurrencyName: (currency: string) => string;
  
  // Estado
  isLoading: boolean;
  rates: Map<string, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Monedas más comunes que precargamos
const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'MXN'];

interface CurrencyProviderProps {
  children: React.ReactNode;
  defaultCurrency?: string;
}

export function CurrencyProvider({ 
  children, 
  defaultCurrency = 'USD' 
}: CurrencyProviderProps) {
  const [preferredCurrency, setPreferredCurrencyState] = useState<string>(defaultCurrency);
  const [rates, setRates] = useState<Map<string, number>>(new Map());
  
  // Solo hacer llamadas API si hay usuario autenticado
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  // Cargar preferencia del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved) {
      setPreferredCurrencyState(saved);
    }
  }, []);

  // Guardar preferencia en localStorage
  const setPreferredCurrency = useCallback((currency: string) => {
    setPreferredCurrencyState(currency);
    localStorage.setItem('preferredCurrency', currency);
  }, []);

  // Pre-cargar tipos de cambio comunes - solo si está autenticado
  const { data: usdToEur } = useExchangeRate('USD', 'EUR', isAuthenticated);
  const { data: usdToGbp } = useExchangeRate('USD', 'GBP', isAuthenticated);
  const { data: usdToMxn } = useExchangeRate('USD', 'MXN', isAuthenticated);
  const { data: eurToUsd } = useExchangeRate('EUR', 'USD', isAuthenticated);
  const { data: eurToGbp } = useExchangeRate('EUR', 'GBP', isAuthenticated);
  const { data: eurToMxn } = useExchangeRate('EUR', 'MXN', isAuthenticated);
  const { data: gbpToUsd } = useExchangeRate('GBP', 'USD', isAuthenticated);
  const { data: gbpToEur } = useExchangeRate('GBP', 'EUR', isAuthenticated);
  const { data: mxnToUsd } = useExchangeRate('MXN', 'USD', isAuthenticated);
  
  // Actualizar cache de rates cuando lleguen nuevos datos
  useEffect(() => {
    const newRates = new Map<string, number>();
    
    // Rates directos
    if (usdToEur?.rate) newRates.set('USD-EUR', usdToEur.rate);
    if (usdToGbp?.rate) newRates.set('USD-GBP', usdToGbp.rate);
    if (usdToMxn?.rate) newRates.set('USD-MXN', usdToMxn.rate);
    if (eurToUsd?.rate) newRates.set('EUR-USD', eurToUsd.rate);
    if (eurToGbp?.rate) newRates.set('EUR-GBP', eurToGbp.rate);
    if (eurToMxn?.rate) newRates.set('EUR-MXN', eurToMxn.rate);
    if (gbpToUsd?.rate) newRates.set('GBP-USD', gbpToUsd.rate);
    if (gbpToEur?.rate) newRates.set('GBP-EUR', gbpToEur.rate);
    if (mxnToUsd?.rate) newRates.set('MXN-USD', mxnToUsd.rate);
    
    // Calcular rates inversos para tener todas las combinaciones
    if (usdToEur?.rate && !newRates.has('EUR-USD')) newRates.set('EUR-USD', 1 / usdToEur.rate);
    if (usdToGbp?.rate && !newRates.has('GBP-USD')) newRates.set('GBP-USD', 1 / usdToGbp.rate);
    if (usdToMxn?.rate && !newRates.has('MXN-USD')) newRates.set('MXN-USD', 1 / usdToMxn.rate);
    if (eurToGbp?.rate && !newRates.has('GBP-EUR')) newRates.set('GBP-EUR', 1 / eurToGbp.rate);
    if (eurToMxn?.rate && !newRates.has('MXN-EUR')) newRates.set('MXN-EUR', 1 / eurToMxn.rate);
    
    // Solo actualizar si hay rates
    if (newRates.size > 0) {
      setRates(newRates);
    }
  }, [usdToEur, usdToGbp, usdToMxn, eurToUsd, eurToGbp, eurToMxn, gbpToUsd, gbpToEur, mxnToUsd]);

  // Convertir cantidad a la moneda preferida
  const convertAmount = useCallback((amount: number, fromCurrency: string): number | null => {
    if (fromCurrency === preferredCurrency) {
      return amount;
    }

    // Buscar rate directo
    const directKey = `${fromCurrency}-${preferredCurrency}`;
    if (rates.has(directKey)) {
      return amount * rates.get(directKey)!;
    }

    // Buscar rate inverso
    const inverseKey = `${preferredCurrency}-${fromCurrency}`;
    if (rates.has(inverseKey)) {
      return amount / rates.get(inverseKey)!;
    }

    // Intentar conversión a través de USD
    if (fromCurrency !== 'USD' && preferredCurrency !== 'USD') {
      const toUsdKey = `${fromCurrency}-USD`;
      const fromUsdKey = `USD-${preferredCurrency}`;
      
      if (rates.has(toUsdKey) && rates.has(fromUsdKey)) {
        const amountInUsd = amount * rates.get(toUsdKey)!;
        return amountInUsd * rates.get(fromUsdKey)!;
      }
    }

    return null;
  }, [preferredCurrency, rates]);

  // Formatear cantidad en una moneda
  const formatAmount = useCallback((amount: number, currency?: string): string => {
    const curr = currency || preferredCurrency;
    return formatCurrency(amount, curr);
  }, [preferredCurrency]);

  // Convertir y formatear en un solo paso (desde una moneda origen a la preferida)
  const convertAndFormat = useCallback((amount: number, fromCurrency: string): string => {
    const converted = convertAmount(amount, fromCurrency);
    if (converted !== null) {
      return formatCurrency(converted, preferredCurrency);
    }
    // Si no podemos convertir, mostramos en la moneda original
    return formatCurrency(amount, fromCurrency);
  }, [convertAmount, preferredCurrency]);

  // Obtener símbolo de moneda
  const getCurrencySymbol = useCallback((currency: string): string => {
    return CURRENCY_SYMBOLS[currency] || currency;
  }, []);

  // Obtener nombre de moneda
  const getCurrencyName = useCallback((currency: string): string => {
    return CURRENCY_NAMES[currency] || currency;
  }, []);

  const isLoading = false; // Podemos mejorar esto tracking los estados de carga

  return (
    <CurrencyContext.Provider
      value={{
        preferredCurrency,
        setPreferredCurrency,
        convertAmount,
        formatAmount,
        convertAndFormat,
        getCurrencySymbol,
        getCurrencyName,
        isLoading,
        rates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Hook para convertir y mostrar una cantidad
export function useConvertedAmount(amount: number, fromCurrency: string) {
  const { convertAmount, formatAmount, preferredCurrency } = useCurrency();
  
  const converted = convertAmount(amount, fromCurrency);
  const formatted = converted !== null 
    ? formatAmount(converted)
    : formatAmount(amount, fromCurrency);
  
  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: converted,
    targetCurrency: preferredCurrency,
    formatted,
    wasConverted: converted !== null && fromCurrency !== preferredCurrency,
  };
}
