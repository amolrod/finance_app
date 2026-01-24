'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, AlertTriangle, TrendingUp, Wallet, PiggyBank, Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Alert types
type AlertType = 'warning' | 'danger' | 'success' | 'info';
type AlertCategory = 'budget' | 'spending' | 'savings' | 'investment' | 'general';

interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  dismissible?: boolean;
  timestamp: Date;
  read?: boolean;
}

interface AlertContextType {
  alerts: Alert[];
  unreadCount: number;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;
  dismissAlert: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      read: false,
      dismissible: alert.dismissible !== false,
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        unreadCount,
        addAlert,
        dismissAlert,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

// Alert icons by category
const categoryIcons = {
  budget: Wallet,
  spending: AlertTriangle,
  savings: PiggyBank,
  investment: TrendingUp,
  general: Bell,
};

// Alert colors by type
const alertStyles = {
  warning: {
    bg: 'bg-warning/10 border-warning/30',
    icon: 'text-warning',
    text: 'text-warning-foreground',
  },
  danger: {
    bg: 'bg-destructive/10 border-destructive/30',
    icon: 'text-destructive',
    text: 'text-destructive-foreground',
  },
  success: {
    bg: 'bg-success/10 border-success/30',
    icon: 'text-success',
    text: 'text-success-foreground',
  },
  info: {
    bg: 'bg-primary/10 border-primary/30',
    icon: 'text-primary',
    text: 'text-primary-foreground',
  },
};

// Individual Alert Component
interface AlertItemProps {
  alert: Alert;
  onDismiss?: () => void;
  onClick?: () => void;
  compact?: boolean;
}

export function AlertItem({ alert, onDismiss, onClick, compact = false }: AlertItemProps) {
  const Icon = categoryIcons[alert.category];
  const styles = alertStyles[alert.type];

  return (
    <div
      className={cn(
        'relative flex gap-3 p-3 rounded-lg border transition-all',
        styles.bg,
        onClick && 'cursor-pointer hover:opacity-80',
        !alert.read && 'ring-2 ring-primary/20',
        compact ? 'items-start' : 'items-center'
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex items-center justify-center rounded-xl border',
            compact ? 'h-7 w-7' : 'h-8 w-8',
            styles.bg
          )}
        >
          <Icon className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4', styles.icon)} />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {alert.title}
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {alert.message}
          </p>
        )}
        {alert.action && !compact && (
          <Button
            size="sm"
            variant="link"
            className="h-auto p-0 text-xs mt-1"
            onClick={(e) => {
              e.stopPropagation();
              alert.action?.onClick?.();
            }}
          >
            {alert.action.label} →
          </Button>
        )}
      </div>

      {alert.dismissible && onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
        </button>
      )}
    </div>
  );
}

// Alert Toast (for new alerts)
interface AlertToastProps {
  alert: Alert;
  onDismiss: () => void;
  duration?: number;
}

export function AlertToast({ alert, onDismiss, duration = 5000 }: AlertToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-right-4 duration-300">
      <AlertItem alert={alert} onDismiss={onDismiss} />
    </div>
  );
}

// Alert Banner (for critical alerts at top of page)
interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  className?: string;
}

export function AlertBanner({ alerts, onDismiss, className }: AlertBannerProps) {
  const criticalAlerts = alerts.filter(a => a.type === 'danger' && !a.read);
  
  if (criticalAlerts.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {criticalAlerts.map(alert => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onDismiss={() => onDismiss(alert.id)}
        />
      ))}
    </div>
  );
}

// Alert Badge for notification icon
interface AlertBadgeProps {
  count: number;
  className?: string;
}

export function AlertBadge({ count, className }: AlertBadgeProps) {
  if (count === 0) return null;
  
  return (
    <span className={cn(
      'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center',
      'rounded-full bg-destructive text-destructive-foreground text-xs font-bold',
      className
    )}>
      {count > 9 ? '9+' : count}
    </span>
  );
}

// Alert Dropdown Panel
interface AlertDropdownProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  className?: string;
}

export function AlertDropdown({
  alerts,
  onDismiss,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  className,
}: AlertDropdownProps) {
  return (
    <div className={cn(
      'w-80 rounded-lg border bg-card shadow-lg',
      className
    )}>
      <div className="flex items-center justify-between p-3 border-b">
        <h4 className="font-semibold text-sm">Alertas</h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={onMarkAllAsRead}
          >
            Marcar leídas
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={onClearAll}
          >
            Limpiar
          </Button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No tienes alertas pendientes
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {alerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={() => onDismiss(alert.id)}
                onClick={() => onMarkAsRead(alert.id)}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Budget Alert Generator Helper
export function generateBudgetAlert(
  budgetName: string,
  spent: number,
  limit: number,
  formatAmount: (n: number) => string
): Omit<Alert, 'id' | 'timestamp' | 'read'> | null {
  const percentage = (spent / limit) * 100;
  
  if (percentage >= 100) {
    return {
      type: 'danger',
      category: 'budget',
      title: `¡Presupuesto "${budgetName}" excedido!`,
      message: `Has gastado ${formatAmount(spent)} de ${formatAmount(limit)} (${percentage.toFixed(0)}%)`,
      action: {
        label: 'Ver detalles',
        href: '/dashboard/budgets',
      },
    };
  } else if (percentage >= 80) {
    return {
      type: 'warning',
      category: 'budget',
      title: `Presupuesto "${budgetName}" al ${percentage.toFixed(0)}%`,
      message: `Has gastado ${formatAmount(spent)} de ${formatAmount(limit)}. Te quedan ${formatAmount(limit - spent)}`,
      action: {
        label: 'Ver detalles',
        href: '/dashboard/budgets',
      },
    };
  }
  
  return null;
}

// Unusual Spending Alert Generator
export function generateSpendingAlert(
  categoryName: string,
  currentSpending: number,
  averageSpending: number,
  formatAmount: (n: number) => string
): Omit<Alert, 'id' | 'timestamp' | 'read'> | null {
  const increase = ((currentSpending - averageSpending) / averageSpending) * 100;
  
  if (increase >= 50) {
    return {
      type: 'warning',
      category: 'spending',
      title: `Gasto inusual en "${categoryName}"`,
      message: `Has gastado ${formatAmount(currentSpending)}, un ${increase.toFixed(0)}% más que tu promedio de ${formatAmount(averageSpending)}`,
      action: {
        label: 'Ver transacciones',
      },
    };
  }
  
  return null;
}

// Savings Goal Alert
export function generateSavingsAlert(
  currentSavingsRate: number,
  targetRate: number = 20
): Omit<Alert, 'id' | 'timestamp' | 'read'> | null {
  if (currentSavingsRate >= targetRate) {
    return {
      type: 'success',
      category: 'savings',
      title: '¡Excelente tasa de ahorro!',
      message: `Estás ahorrando el ${currentSavingsRate.toFixed(0)}% de tus ingresos. ¡Sigue así!`,
    };
  } else if (currentSavingsRate < 10) {
    return {
      type: 'warning',
      category: 'savings',
      title: 'Tasa de ahorro baja',
      message: `Solo estás ahorrando el ${currentSavingsRate.toFixed(0)}%. Se recomienda ahorrar al menos el 20%`,
      action: {
        label: 'Ver consejos',
      },
    };
  }
  
  return null;
}
