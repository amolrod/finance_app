import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Decimal from 'decimal.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number/string as currency
 * Uses Decimal.js for precision - NEVER use float operations
 */
export function formatCurrency(
  value: string | number | Decimal,
  currency: string = 'EUR',
  locale: string = 'es-ES'
): string {
  const decimal = new Decimal(value);
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(decimal.toNumber());
}

/**
 * Format a date using the user's locale
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', options).format(d);
}

/**
 * Format a date as relative time (e.g., "hace 2 días")
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Ahora mismo' : `Hace ${diffMinutes} minutos`;
    }
    return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
  }
  
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  
  return `Hace ${Math.floor(diffDays / 365)} años`;
}

/**
 * Get CSS class for money display based on value
 */
export function getMoneyColorClass(value: string | number | Decimal): string {
  const decimal = new Decimal(value);
  
  if (decimal.isPositive()) return 'money-positive';
  if (decimal.isNegative()) return 'money-negative';
  return 'money-neutral';
}

/**
 * Parse a form input value to Decimal (handles locale formatting)
 */
export function parseMoneyInput(value: string): Decimal {
  // Remove currency symbols and thousand separators
  const cleaned = value
    .replace(/[€$£]/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')  // Spanish thousand separator
    .replace(',', '.');  // Spanish decimal separator
  
  return new Decimal(cleaned || '0');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function for search inputs etc.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
