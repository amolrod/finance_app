'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, DollarSign, PieChart, BarChart3, RefreshCcw, Clock, Briefcase, ChevronRight, Target, Trash2 } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePortfolioSummary, useHoldings, useRefreshPrices, useAutoRefreshPrices, useInvestmentOperations, useInvestmentPriceHistory, useInvestmentGoals, useCreateInvestmentGoal, useDeleteInvestmentGoal } from '@/hooks/use-investments';
import { useAssets } from '@/hooks/use-assets';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/currency-context';
import { OperationForm } from './operation-form';
import { HoldingsTable } from './holdings-table';
import { OperationsTable } from './operations-table';
import { AssetType } from '@/types/api';
import { COLOR_PALETTE } from '@/lib/color-palettes';

const assetTypeLabels: Record<AssetType, string> = {
  STOCK: 'Acciones',
  ETF: 'ETFs',
  CRYPTO: 'Cripto',
  BOND: 'Bonos',
  MUTUAL_FUND: 'Fondos',
  OTHER: 'Otros',
};

const assetTypeColors: Record<AssetType, string> = {
  STOCK: COLOR_PALETTE[2],
  ETF: COLOR_PALETTE[0],
  CRYPTO: COLOR_PALETTE[9],
  BOND: COLOR_PALETTE[4],
  MUTUAL_FUND: COLOR_PALETTE[1],
  OTHER: COLOR_PALETTE[6],
};

const performanceRanges = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1A' },
  { value: 'YTD', label: 'YTD' },
  { value: 'ALL', label: 'Todo' },
] as const;

export default function InvestmentsPage() {
  const [showOperationForm, setShowOperationForm] = useState(false);
  const [editOperationId, setEditOperationId] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [performanceRange, setPerformanceRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL'>('6M');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    name: '',
    scope: 'PORTFOLIO' as const,
    assetId: '',
    targetAmount: '',
    currency: '',
    targetDate: '',
    alertAt80: true,
    alertAt100: true,
  });
  const { toast } = useToast();
  const { convertAmount, formatAmount, convertAndFormat, preferredCurrency, rates } = useCurrency();
  
  const { data: portfolio, isLoading: loadingPortfolio } = usePortfolioSummary();
  const { data: holdings, isLoading: loadingHoldings } = useHoldings();
  const { data: assets } = useAssets();
  const refreshPricesMutation = useRefreshPrices();
  const { data: chartOperationsData, isLoading: chartOperationsLoading } = useInvestmentOperations({ page: 1, limit: 1000 });
  const { data: goals = [], isLoading: goalsLoading } = useInvestmentGoals();
  const createGoalMutation = useCreateInvestmentGoal();
  const deleteGoalMutation = useDeleteInvestmentGoal();
  
  // Auto-refresh precios cada 5 minutos
  const { data: autoRefreshData, isFetching: isAutoRefreshing } = useAutoRefreshPrices(holdings && holdings.length > 0);

  // Actualizar tiempo de última actualización
  useEffect(() => {
    if (autoRefreshData?.lastUpdated) {
      setLastUpdateTime(new Date(autoRefreshData.lastUpdated));
    }
  }, [autoRefreshData?.lastUpdated]);

  useEffect(() => {
    if (!goalForm.currency) {
      setGoalForm((prev) => ({ ...prev, currency: preferredCurrency }));
    }
  }, [goalForm.currency, preferredCurrency]);

  const holdingsData = holdings || portfolio?.holdings || [];
  const performanceAssetIds = useMemo(() => {
    return Array.from(new Set(holdingsData.map((holding) => holding.assetId)));
  }, [holdingsData]);
  const { data: priceHistory, isLoading: priceHistoryLoading } = useInvestmentPriceHistory(
    performanceAssetIds,
    performanceRange,
  );
  const holdingCurrencies = useMemo(() => {
    return new Set(holdingsData.map((h) => h.currency).filter(Boolean));
  }, [holdingsData]);
  const isSingleCurrency = holdingCurrencies.size <= 1;
  const baseCurrency =
    (isSingleCurrency ? holdingCurrencies.values().next().value : preferredCurrency) ||
    preferredCurrency ||
    'USD';

  const convertBetween = (amount: number, from: string, to: string) => {
    if (from === to) return amount;
    const directKey = `${from}-${to}`;
    if (rates.has(directKey)) {
      return amount * (rates.get(directKey) || 1);
    }
    const inverseKey = `${to}-${from}`;
    if (rates.has(inverseKey)) {
      return amount / (rates.get(inverseKey) || 1);
    }
    if (from !== 'USD' && to !== 'USD') {
      const toUsdKey = `${from}-USD`;
      const fromUsdKey = `USD-${to}`;
      if (rates.has(toUsdKey) && rates.has(fromUsdKey)) {
        return amount * (rates.get(toUsdKey) || 1) * (rates.get(fromUsdKey) || 1);
      }
    }
    return null;
  };

  const portfolioTotals = useMemo(() => {
    if (!holdingsData.length) {
      return {
        totalInvested: portfolio ? parseFloat(portfolio.totalInvested) : 0,
        totalCurrentValue: portfolio?.totalCurrentValue ? parseFloat(portfolio.totalCurrentValue) : null,
        totalUnrealizedPnL: portfolio?.totalUnrealizedPnL ? parseFloat(portfolio.totalUnrealizedPnL) : null,
        totalRealizedPnL: portfolio ? parseFloat(portfolio.totalRealizedPnL) : 0,
      };
    }

    let totalInvested = 0;
    let totalCurrentValue: number | null = 0;
    let totalUnrealizedPnL: number | null = 0;
    let totalRealizedPnL = 0;

    holdingsData.forEach((holding) => {
      const invested = parseFloat(holding.totalInvested || '0');
      const currentValue = holding.currentValue ? parseFloat(holding.currentValue) : null;
      const unrealized = holding.unrealizedPnL ? parseFloat(holding.unrealizedPnL) : null;
      const realized = parseFloat(holding.realizedPnL || '0');
      const fromCurrency = holding.currency || baseCurrency;
      const convert = (amount: number) =>
        isSingleCurrency ? amount : (convertAmount(amount, fromCurrency) ?? amount);

      totalInvested += convert(invested);
      totalRealizedPnL += convert(realized);
      if (currentValue !== null && totalCurrentValue !== null) {
        totalCurrentValue += convert(currentValue);
      } else if (currentValue === null) {
        totalCurrentValue = null;
      }
      if (unrealized !== null && totalUnrealizedPnL !== null) {
        totalUnrealizedPnL += convert(unrealized);
      } else if (unrealized === null) {
        totalUnrealizedPnL = null;
      }
    });

    return { totalInvested, totalCurrentValue, totalUnrealizedPnL, totalRealizedPnL };
  }, [holdingsData, baseCurrency, convertAmount, isSingleCurrency, portfolio]);

  const totalInvested = portfolioTotals.totalInvested;
  const totalCurrentValue = portfolioTotals.totalCurrentValue;
  const unrealizedPnL = portfolioTotals.totalUnrealizedPnL;
  const realizedPnL = portfolioTotals.totalRealizedPnL;

  const byAssetType = useMemo(() => {
    if (!holdingsData.length) return {};
    const summary: Record<string, { invested: number; currentValue: number | null; count: number }> = {};
    holdingsData.forEach((holding) => {
      const type = holding.type;
      if (!type) return;
      if (!summary[type]) {
        summary[type] = { invested: 0, currentValue: 0, count: 0 };
      }
      const invested = parseFloat(holding.totalInvested || '0');
      const currentValue = holding.currentValue ? parseFloat(holding.currentValue) : null;
      const fromCurrency = holding.currency || baseCurrency;
      const convert = (amount: number) =>
        isSingleCurrency ? amount : (convertAmount(amount, fromCurrency) ?? amount);

      summary[type].invested += convert(invested);
      if (summary[type].currentValue !== null) {
        if (currentValue !== null) {
          summary[type].currentValue += convert(currentValue);
        } else {
          summary[type].currentValue = null;
        }
      }
      summary[type].count += 1;
    });
    return summary;
  }, [holdingsData, baseCurrency, convertAmount, isSingleCurrency]);

  const allocationChartData = useMemo(() => {
    return Object.entries(byAssetType).map(([type, data]) => ({
      type,
      name: assetTypeLabels[type as AssetType] || type,
      invested: data.invested,
      currentValue: data.currentValue ?? data.invested,
      color: assetTypeColors[type as AssetType] || COLOR_PALETTE[3],
    }));
  }, [byAssetType]);

  const toNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return 0;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const portfolioValueSeries = useMemo(() => {
    if (!priceHistory?.assets?.length || !chartOperationsData?.data?.length) return [];

    const operations = [...chartOperationsData.data].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );
    const opsByAsset = new Map<string, typeof operations>();
    operations.forEach((op) => {
      const list = opsByAsset.get(op.assetId) || [];
      list.push(op);
      opsByAsset.set(op.assetId, list);
    });

    const dateMap = new Map<string, number>();

    priceHistory.assets.forEach((assetHistory) => {
      const ops = opsByAsset.get(assetHistory.assetId) || [];
      let opIndex = 0;
      let quantity = 0;
      const points = [...assetHistory.points].sort((a, b) => a.date.localeCompare(b.date));

      points.forEach((point) => {
        const pointTime = new Date(point.date).getTime();
        while (opIndex < ops.length && new Date(ops[opIndex].occurredAt).getTime() <= pointTime) {
          const op = ops[opIndex];
          const qty = toNumber(op.quantity);
          if (op.type === 'BUY') {
            quantity += qty;
          } else if (op.type === 'SELL') {
            quantity -= qty;
          } else if (op.type === 'SPLIT') {
            const ratio = qty;
            if (ratio > 0) {
              quantity *= ratio;
            }
          }
          opIndex += 1;
        }

        if (quantity <= 0) {
          return;
        }

        const priceCurrency = point.currency || assetHistory.currency || baseCurrency;
        const converted = convertBetween(point.price, priceCurrency, baseCurrency);
        const price = converted ?? point.price;
        const value = quantity * price;
        dateMap.set(point.date, (dateMap.get(point.date) || 0) + value);
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [priceHistory?.assets, chartOperationsData?.data, baseCurrency, rates]);

  const performanceSummary = useMemo(() => {
    if (portfolioValueSeries.length === 0) return null;
    const start = portfolioValueSeries[0].value;
    const end = portfolioValueSeries[portfolioValueSeries.length - 1].value;
    const change = end - start;
    const percent = start > 0 ? (change / start) * 100 : null;
    return { start, end, change, percent };
  }, [portfolioValueSeries]);

  const investmentTrendData = useMemo(() => {
    const operations = chartOperationsData?.data || [];
    if (!operations.length) return [];

    const sorted = [...operations].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );

    const lotsByAsset = new Map<string, { quantity: number; costPerUnit: number }[]>();
    let totalInvested = 0;
    let realizedPnL = 0;
    const points = new Map<string, { date: string; invested: number; realized: number }>();

    const convertValue = (amount: number, currency: string) =>
      convertAmount(amount, currency) ?? amount;

    sorted.forEach((op) => {
      const assetId = op.assetId;
      const lots = lotsByAsset.get(assetId) || [];
      const qty = toNumber(op.quantity);
      const price = toNumber(op.pricePerUnit);
      const fees = toNumber(op.fees);
      const currency = op.currency || baseCurrency;
      const priceConverted = convertValue(price, currency);
      const feesConverted = convertValue(fees, currency);
      const dateKey = op.occurredAt.split('T')[0];

      if (op.type === 'BUY') {
        const costTotal = qty * priceConverted + feesConverted;
        const costPerUnit = qty > 0 ? costTotal / qty : 0;
        lots.push({ quantity: qty, costPerUnit });
        totalInvested += costTotal;
      } else if (op.type === 'SELL') {
        let remaining = qty;
        let costBasis = 0;
        while (remaining > 0 && lots.length > 0) {
          const lot = lots[0];
          const sellFromLot = Math.min(remaining, lot.quantity);
          costBasis += sellFromLot * lot.costPerUnit;
          lot.quantity -= sellFromLot;
          remaining -= sellFromLot;
          if (lot.quantity <= 0) {
            lots.shift();
          }
        }
        const proceeds = qty * priceConverted - feesConverted;
        realizedPnL += proceeds - costBasis;
        totalInvested -= costBasis;
      } else if (op.type === 'DIVIDEND') {
        const amount = convertValue(toNumber(op.totalAmount || op.pricePerUnit), currency);
        realizedPnL += amount;
      } else if (op.type === 'FEE') {
        const amount = convertValue(toNumber(op.totalAmount || fees), currency);
        totalInvested += amount;
      } else if (op.type === 'SPLIT') {
        const ratio = qty || 0;
        if (ratio > 0) {
          lots.forEach((lot) => {
            lot.quantity *= ratio;
            lot.costPerUnit = lot.costPerUnit / ratio;
          });
        }
      }

      lotsByAsset.set(assetId, lots);

      points.set(dateKey, {
        date: dateKey,
        invested: totalInvested,
        realized: realizedPnL,
      });
    });

    return Array.from(points.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [chartOperationsData?.data, convertAmount, baseCurrency]);

  const unrealizedPnLPercent = totalInvested > 0 && unrealizedPnL !== null
    ? (unrealizedPnL / totalInvested) * 100
    : null;

  const handleEdit = (id: string) => {
    setEditOperationId(id);
    setShowOperationForm(true);
  };

  const handleCloseForm = () => {
    setShowOperationForm(false);
    setEditOperationId(null);
  };

  const resetGoalForm = () => {
    setGoalForm({
      name: '',
      scope: 'PORTFOLIO',
      assetId: '',
      targetAmount: '',
      currency: preferredCurrency,
      targetDate: '',
      alertAt80: true,
      alertAt100: true,
    });
  };

  const handleCreateGoal = async () => {
    if (!goalForm.name.trim() || !goalForm.targetAmount) {
      toast({
        title: 'Completa los campos',
        description: 'Nombre y objetivo son obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    if (goalForm.scope === 'ASSET' && !goalForm.assetId) {
      toast({
        title: 'Selecciona un activo',
        description: 'El objetivo por activo necesita un activo asociado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createGoalMutation.mutateAsync({
        name: goalForm.name.trim(),
        scope: goalForm.scope,
        assetId: goalForm.scope === 'ASSET' ? goalForm.assetId : undefined,
        targetAmount: Number(goalForm.targetAmount),
        currency: goalForm.currency || preferredCurrency,
        targetDate: goalForm.targetDate || undefined,
        alertAt80: goalForm.alertAt80,
        alertAt100: goalForm.alertAt100,
      });
      toast({
        title: 'Objetivo creado',
        description: 'Tu meta ya está en seguimiento.',
      });
      setGoalDialogOpen(false);
      resetGoalForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el objetivo.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGoal = async (id: string, name: string) => {
    try {
      await deleteGoalMutation.mutateAsync(id);
      toast({
        title: 'Objetivo eliminado',
        description: 'Se eliminó correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el objetivo.',
        variant: 'destructive',
      });
    }
  };

  const handleRefreshPrices = async () => {
    try {
      const result = await refreshPricesMutation.mutateAsync();
      setLastUpdateTime(new Date());
      type RefreshResult = { success?: boolean; source?: string };
      const results = (result.results || []) as RefreshResult[];
      const successCount = results.filter((r) => r.success).length;
      const sourcesSet = new Set<string>();
      results.filter((r) => r.success && r.source).forEach((r) => {
        if (r.source) sourcesSet.add(r.source);
      });
      const sources = Array.from(sourcesSet);
      
      toast({
        title: 'Precios actualizados',
        description: `${successCount} activos actualizados${sources.length > 0 ? ` (${sources.join(', ')})` : ''}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los precios',
        variant: 'destructive',
      });
    }
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header - Estilo Apple minimalista */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5">
              <Briefcase className="h-5 w-5 text-foreground/70" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inversiones</h1>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span>Gestiona tu portafolio</span>
              {lastUpdateTime && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                  <Clock className="h-3 w-3" />
                  {formatLastUpdate(lastUpdateTime)}
                  {isAutoRefreshing && <RefreshCcw className="h-3 w-3 animate-spin" />}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefreshPrices}
            disabled={refreshPricesMutation.isPending || isAutoRefreshing}
            className="h-9 text-[13px]"
          >
            <RefreshCcw className={cn("h-4 w-4 mr-1.5", (refreshPricesMutation.isPending || isAutoRefreshing) && "animate-spin")} />
            Actualizar
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 text-[13px]">
            <Link href="/dashboard/investments/import">Importar CSV</Link>
          </Button>
          <Button size="sm" onClick={() => setShowOperationForm(true)} className="h-9 text-[13px]">
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva Operación
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards - Estilo Apple Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Invertido */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }}
        >
          <Card className="card-hover relative overflow-hidden bg-background/80 border-foreground/10 shadow-soft">
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-muted-foreground">Total Invertido</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5">
                  <DollarSign className="h-4 w-4 text-foreground/70" />
                </div>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {loadingPortfolio ? '...' : convertAndFormat(totalInvested, baseCurrency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Coste base total</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Valor Actual */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <Card className="card-hover relative overflow-hidden bg-background/80 border-foreground/10 shadow-soft">
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-muted-foreground">Valor Actual</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5">
                  <BarChart3 className="h-4 w-4 text-foreground/70" />
                </div>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {loadingPortfolio 
                  ? '...' 
                  : totalCurrentValue !== null 
                    ? convertAndFormat(totalCurrentValue, baseCurrency)
                    : 'Sin datos'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">A precios de mercado</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* P&L No Realizado */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
        >
          <Card className="card-hover relative overflow-hidden bg-background/80 border-foreground/10 shadow-soft">
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-muted-foreground">P&L No Realizado</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5">
                  {unrealizedPnL !== null && unrealizedPnL >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-foreground/70" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-foreground/70" />
                  )}
                </div>
              </div>
              <p className={cn(
                "text-2xl font-semibold tabular-nums",
                unrealizedPnL !== null && unrealizedPnL >= 0 
                  ? "text-emerald-600/80 dark:text-emerald-400/80" 
                  : "text-foreground"
              )}>
                {loadingPortfolio 
                  ? '...'
                  : unrealizedPnL !== null 
                    ? `${unrealizedPnL >= 0 ? '+' : ''}${convertAndFormat(unrealizedPnL, baseCurrency)}`
                    : 'Sin datos'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {unrealizedPnLPercent !== null
                  ? `${unrealizedPnLPercent >= 0 ? '+' : ''}${unrealizedPnLPercent.toFixed(2)}%`
                  : 'Posiciones abiertas'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* P&L Realizado */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <Card className="card-hover relative overflow-hidden bg-background/80 border-foreground/10 shadow-soft">
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-muted-foreground">P&L Realizado</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5">
                  <PieChart className="h-4 w-4 text-foreground/70" />
                </div>
              </div>
              <p className={cn(
                "text-2xl font-semibold tabular-nums",
                realizedPnL >= 0 ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-foreground"
              )}>
                {loadingPortfolio 
                  ? '...'
                  : `${realizedPnL >= 0 ? '+' : ''}${convertAndFormat(realizedPnL, baseCurrency)}`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Ganancias cerradas</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Asset Type Distribution - Estilo lista Apple */}
      {Object.keys(byAssetType).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.25 }}
        >
          <Card className="bg-background/80 border-foreground/10 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-medium">Distribución por Tipo</CardTitle>
              <CardDescription className="text-[13px]">Desglose del portafolio</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {Object.entries(byAssetType).map(([type, data]) => {
                  const invested = data.invested;
                  const percentage = totalInvested > 0 ? (invested / totalInvested) * 100 : 0;
                  const accentColor = assetTypeColors[type as AssetType] || COLOR_PALETTE[3];
                  
                  return (
                    <div 
                      key={type} 
                      className="flex items-center justify-between px-4 py-3 hover:bg-foreground/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                        <span className="text-[14px] font-medium">
                          {assetTypeLabels[type as AssetType] || type}
                        </span>
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          {data.count}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex h-2 w-28 rounded-full bg-foreground/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: accentColor, opacity: 0.6 }}
                          />
                        </div>
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                          {convertAndFormat(invested, baseCurrency)}
                        </span>
                        <span className="text-[13px] font-medium tabular-nums w-14 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Objetivos de inversión */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.25 }}
      >
        <Card className="bg-background/80 border-foreground/10 shadow-soft">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-[15px] font-medium">Objetivos de inversión</CardTitle>
              <CardDescription className="text-[13px]">
                Marca metas para tu portafolio y recibe alertas suaves.
              </CardDescription>
            </div>
            <Dialog
              open={goalDialogOpen}
              onOpenChange={(open) => {
                setGoalDialogOpen(open);
                if (open) resetGoalForm();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 text-[13px]">
                  <Target className="h-4 w-4 mr-1.5" />
                  Nuevo objetivo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crear objetivo</DialogTitle>
                  <DialogDescription>
                    Define una meta clara para tu portafolio o un activo específico.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="goal-name">Nombre</Label>
                    <Input
                      id="goal-name"
                      placeholder="Meta 2025"
                      value={goalForm.name}
                      onChange={(event) => setGoalForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Alcance</Label>
                      <Select
                        value={goalForm.scope}
                        onValueChange={(value) =>
                          setGoalForm((prev) => ({
                            ...prev,
                            scope: value as 'PORTFOLIO' | 'ASSET',
                            assetId: value === 'PORTFOLIO' ? '' : prev.assetId,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PORTFOLIO">Portafolio completo</SelectItem>
                          <SelectItem value="ASSET">Activo específico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {goalForm.scope === 'ASSET' && (
                      <div className="space-y-2">
                        <Label>Activo</Label>
                        <Select
                          value={goalForm.assetId}
                          onValueChange={(value) => setGoalForm((prev) => ({ ...prev, assetId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un activo" />
                          </SelectTrigger>
                          <SelectContent>
                            {(assets || []).map((asset) => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.symbol} · {asset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="goal-amount">Objetivo</Label>
                      <Input
                        id="goal-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="5000"
                        value={goalForm.targetAmount}
                        onChange={(event) => setGoalForm((prev) => ({ ...prev, targetAmount: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Divisa</Label>
                      <Select
                        value={goalForm.currency}
                        onValueChange={(value) => setGoalForm((prev) => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          {['EUR', 'USD', 'GBP', 'MXN'].map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-date">Fecha objetivo</Label>
                      <Input
                        id="goal-date"
                        type="date"
                        value={goalForm.targetDate}
                        onChange={(event) => setGoalForm((prev) => ({ ...prev, targetDate: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border border-foreground/10 px-3 py-2">
                      <div>
                        <p className="text-[13px] font-medium">Aviso al 80%</p>
                        <p className="text-[11px] text-muted-foreground">Recibe un recordatorio</p>
                      </div>
                      <Switch
                        checked={goalForm.alertAt80}
                        onCheckedChange={(checked) => setGoalForm((prev) => ({ ...prev, alertAt80: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-foreground/10 px-3 py-2">
                      <div>
                        <p className="text-[13px] font-medium">Aviso al 100%</p>
                        <p className="text-[11px] text-muted-foreground">Marca la meta cumplida</p>
                      </div>
                      <Switch
                        checked={goalForm.alertAt100}
                        onCheckedChange={(checked) => setGoalForm((prev) => ({ ...prev, alertAt100: checked }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setGoalDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateGoal} isLoading={createGoalMutation.isPending}>
                    Guardar objetivo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalsLoading ? (
              <p className="text-sm text-muted-foreground">Cargando objetivos...</p>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/10 py-8 text-center">
                <Target className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Aún no tienes objetivos</p>
                <p className="text-xs text-muted-foreground">
                  Crea tu primera meta para hacer seguimiento.
                </p>
              </div>
            ) : (
              goals.map((goal) => {
                const hasData = goal.currentAmount !== null && goal.progressPercent !== null;
                const progress = hasData ? goal.progressPercent || 0 : 0;
                const currentAmount = goal.currentAmount ?? 0;
                const targetAmount = Number(goal.targetAmount || 0);
                const scopeLabel =
                  goal.scope === 'PORTFOLIO'
                    ? 'Portafolio'
                    : goal.asset?.symbol || 'Activo';
                const status = !hasData
                  ? 'Sin datos'
                  : progress >= 100
                  ? 'Completado'
                  : progress >= 80
                  ? 'Cerca'
                  : 'En progreso';

                return (
                  <div
                    key={goal.id}
                    className="rounded-xl border border-foreground/10 bg-background/60 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{goal.name}</p>
                          <Badge variant="secondary" className="text-[11px]">
                            {scopeLabel}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            {status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {hasData
                            ? `${formatAmount(currentAmount, goal.currency)} · objetivo ${formatAmount(targetAmount, goal.currency)}`
                            : 'Sin datos de valoración'}
                        </p>
                        {goal.targetDate && (
                          <p className="text-[11px] text-muted-foreground">
                            Fecha objetivo: {new Date(goal.targetDate).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar objetivo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará el objetivo "{goal.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteGoal(goal.id, goal.name)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Progress value={Math.min(progress, 100)} />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{progress.toFixed(1)}%</span>
                        <span>{goal.currency}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs: Holdings / Operations / Charts - Estilo segmented control Apple */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
      >
        <Tabs defaultValue="holdings" className="space-y-4">
          <TabsList className="h-9 p-0.5 bg-background/80 border border-foreground/10 shadow-soft">
            <TabsTrigger value="holdings" className="text-[13px] h-8 px-4">Posiciones</TabsTrigger>
            <TabsTrigger value="operations" className="text-[13px] h-8 px-4">Historial</TabsTrigger>
            <TabsTrigger value="charts" className="text-[13px] h-8 px-4">Gráficos</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-4">
            <HoldingsTable holdings={holdings || []} loading={loadingHoldings} />
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            <OperationsTable onEdit={handleEdit} />
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            {allocationChartData.length === 0 ? (
              <Card className="bg-background/80 border-foreground/10 shadow-soft">
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No hay datos suficientes para mostrar gráficos.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="bg-background/80 border-foreground/10 shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-[15px] font-medium">Distribución del Portafolio</CardTitle>
                      <CardDescription className="text-[13px]">Peso por tipo de activo</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={allocationChartData}
                            dataKey="currentValue"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={2}
                          >
                            {allocationChartData.map((entry) => (
                              <Cell key={entry.type} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => convertAndFormat(value, baseCurrency)}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/80 border-foreground/10 shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-[15px] font-medium">Invertido vs Valor actual</CardTitle>
                      <CardDescription className="text-[13px]">Comparativa por tipo</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={allocationChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={(value) => convertAndFormat(value, baseCurrency)} width={80} />
                          <Tooltip
                            formatter={(value: number) => convertAndFormat(value, baseCurrency)}
                          />
                          <Legend />
                          <Bar dataKey="invested" name="Invertido" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="currentValue" name="Valor actual" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-background/80 border-foreground/10 shadow-soft">
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-[15px] font-medium">Rendimiento del portafolio</CardTitle>
                      <CardDescription className="text-[13px]">
                        Evolución del valor según precios de mercado
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-1 rounded-lg border border-foreground/10 bg-background/70 p-1">
                      {performanceRanges.map((range) => (
                        <Button
                          key={range.value}
                          variant={performanceRange === range.value ? 'default' : 'ghost'}
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => setPerformanceRange(range.value)}
                        >
                          {range.label}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    {priceHistoryLoading ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        Cargando serie histórica...
                      </div>
                    ) : portfolioValueSeries.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No hay datos suficientes para esta ventana.
                      </div>
                    ) : (
                      <div className="flex h-full flex-col gap-3">
                        {performanceSummary && (
                          <div className="flex flex-wrap gap-4 text-[12px] text-muted-foreground">
                            <div>
                              <p className="text-[11px] uppercase tracking-wide">Inicio</p>
                              <p className="font-medium text-foreground">
                                {convertAndFormat(performanceSummary.start, baseCurrency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide">Ahora</p>
                              <p className="font-medium text-foreground">
                                {convertAndFormat(performanceSummary.end, baseCurrency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide">Variación</p>
                              <p
                                className={cn(
                                  'font-medium',
                                  performanceSummary.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                )}
                              >
                                {performanceSummary.change >= 0 ? '+' : ''}
                                {convertAndFormat(performanceSummary.change, baseCurrency)}
                                {performanceSummary.percent !== null && (
                                  <span className="ml-2 text-[11px] text-muted-foreground">
                                    ({performanceSummary.percent >= 0 ? '+' : ''}
                                    {performanceSummary.percent.toFixed(2)}%)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={portfolioValueSeries} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) =>
                                  new Date(value).toLocaleDateString('es-ES', { month: 'short', day: '2-digit' })
                                }
                              />
                              <YAxis
                                tickFormatter={(value) => convertAndFormat(value, baseCurrency)}
                                width={80}
                              />
                              <Tooltip
                                formatter={(value: number) => convertAndFormat(value, baseCurrency)}
                                labelFormatter={(label) =>
                                  new Date(label).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                }
                              />
                              <Area
                                type="monotone"
                                dataKey="value"
                                name="Valor"
                                stroke="hsl(var(--chart-1))"
                                fill="url(#portfolioFill)"
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-background/80 border-foreground/10 shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-[15px] font-medium">Evolución de la inversión</CardTitle>
                    <CardDescription className="text-[13px]">
                      Capital invertido y P&L realizado según tus operaciones
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    {chartOperationsLoading ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        Cargando datos de inversión...
                      </div>
                    ) : investmentTrendData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        Aún no hay operaciones suficientes para mostrar la evolución.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={investmentTrendData} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="investedFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="realizedFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) =>
                              new Date(value).toLocaleDateString('es-ES', { month: 'short', day: '2-digit' })
                            }
                          />
                          <YAxis
                            tickFormatter={(value) => convertAndFormat(value, baseCurrency)}
                            width={80}
                          />
                          <Tooltip
                            formatter={(value: number) => convertAndFormat(value, baseCurrency)}
                            labelFormatter={(label) =>
                              new Date(label).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                            }
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="invested"
                            name="Capital invertido"
                            stroke="hsl(var(--chart-1))"
                            fill="url(#investedFill)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="realized"
                            name="P&L realizado"
                            stroke="hsl(var(--chart-2))"
                            fill="url(#realizedFill)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Operation Form Dialog */}
      <OperationForm
        open={showOperationForm}
        onClose={handleCloseForm}
        editId={editOperationId}
        assets={assets || []}
      />
    </div>
  );
}
