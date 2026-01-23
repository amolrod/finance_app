'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useBudgets } from '@/hooks/use-budgets';
import { useTransactions } from '@/hooks/use-transactions';
import { useAlerts, generateBudgetAlert, generateSpendingAlert } from '@/components/alerts/alert-system';

/**
 * Simple currency formatter for alerts
 */
function formatAlertAmount(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Hook that monitors financial data and generates alerts
 * Call this in the dashboard layout to enable automatic alerts
 */
export function useFinancialAlerts() {
  const { addAlert } = useAlerts();
  const { data: budgets } = useBudgets();
  const { data: transactions } = useTransactions({ limit: 100 });
  
  // Track which alerts we've already shown to avoid duplicates
  const shownAlertsRef = useRef<Set<string>>(new Set());

  // Check budget alerts
  useEffect(() => {
    if (!budgets) return;

    budgets.forEach(budget => {
      const spent = parseFloat(budget.spentAmount);
      const limit = parseFloat(budget.limitAmount);
      const alertKey = `budget-${budget.id}-${Math.floor((spent / limit) * 10) * 10}`;
      
      if (shownAlertsRef.current.has(alertKey)) return;

      const alert = generateBudgetAlert(
        budget.categoryName || 'Sin nombre',
        spent,
        limit,
        formatAlertAmount
      );

      if (alert) {
        addAlert(alert);
        shownAlertsRef.current.add(alertKey);
      }
    });
  }, [budgets, addAlert]);

  // Check for unusual spending patterns
  useEffect(() => {
    if (!transactions?.data || transactions.data.length < 10) return;

    // Group expenses by category
    const categorySpending = new Map<string, { current: number; count: number; name: string }>();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.data
      .filter(tx => tx.type === 'EXPENSE' && tx.category)
      .forEach(tx => {
        const txDate = new Date(tx.occurredAt);
        const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        
        if (isCurrentMonth && tx.category) {
          const existing = categorySpending.get(tx.category.id) || { current: 0, count: 0, name: tx.category.name };
          existing.current += parseFloat(tx.amount);
          existing.count += 1;
          categorySpending.set(tx.category.id, existing);
        }
      });

    // For now, we'd need historical data to compare
    // This is a placeholder - in a real app, you'd fetch average spending from the API
    
  }, [transactions, addAlert]);
}

/**
 * Component wrapper that enables financial alerts in the dashboard
 */
export function FinancialAlertsProvider({ children }: { children: React.ReactNode }) {
  // We use a try-catch because useAlerts requires AlertProvider
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useFinancialAlerts();
  } catch {
    // AlertProvider not present, skip alerts
  }
  
  return <>{children}</>;
}
