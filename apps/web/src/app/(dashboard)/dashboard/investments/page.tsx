'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, DollarSign, PieChart, BarChart3, RefreshCcw, Clock, Briefcase, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePortfolioSummary, useHoldings, useRefreshPrices, useAutoRefreshPrices } from '@/hooks/use-investments';
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

export default function InvestmentsPage() {
  const [showOperationForm, setShowOperationForm] = useState(false);
  const [editOperationId, setEditOperationId] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { convertAmount, formatAmount, convertAndFormat, preferredCurrency } = useCurrency();
  
  const { data: portfolio, isLoading: loadingPortfolio } = usePortfolioSummary();
  const { data: holdings, isLoading: loadingHoldings } = useHoldings();
  const { data: assets } = useAssets();
  const refreshPricesMutation = useRefreshPrices();
  
  // Auto-refresh precios cada 5 minutos
  const { data: autoRefreshData, isFetching: isAutoRefreshing } = useAutoRefreshPrices(holdings && holdings.length > 0);

  // Actualizar tiempo de última actualización
  useEffect(() => {
    if (autoRefreshData?.lastUpdated) {
      setLastUpdateTime(new Date(autoRefreshData.lastUpdated));
    }
  }, [autoRefreshData?.lastUpdated]);

  const holdingsData = holdings || portfolio?.holdings || [];
  const holdingCurrencies = useMemo(() => {
    return new Set(holdingsData.map((h) => h.currency).filter(Boolean));
  }, [holdingsData]);
  const isSingleCurrency = holdingCurrencies.size <= 1;
  const baseCurrency =
    (isSingleCurrency ? holdingCurrencies.values().next().value : preferredCurrency) ||
    preferredCurrency ||
    'USD';

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
