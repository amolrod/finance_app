'use client';

import { useCurrency } from '@/contexts/currency-context';
import { formatCurrency, cn } from '@/lib/utils';

interface ConvertedAmountProps {
  amount: number | string;
  currency: string;
  className?: string;
  showOriginal?: boolean; // Mostrar título con el valor original
  prefix?: string; // +, -, etc.
}

/**
 * Componente que muestra una cantidad convertida a la moneda preferida del usuario.
 * Si no se puede convertir, muestra el valor original.
 */
export function ConvertedAmount({ 
  amount, 
  currency, 
  className,
  showOriginal = true,
  prefix = '',
}: ConvertedAmountProps) {
  const { preferredCurrency, convertAmount, formatAmount } = useCurrency();
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Si es la misma moneda o no podemos convertir, mostrar original
  if (currency === preferredCurrency) {
    return (
      <span className={className}>
        {prefix}{formatCurrency(numAmount, currency)}
      </span>
    );
  }

  const converted = convertAmount(numAmount, currency);
  
  // Si no se pudo convertir, mostrar original
  if (converted === null) {
    return (
      <span className={className}>
        {prefix}{formatCurrency(numAmount, currency)}
      </span>
    );
  }

  // Mostrar convertido con title del original
  const originalText = `Original: ${prefix}${formatCurrency(numAmount, currency)}`;
  
  return (
    <span 
      className={cn(className, showOriginal && 'cursor-help border-b border-dotted border-current')}
      title={showOriginal ? originalText : undefined}
    >
      {prefix}{formatAmount(converted)}
    </span>
  );
}

/**
 * Hook para obtener el monto convertido sin renderizar
 */
export function useConvertedAmount(amount: number | string, currency: string) {
  const { preferredCurrency, convertAmount, formatAmount } = useCurrency();
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (currency === preferredCurrency) {
    return {
      converted: numAmount,
      formatted: formatAmount(numAmount),
      wasConverted: false,
      originalCurrency: currency,
    };
  }

  const converted = convertAmount(numAmount, currency);
  
  return {
    converted: converted ?? numAmount,
    formatted: converted !== null ? formatAmount(converted) : formatCurrency(numAmount, currency),
    wasConverted: converted !== null,
    originalCurrency: currency,
  };
}
