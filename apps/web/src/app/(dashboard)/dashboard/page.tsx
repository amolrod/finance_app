'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAccountSummary, useAccounts } from '@/hooks/use-accounts';
import { useBudgets, useBudgetStatus } from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-categories';
import { useTransactions } from '@/hooks/use-transactions';
import { useAuthStore } from '@/stores/auth-store';
import { useCurrency } from '@/contexts/currency-context';
import { ConvertedAmount } from '@/components/converted-amount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkline } from '@/components/ui/sparkline';
import { StatsSkeleton } from '@/components/ui/empty-state';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight, Receipt, PiggyBank, ChevronRight, CheckCircle2, Circle, Lightbulb, Sparkles, ArrowRight } from 'lucide-react';
import Decimal from 'decimal.js';
import Link from 'next/link';
import { InteractiveExpenseChart, InteractiveMonthlyChart } from '@/components/charts';
import type { Transaction } from '@/types/api';
import { COLOR_PALETTE } from '@/lib/color-palettes';

const DEMO_ACCOUNT = {
  id: 'demo-account',
  name: 'Cuenta principal',
  currency: 'EUR',
};

const DEMO_CATEGORIES = [
  { id: 'demo-food', name: 'Comida', color: COLOR_PALETTE[0] },
  { id: 'demo-home', name: 'Hogar', color: COLOR_PALETTE[9] },
  { id: 'demo-transport', name: 'Transporte', color: COLOR_PALETTE[2] },
  { id: 'demo-sub', name: 'Suscripciones', color: COLOR_PALETTE[4] },
  { id: 'demo-leisure', name: 'Ocio', color: COLOR_PALETTE[8] },
  { id: 'demo-income', name: 'Ingresos', color: COLOR_PALETTE[12] },
];

const DEMO_TRANSACTIONS: Transaction[] = [
  { description: 'Nomina', type: 'INCOME', amount: '2450', categoryId: 'demo-income' },
  { description: 'Supermercado', type: 'EXPENSE', amount: '86.45', categoryId: 'demo-food' },
  { description: 'Restaurante', type: 'EXPENSE', amount: '42.9', categoryId: 'demo-food' },
  { description: 'Metro', type: 'EXPENSE', amount: '28.6', categoryId: 'demo-transport' },
  { description: 'Suscripcion streaming', type: 'EXPENSE', amount: '12.99', categoryId: 'demo-sub' },
  { description: 'Factura electricidad', type: 'EXPENSE', amount: '64.2', categoryId: 'demo-home' },
  { description: 'Cine', type: 'EXPENSE', amount: '18.5', categoryId: 'demo-leisure' },
  { description: 'Supermercado', type: 'EXPENSE', amount: '74.35', categoryId: 'demo-food' },
  { description: 'Gimnasio', type: 'EXPENSE', amount: '29.9', categoryId: 'demo-sub' },
  { description: 'Taxi', type: 'EXPENSE', amount: '19.4', categoryId: 'demo-transport' },
  { description: 'Intereses', type: 'INCOME', amount: '18.2', categoryId: 'demo-income' },
  { description: 'Seguro hogar', type: 'EXPENSE', amount: '52.1', categoryId: 'demo-home' },
  { description: 'Farmacia', type: 'EXPENSE', amount: '15.7', categoryId: 'demo-home' },
  { description: 'Ingreso extra', type: 'INCOME', amount: '240', categoryId: 'demo-income' },
  { description: 'Suscripcion software', type: 'EXPENSE', amount: '23.9', categoryId: 'demo-sub' },
  { description: 'Viaje corto', type: 'EXPENSE', amount: '110.4', categoryId: 'demo-leisure' },
  { description: 'Gasto sin categoria', type: 'EXPENSE', amount: '33.5', categoryId: null },
].map((item, index) => {
  const occurredAt = new Date(Date.now() - index * 86400000 * 2).toISOString();
  const category = DEMO_CATEGORIES.find((cat) => cat.id === item.categoryId) || null;
  return {
    id: `demo-${index}`,
    type: item.type,
    status: 'COMPLETED',
    amount: item.amount,
    currency: 'EUR',
    description: item.description,
    notes: null,
    occurredAt,
    accountId: DEMO_ACCOUNT.id,
    categoryId: item.categoryId ?? undefined,
    account: DEMO_ACCOUNT,
    category: category
      ? {
          id: category.id,
          name: category.name,
          color: category.color,
        }
      : null,
    transferToAccount: null,
    tags: [],
    createdAt: occurredAt,
    updatedAt: occurredAt,
  } as Transaction;
});

const DEMO_ACCOUNTS = [
  {
    id: 'demo-acc-1',
    name: 'Cuenta principal',
    type: 'BANK',
    currency: 'EUR',
    initialBalance: '5200',
    currentBalance: '14280',
    icon: null,
    color: COLOR_PALETTE[0],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-acc-2',
    name: 'Cuenta ahorro',
    type: 'SAVINGS',
    currency: 'EUR',
    initialBalance: '1200',
    currentBalance: '3200',
    icon: null,
    color: COLOR_PALETTE[2],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { preferredCurrency, convertAmount, formatAmount } = useCurrency();
  const { data: summary, isLoading: summaryLoading } = useAccountSummary(preferredCurrency);
  const { data: accounts } = useAccounts();
  const { data: budgets } = useBudgets();
  const { data: categories } = useCategories();
  const { data: budgetAlerts } = useBudgetStatus();
  const { data: recentTransactions, isLoading: recentLoading } = useTransactions({ limit: 5 });
  const { data: chartTransactions, isLoading: chartLoading } = useTransactions({ limit: 500 });
  const [demoMode, setDemoMode] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('financeapp.onboardingDismissed') === 'true';
  });
  const [onboardingReady, setOnboardingReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDemoMode(localStorage.getItem('financeapp.demoMode') === 'true');
  }, []);

  const toggleDemoMode = (value: boolean) => {
    setDemoMode(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('financeapp.demoMode', value ? 'true' : 'false');
    }
  };

  const dismissOnboarding = () => {
    setOnboardingDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('financeapp.onboardingDismissed', 'true');
    }
  };

  const restoreOnboarding = () => {
    setOnboardingDismissed(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('financeapp.onboardingDismissed');
    }
  };

  const activeTransactions = useMemo(() => {
    if (demoMode && !(chartTransactions?.data?.length || 0)) {
      return DEMO_TRANSACTIONS;
    }
    return chartTransactions?.data || [];
  }, [demoMode, chartTransactions?.data]);

  const displayBalance = summary?.totalBalanceConverted || summary?.totalBalance || '0';
  const displayCurrency = summary?.targetCurrency || summary?.byCurrency?.[0]?.currency || preferredCurrency;
  const demoBalance = useMemo(() => {
    return activeTransactions.reduce((total, tx) => {
      const amount = parseFloat(tx.amount);
      const converted = convertAmount(amount, tx.currency) ?? amount;
      if (tx.type === 'INCOME') return total + converted;
      if (tx.type === 'EXPENSE') return total - converted;
      return total;
    }, 0);
  }, [activeTransactions, convertAmount]);

  const displayBalanceValue =
    summary?.totalBalanceConverted || summary?.totalBalance || (demoMode ? demoBalance.toFixed(2) : '0');
  const displayAccounts = demoMode && !(accounts?.length || 0) ? DEMO_ACCOUNTS : accounts || [];
  const displayAccountCount =
    summary?.accountCount ?? displayAccounts.length;
  const recentItems = useMemo(() => {
    const items =
      demoMode && !(recentTransactions?.data?.length || 0)
        ? DEMO_TRANSACTIONS.slice(0, 6)
        : recentTransactions?.data || [];
    return [...items].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [demoMode, recentTransactions?.data]);
  
  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const transactions = activeTransactions;
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
  }, [activeTransactions, convertAmount]);

  // Calculate daily data for sparklines
  const { dailyExpenseData, dailyIncomeData } = useMemo(() => {
    const transactions = activeTransactions;
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
  }, [activeTransactions, convertAmount]);

  const firstName = user?.name?.split(' ')[0] || 'Usuario';
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const hasTransactions = activeTransactions.length > 0;
  const hasAccounts = (accounts?.length || 0) > 0;
  const hasCategories = (categories?.length || 0) > 0;
  const hasBudgets = (budgets?.length || 0) > 0;
  const onboardingComplete = hasTransactions && hasAccounts && hasCategories && hasBudgets;
  const onboardingDataReady =
    !chartLoading && accounts !== undefined && categories !== undefined && budgets !== undefined;
  const showOnboarding =
    onboardingReady && onboardingDismissed === false && !onboardingComplete;
  const showStatsSkeleton = !demoMode && (summaryLoading || chartLoading);
  const chartIsLoading = chartLoading && !demoMode && !(chartTransactions?.data?.length || 0);

  const onboardingSteps = [
    {
      label: 'Crea tu primera cuenta',
      description: 'Define las cuentas que quieres seguir.',
      href: '/dashboard/accounts',
      completed: hasAccounts,
    },
    {
      label: 'Organiza tus categorias',
      description: 'Mantiene la vista clara y ordenada.',
      href: '/dashboard/categories',
      completed: hasCategories,
    },
    {
      label: 'Configura presupuestos',
      description: 'Activa alertas cuando te acerques al limite.',
      href: '/dashboard/budgets',
      completed: hasBudgets,
    },
    {
      label: 'Importa o registra movimientos',
      description: 'Trae un extracto o registra tu primer gasto.',
      href: '/dashboard/import',
      completed: hasTransactions,
    },
  ];
  const completedSteps = onboardingSteps.filter((step) => step.completed).length;
  const onboardingProgress = Math.round((completedSteps / onboardingSteps.length) * 100);

  useEffect(() => {
    if (!onboardingDataReady) return;
    setOnboardingReady(true);
  }, [onboardingDataReady]);

  useEffect(() => {
    if (!onboardingDataReady) return;
    if (onboardingComplete && onboardingDismissed !== true) {
      setOnboardingDismissed(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('financeapp.onboardingDismissed', 'true');
      }
    }
  }, [onboardingComplete, onboardingDataReady, onboardingDismissed]);

  const insights = useMemo(() => {
    if (!activeTransactions.length) return [];
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    const previousWeekStart = new Date(now);
    previousWeekStart.setDate(now.getDate() - 13);
    const previousWeekEnd = new Date(now);
    previousWeekEnd.setDate(now.getDate() - 7);

    let weekExpense = 0;
    let prevWeekExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const expenseTransactions = activeTransactions.filter((tx) => tx.type === 'EXPENSE');
    const uncategorized = activeTransactions.filter((tx) => tx.type !== 'TRANSFER' && !tx.categoryId);

    expenseTransactions.forEach((tx) => {
      const txDate = new Date(tx.occurredAt);
      const amount = Math.abs(convertAmount(parseFloat(tx.amount), tx.currency) ?? parseFloat(tx.amount));
      if (txDate >= sevenDaysAgo) {
        weekExpense += amount;
      } else if (txDate >= previousWeekStart && txDate <= previousWeekEnd) {
        prevWeekExpense += amount;
      }
      if (txDate >= startOfMonth) {
        monthExpense += amount;
      }
    });

    activeTransactions.forEach((tx) => {
      if (tx.type !== 'INCOME') return;
      const txDate = new Date(tx.occurredAt);
      if (txDate >= startOfMonth) {
        const amount = convertAmount(parseFloat(tx.amount), tx.currency) ?? parseFloat(tx.amount);
        monthIncome += amount;
      }
    });

    const expenseChange = prevWeekExpense > 0 ? ((weekExpense - prevWeekExpense) / prevWeekExpense) * 100 : 0;
    const dailyAverageExpense = expenseTransactions.length
      ? expenseTransactions.reduce((sum, tx) => {
          const amount = Math.abs(convertAmount(parseFloat(tx.amount), tx.currency) ?? parseFloat(tx.amount));
          return sum + amount;
        }, 0) / expenseTransactions.length
      : 0;
    const outlier = expenseTransactions
      .map((tx) => ({
        tx,
        amount: Math.abs(convertAmount(parseFloat(tx.amount), tx.currency) ?? parseFloat(tx.amount)),
      }))
      .sort((a, b) => b.amount - a.amount)[0];
    const outlierRatio = dailyAverageExpense > 0 ? outlier?.amount / dailyAverageExpense : 0;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startOfMonth.getTime()) / 86400000));
    const netSoFar = monthIncome - monthExpense;
    const projectedNet = (netSoFar / daysElapsed) * daysInMonth;

    const insightsList = [
      {
        title: 'Semana actual',
        description:
          prevWeekExpense > 0
            ? `Gastos ${expenseChange >= 0 ? 'subieron' : 'bajaron'} ${Math.abs(expenseChange).toFixed(1)}% vs semana anterior.`
            : 'Tu semana comienza. Aun no hay comparativa.',
      },
      {
        title: 'Proyeccion del mes',
        description: `Si mantienes el ritmo, cerraras con ${formatAmount(projectedNet)} neto.`,
      },
      {
        title: 'Gasto atipico',
        description:
          outlier && outlierRatio >= 2
            ? `${outlier.tx.description || 'Movimiento'} fue ${outlierRatio.toFixed(1)}x tu promedio.`
            : 'No se detectan gastos atipicos recientes.',
      },
    ];

    if (uncategorized.length) {
      insightsList.push({
        title: 'Categorias pendientes',
        description: `${uncategorized.length} movimiento${uncategorized.length > 1 ? 's' : ''} sin clasificar.`,
      });
    }

    return insightsList;
  }, [activeTransactions, convertAmount, formatAmount]);

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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleDemoMode(!demoMode)}
          >
            {demoMode ? 'Demo activa' : 'Cargar demo'}
          </Button>
          {onboardingDismissed === true && (
            <Button size="sm" variant="ghost" onClick={restoreOnboarding}>
              Mostrar guia
            </Button>
          )}
        </div>
      </motion.div>

      {showOnboarding && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Card className="border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-base font-medium">Primeros pasos</CardTitle>
                  <p className="text-[13px] text-muted-foreground">
                    Completa el recorrido inicial para desbloquear tu panel completo.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDemoMode(!demoMode)}
                  >
                    {demoMode ? 'Desactivar demo' : 'Cargar demo'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={dismissOnboarding}>
                    Ocultar por ahora
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 text-[12px] text-muted-foreground">
                <span>
                  {completedSteps}/{onboardingSteps.length} completados
                </span>
                <div className="h-1.5 w-32 rounded-full bg-foreground/10">
                  <div
                    className="h-1.5 rounded-full bg-foreground/50"
                    style={{ width: `${onboardingProgress}%` }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  {onboardingSteps.map((step) => (
                    <Link
                      key={step.label}
                      href={step.href}
                      className="group flex items-start gap-3 rounded-xl border border-foreground/10 bg-background/70 px-3 py-3 transition-colors hover:bg-secondary/50"
                    >
                      <span className="mt-0.5">
                        {step.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </span>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-foreground/90">{step.label}</p>
                        <p className="text-[12px] text-muted-foreground">{step.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
                <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4 text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
                    <Sparkles className="h-4 w-4" />
                    Como leer el panel
                  </div>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-2">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                      Balance total = suma de todas tus cuentas hoy.
                    </li>
                    <li className="flex items-start gap-2">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                      Ingresos y gastos muestran el ritmo del mes.
                    </li>
                    <li className="flex items-start gap-2">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                      Ajusta presupuestos cuando veas alertas.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Card className="relative overflow-hidden border border-foreground/10 bg-[linear-gradient(135deg,#0f1116,#121824)] text-white shadow-[0_30px_80px_-60px_rgba(47,157,143,0.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(47,157,143,0.22)_0%,transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(58,134,198,0.2)_0%,transparent_60%)]" />
          <CardContent className="relative p-8">
            <p className="text-[13px] text-white/70 font-medium tracking-wide">Balance Total</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-tight">
                {summaryLoading && !demoMode
                  ? '—'
                  : formatCurrency(displayBalanceValue, displayCurrency).replace(displayCurrency, '').trim()}
              </span>
              <span className="text-xl text-white/40 font-medium">{displayCurrency}</span>
            </div>
            <div className="mt-8 flex items-center gap-8 text-[13px] text-white/50">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                {displayAccountCount} cuentas
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
      {showStatsSkeleton ? (
        <StatsSkeleton count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Income */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 30 }}>
            <Card className="card-hover border-foreground/10 bg-background/80 shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[13px] text-muted-foreground">Ingresos</p>
                    <p className="text-2xl font-semibold tracking-tight text-success">
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
      )}

      {/* Charts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid gap-6 lg:grid-cols-2">
        <InteractiveMonthlyChart transactions={activeTransactions} isLoading={chartIsLoading} />
        <InteractiveExpenseChart transactions={activeTransactions} isLoading={chartIsLoading} />
      </motion.div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
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
              {recentLoading && !demoMode ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex items-center gap-3 px-2 py-3 animate-pulse">
                      <div className="h-9 w-9 rounded-full bg-secondary" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded bg-secondary" />
                        <div className="h-3 w-1/3 rounded bg-secondary" />
                      </div>
                      <div className="h-3 w-16 rounded bg-secondary" />
                    </div>
                  ))}
                </div>
              ) : !recentItems.length ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-11 w-11 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-muted-foreground">No hay transacciones</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentItems.slice(0, 6).map((tx, index) => {
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
                          isIncome ? 'text-success' : '')}>
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

        {/* Insights */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, type: 'spring', stiffness: 300, damping: 30 }}>
          <Card className="h-full border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Insights</CardTitle>
                <Link href="/dashboard/reports" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5">
                  Ver detalle <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!insights.length ? (
                <div className="text-center py-10">
                  <div className="mx-auto h-11 w-11 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Lightbulb className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-muted-foreground">Aun no hay insights suficientes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.slice(0, 4).map((item) => (
                    <div key={item.title} className="rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2.5">
                      <p className="text-[12px] font-semibold text-foreground/80">{item.title}</p>
                      <p className="text-[12px] text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  ))}
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
            {!displayAccounts.length ? (
              <div className="text-center py-12">
                <div className="mx-auto h-11 w-11 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-[13px] text-muted-foreground">No hay cuentas</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {displayAccounts.slice(0, 6).map((account, index) => (
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
