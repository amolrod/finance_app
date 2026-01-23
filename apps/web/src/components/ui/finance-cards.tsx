'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Animation variants - Subtle and refined
const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
};

// Stagger animation container
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function StaggerContainer({ children, className, delay = 0 }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: delay,
            staggerChildren: 0.08,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Animated list item
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
      }}
    >
      {children}
    </motion.div>
  );
}

// Financial stat card - Clean Apple-style
interface FinanceStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: 'default' | 'success' | 'danger' | 'primary';
  className?: string;
  delay?: number;
}

export function FinanceStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  delay = 0,
}: FinanceStatCardProps) {
  const iconColors = {
    default: 'text-muted-foreground bg-secondary',
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
    danger: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30',
    primary: 'text-primary bg-primary/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'rounded-2xl bg-card p-5',
        'border border-border/50',
        'shadow-soft hover:shadow-soft-lg',
        'transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.value >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(trend.value).toFixed(1)}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            iconColors[variant]
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Balance hero card - Clean, minimal
interface BalanceHeroCardProps {
  balance: string;
  currency: string;
  accountCount: number;
  currencyCount?: number;
  className?: string;
}

export function BalanceHeroCard({
  balance,
  currency,
  accountCount,
  currencyCount,
  className,
}: BalanceHeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative overflow-hidden rounded-3xl p-8',
        'bg-gradient-to-br from-zinc-900 to-zinc-800',
        'dark:from-zinc-800 dark:to-zinc-900',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      
      <div className="relative z-10">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-medium text-zinc-400"
        >
          Balance Total
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-2 flex items-baseline gap-2"
        >
          <span className="text-4xl font-semibold tracking-tight text-white">
            {balance}
          </span>
          <span className="text-lg font-medium text-zinc-500">{currency}</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex items-center gap-6 text-sm text-zinc-400"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {accountCount} cuentas
          </span>
          {currencyCount && currencyCount > 1 && (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {currencyCount} monedas
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Quick action button - Clean iOS-style
interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'danger';
  className?: string;
}

export function QuickAction({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  className,
}: QuickActionProps) {
  const colors = {
    default: 'bg-secondary hover:bg-secondary/80 text-foreground',
    success: 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400',
    danger: 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-700 dark:text-red-400',
  };

  const iconColors = {
    default: 'bg-background text-foreground',
    success: 'bg-emerald-600 text-white',
    danger: 'bg-red-600 text-white',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors duration-200',
        colors[variant],
        className
      )}
    >
      <div className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full',
        iconColors[variant]
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}

// Transaction item - Clean and readable
interface TransactionItemProps {
  title: string;
  subtitle: string;
  amount: string;
  date?: string;
  type: 'income' | 'expense' | 'transfer';
  icon?: LucideIcon;
  index?: number;
  onClick?: () => void;
}

export function TransactionItem({
  icon: Icon,
  title,
  subtitle,
  amount,
  date,
  type,
  index = 0,
  onClick,
}: TransactionItemProps) {
  const colors = {
    income: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
      amount: 'text-emerald-600 dark:text-emerald-400',
    },
    expense: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      icon: 'text-red-600 dark:text-red-400',
      amount: 'text-red-600 dark:text-red-400',
    },
    transfer: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      icon: 'text-blue-600 dark:text-blue-400',
      amount: 'text-foreground',
    },
  };

  const DefaultIcon = () => (
    <svg className={cn('h-4 w-4', colors[type].icon)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {type === 'income' && <path d="m19 15-7-7-7 7"/>}
      {type === 'expense' && <path d="m5 9 7 7 7-7"/>}
      {type === 'transfer' && <path d="M5 12h14m-4-4 4 4-4 4"/>}
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 py-3 px-1 -mx-1 rounded-xl cursor-pointer',
        'hover:bg-secondary/50 transition-colors duration-150'
      )}
    >
      <div className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full shrink-0',
        colors[type].bg
      )}>
        {Icon ? <Icon className={cn('h-4 w-4', colors[type].icon)} /> : <DefaultIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {subtitle}{date ? ` · ${date}` : ''}
        </p>
      </div>
      <span className={cn('text-sm font-semibold tabular-nums', colors[type].amount)}>
        {type === 'income' ? '+' : type === 'expense' ? '-' : ''}{amount}
      </span>
    </motion.div>
  );
}
