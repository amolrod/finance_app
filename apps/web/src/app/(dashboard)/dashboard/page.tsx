'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccountSummary, useAccounts } from '@/hooks/use-accounts';
import { useBudgetStatus } from '@/hooks/use-budgets';
import { useTransactions } from '@/hooks/use-transactions';
import { useAuthStore } from '@/stores/auth-store';
import { useCurrency } from '@/contexts/currency-context';
import { ConvertedAmount } from '@/components/converted-amount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkline } from '@/components/ui/sparkline';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight, Receipt, PiggyBank, ChevronRight } from 'lucide-react';
import Decimal from 'decimal.js';
import Link from 'next/link';
import { InteractiveExpenseChart, InteractiveMonthlyChart } from '@/components/charts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { preferredCurrency, convertAmount, formatAmount } = useCurrency();
  const { data: summary, isLoading: summaryLoading } = useAccountSummary(preferredCurrency);
  const { data: accounts } = useAccounts();
  const { data: budgetAlerts } = useBudgetStatus();
  const { data: recentTransactions, isLoading: transactionsLoading } = useTransactions({ limit: 5 });
  const { data: chartTransactions } = useTransactions({ limit: 500 });

  const displayBalance = summary?.totalBalanceConverted || summary?.totalBalance || '0';
  const displayCurrency = summary?.targetCurrency || summary?.byCurrency?.[0]?.currency || preferredCurrency;
  
  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const transactions = chartTransactions?.data || [];
    let totalIncome = 0, totalExpense = 0, prevIncome = 0, prevExpense = 0;
    
    for (const tx of transactions) {
      const txDate = new Date(tx.occurredAt);
      if (tx.status === 'COMPLETED') {
        const amount = parseFloat(tx.amount);
        const converted = convertAmount(amount, tx.currency) ?? amount;
        
        if (txDate >= startOfMonth) {
          if (tx.type === 'INCOME') totalIncome += converted;
          else if (tx.type === 'EXPENSE') totalExpense += converted;
        } else if (txDate >= startOfPrevMonth && txDate <= endOfPrevMonth) {
          if (tx.type === 'INCOME') prevIncome += converted;
          else if (tx.type === 'EXPENSE') prevExpense += converted;
        }
      }
    }
    
    return { 
      totalIncome, totalExpense, prevIncome, prevExpense,
      incomeChange: prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0,
      expenseChange: prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0,
    };
  }, [chartTransactions?.data, convertAmount]);

  // Calculate daily data for sparklines
  const { dailyExpenseData, dailyIncomeData } = useMemo(() => {
    const transactions = chartTransactions?.data || [];
    const days = 14;
    const expenseData: number[] = new Array(days).fill(0);
    const incomeData: number[] = new Array(days).fill(0);
    const now = new Date();
    
    for (const tx of transactions) {
      if (tx.status === 'COMPLETED') {
        const txDate = new Date(tx.occurredAt);
        const daysAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysAgo >= 0 && daysAgo < days) {
          const amount = parseFloat(tx.amount);
          const converted = convertAmount(amount, tx.currency) ?? amount;
          if (tx.type === 'EXPENSE') expenseData[days - 1 - daysAgo] += converted;
          if (tx.type === 'INCOME') incomeData[days - 1 - daysAgo] += converted;
        }
      }
    }
    
    return { dailyExpenseData: expenseData, dailyIncomeData: incomeData };
  }, [chartTransactions?.data, convertAmount]);

  const firstName = user?.name?.split(' ')[0] || 'Usuario';
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {firstName}</h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Card className="relative overflow-hidden border border-emerald-500/20 bg-[linear-gradient(135deg,#0b1220,#0f172a)] text-white shadow-[0_35px_90px_-60px_rgba(14,165,233,0.65)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.35)_0%,transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(14,165,233,0.3)_0%,transparent_60%)]" />
          <CardContent className="relative p-8">
            <p className="text-[13px] text-white/70 font-medium tracking-wide">Balance Total</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-tight">
                {summaryLoading ? '—' : formatCurrency(displayBalance, displayCurrency).replace(displayCurrency, '').trim()}
              </span>
              <span className="text-xl text-white/40 font-medium">{displayCurrency}</span>
            </div>
            <div className="mt-8 flex items-center gap-8 text-[13px] text-white/50">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                {summary?.accountCount || 0} cuentas
              </span>
              {summary?.byCurrency && summary.byCurrency.length > 1 && (
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  {summary.byCurrency.length} monedas
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Income */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 30 }}>
          <Card className="card-hover border-foreground/10 bg-background/80 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-[13px] text-muted-foreground">Ingresos</p>
                  <p className="text-2xl font-semibold tracking-tight text-green-600 dark:text-green-500">
                    +{formatAmount(monthlyTotals.totalIncome)}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              {monthlyTotals.prevIncome > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className={cn('text-[13px]',
                    monthlyTotals.incomeChange >= 0 ? 'text-muted-foreground' : 'text-muted-foreground')}>
                    {monthlyTotals.incomeChange >= 0 ? '↑' : '↓'} {Math.abs(monthlyTotals.incomeChange).toFixed(1)}% vs mes anterior
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expenses */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 30 }}>
          <Card className="card-hover border-foreground/10 bg-background/80 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-[13px] text-muted-foreground">Gastos</p>
                  <p className="text-2xl font-semibold tracking-tight">
                    -{formatAmount(monthlyTotals.totalExpense)}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              {monthlyTotals.prevExpense > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="text-[13px] text-muted-foreground">
                    {monthlyTotals.expenseChange <= 0 ? '↓' : '↑'} {Math.abs(monthlyTotals.expenseChange).toFixed(1)}% vs mes anterior
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sparklines */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}>
          <Card className="card-hover border-foreground/10 bg-background/80 shadow-soft">
            <CardContent className="p-6">
              <p className="text-[13px] text-muted-foreground mb-5">Últimos 14 días</p>
              <div className="flex items-end justify-between gap-6">
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-3">Gastos</p>
                  <Sparkline data={dailyExpenseData} color="hsl(var(--foreground))" width={90} height={32} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-3">Ingresos</p>
                  <Sparkline data={dailyIncomeData} color="hsl(var(--foreground))" width={90} height={32} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 30 }}>
          <Card className="card-hover border-foreground/10 bg-background/80 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-[13px] text-muted-foreground">Alertas</p>
                  <p className="text-2xl font-semibold tracking-tight">{budgetAlerts?.filter(b => b.percentageUsed >= 80).length || 0}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <span className="text-[13px] text-muted-foreground">Presupuestos al límite</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid gap-6 lg:grid-cols-2">
        <InteractiveMonthlyChart transactions={chartTransactions?.data || []} isLoading={transactionsLoading} />
        <InteractiveExpenseChart transactions={chartTransactions?.data || []} isLoading={transactionsLoading} />
      </motion.div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 30 }}>
          <Card className="h-full border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Recientes</CardTitle>
                <Link href="/dashboard/transactions" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5">
                  Ver todo <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!recentTransactions?.data?.length ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-11 w-11 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-muted-foreground">No hay transacciones</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentTransactions.data.map((tx, index) => {
                    const isIncome = tx.type === 'INCOME';
                    const isExpense = tx.type === 'EXPENSE';
                    return (
                      <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}
                        className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary shrink-0">
                          {isIncome ? <ArrowUpRight className="h-4 w-4 text-muted-foreground" /> :
                           isExpense ? <ArrowDownRight className="h-4 w-4 text-muted-foreground" /> :
                           <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{tx.description || tx.category?.name || 'Sin descripción'}</p>
                          <p className="text-[12px] text-muted-foreground truncate">{tx.account?.name}</p>
                        </div>
                        <span className={cn('text-[13px] font-medium tabular-nums',
                          isIncome ? 'text-green-600 dark:text-green-500' : '')}>
                          {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(tx.amount, tx.currency).replace(tx.currency, '').trim()}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Budgets */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 30 }}>
          <Card className="h-full border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Presupuestos</CardTitle>
                <Link href="/dashboard/budgets" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5">
                  Ver todo <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!budgetAlerts?.length ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-11 w-11 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <PiggyBank className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-muted-foreground">No hay presupuestos</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {budgetAlerts.slice(0, 4).map((budget, index) => {
                    const percentage = budget.percentageUsed;
                    return (
                      <motion.div key={budget.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium">{budget.categoryName}</span>
                          <span className="text-[13px] text-muted-foreground tabular-nums">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={Math.min(percentage, 100)} className="h-1.5" />
                        <div className="flex justify-between text-[12px] text-muted-foreground">
                          <span>{formatAmount(parseFloat(budget.spentAmount))}</span>
                          <span>{formatAmount(parseFloat(budget.limitAmount))}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Accounts */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, type: 'spring', stiffness: 300, damping: 30 }}>
        <Card className="border-foreground/10 bg-background/80 shadow-soft">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Cuentas</CardTitle>
              <Link href="/dashboard/accounts" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5">
                Gestionar <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!accounts?.length ? (
              <div className="text-center py-12">
                <div className="mx-auto h-11 w-11 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-[13px] text-muted-foreground">No hay cuentas</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {accounts.slice(0, 6).map((account, index) => (
                  <motion.div key={account.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{account.name}</p>
                      <p className="text-[12px] text-muted-foreground">{account.currency}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-[13px] font-medium tabular-nums', new Decimal(account.currentBalance).isNegative() && 'text-foreground/60')}>
                        <ConvertedAmount amount={account.currentBalance} currency={account.currency} />
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
