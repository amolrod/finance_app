'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrency } from '@/contexts/currency-context';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from '@/hooks/use-exchange-rates';

const AVAILABLE_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'MXN', 'CAD', 'AUD', 'JPY', 'CHF', 'BRL', 'COP'
];

interface CurrencySelectorProps {
  compact?: boolean;
  className?: string;
}

export function CurrencySelector({ compact = false, className }: CurrencySelectorProps) {
  const { preferredCurrency, setPreferredCurrency } = useCurrency();

  return (
    <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
      <SelectTrigger className={className || (compact ? 'w-[80px]' : 'w-[180px]')}>
        <SelectValue>
          {compact ? (
            <span className="font-medium">{preferredCurrency}</span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="font-medium">{CURRENCY_SYMBOLS[preferredCurrency]}</span>
              <span>{preferredCurrency}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_CURRENCIES.map((currency) => (
          <SelectItem key={currency} value={currency}>
            <span className="flex items-center gap-2">
              <span className="w-6 text-center font-medium">
                {CURRENCY_SYMBOLS[currency]}
              </span>
              <span>{currency}</span>
              {!compact && (
                <span className="text-muted-foreground text-sm">
                  - {CURRENCY_NAMES[currency]}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Versión para mostrar en el header/navbar
export function CurrencyBadge() {
  const { preferredCurrency } = useCurrency();
  
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <span className="font-medium">{CURRENCY_SYMBOLS[preferredCurrency]}</span>
      <span>{preferredCurrency}</span>
    </div>
  );
}
