'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, DollarSign, PieChart, BarChart3, RefreshCcw, Clock, Briefcase, ChevronRight } from 'lucide-react';
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
  const { convertAndFormat } = useCurrency();
  
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

  const totalInvested = portfolio ? parseFloat(portfolio.totalInvested) : 0;
  const totalCurrentValue = portfolio?.totalCurrentValue ? parseFloat(portfolio.totalCurrentValue) : null;
  const unrealizedPnL = portfolio?.totalUnrealizedPnL ? parseFloat(portfolio.totalUnrealizedPnL) : null;
  const realizedPnL = portfolio ? parseFloat(portfolio.totalRealizedPnL) : 0;

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
            <div className="absolute -inset-1 rounded-2xl bg-cyan-500/30 blur-md" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/30 bg-background/80 shadow-soft">
              <Briefcase className="h-5 w-5 text-cyan-600" />
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
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(16,185,129,0.18), transparent 60%)' }} />
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-muted-foreground">Total Invertido</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {loadingPortfolio ? '...' : convertAndFormat(totalInvested, 'USD')}
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
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 60%)' }} />
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-muted-foreground">Valor Actual</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {loadingPortfolio 
                  ? '...' 
                  : totalCurrentValue !== null 
                    ? convertAndFormat(totalCurrentValue, 'USD')
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
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(14,165,233,0.2), transparent 60%)' }} />
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-muted-foreground">P&L No Realizado</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10">
                  {unrealizedPnL !== null && unrealizedPnL >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-sky-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-sky-600" />
                  )}
                </div>
              </div>
              <p className={cn(
                "text-2xl font-semibold tabular-nums",
                unrealizedPnL !== null && unrealizedPnL >= 0 
                  ? "text-green-600 dark:text-green-500" 
                  : "text-foreground"
              )}>
                {loadingPortfolio 
                  ? '...'
                  : unrealizedPnL !== null 
                    ? `${unrealizedPnL >= 0 ? '+' : ''}${convertAndFormat(unrealizedPnL, 'USD')}`
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
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 60%)' }} />
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-muted-foreground">P&L Realizado</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10">
                  <PieChart className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <p className={cn(
                "text-2xl font-semibold tabular-nums",
                realizedPnL >= 0 ? "text-green-600 dark:text-green-500" : "text-foreground"
              )}>
                {loadingPortfolio 
                  ? '...'
                  : `${realizedPnL >= 0 ? '+' : ''}${convertAndFormat(realizedPnL, 'USD')}`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Ganancias cerradas</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Asset Type Distribution - Estilo lista Apple */}
      {portfolio && Object.keys(portfolio.byAssetType).length > 0 && (
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
                {Object.entries(portfolio.byAssetType).map(([type, data]) => {
                  const invested = parseFloat(data.invested);
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
                            style={{ width: `${percentage}%`, backgroundColor: accentColor }}
                          />
                        </div>
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                          {convertAndFormat(invested, 'USD')}
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

      {/* Tabs: Holdings / Operations - Estilo segmented control Apple */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
      >
        <Tabs defaultValue="holdings" className="space-y-4">
          <TabsList className="h-9 p-0.5 bg-background/80 border border-foreground/10 shadow-soft">
            <TabsTrigger value="holdings" className="text-[13px] h-8 px-4">Posiciones</TabsTrigger>
            <TabsTrigger value="operations" className="text-[13px] h-8 px-4">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-4">
            <HoldingsTable holdings={holdings || []} loading={loadingHoldings} />
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            <OperationsTable onEdit={handleEdit} />
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
