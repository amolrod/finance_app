'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkline } from '@/components/ui/sparkline';
import { cn, getInitials } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { COLOR_PALETTE } from '@/lib/color-palettes';

interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  currentAmount: number;
  previousAmount: number;
  dailyData: number[];
  transactionCount: number;
}

interface QuickTrendsWidgetProps {
  trends: CategoryTrend[];
  formatAmount: (amount: number) => string;
  className?: string;
  maxItems?: number;
}

const getSeedColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
};

export function QuickTrendsWidget({
  trends,
  formatAmount,
  className,
  maxItems = 5,
}: QuickTrendsWidgetProps) {
  const sortedTrends = useMemo(() => {
    return [...trends]
      .map(trend => ({
        ...trend,
        change: trend.previousAmount > 0 
          ? ((trend.currentAmount - trend.previousAmount) / trend.previousAmount) * 100
          : (trend.currentAmount > 0 ? 100 : 0),
      }))
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, maxItems);
  }, [trends, maxItems]);

  if (sortedTrends.length === 0) {
    return (
      <Card className={cn('bg-background/80 border-foreground/10 shadow-soft', className)}>
        <CardHeader>
          <CardTitle className="text-base">Tendencias Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay suficientes datos para mostrar tendencias
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-background/80 border-foreground/10 shadow-soft', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tendencias Rápidas</CardTitle>
          <Link 
            href="/dashboard/reports"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            Ver más
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedTrends.map((trend) => {
          const accentColor = trend.categoryColor || getSeedColor(trend.categoryName);
          const isPositive = trend.change <= 0; // For expenses, decrease is good
          const TrendIcon = trend.change > 0 ? TrendingUp : trend.change < 0 ? TrendingDown : Minus;
          
          return (
            <Link
              key={trend.categoryId}
              href={`/dashboard/transactions?categoryId=${trend.categoryId}`}
              className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-xl border bg-background/80"
                style={{
                  borderColor: `${accentColor}55`,
                  color: accentColor,
                  backgroundImage: `linear-gradient(140deg, ${accentColor}22, rgba(255,255,255,0.9))`,
                  boxShadow: `0 10px 24px -16px ${accentColor}cc`,
                }}
              >
                <span className="text-[9px] font-semibold">
                  {getInitials(trend.categoryName)}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {trend.categoryName}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatAmount(trend.currentAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-1">
                    <TrendIcon className={cn(
                      'h-3 w-3',
                      isPositive ? 'text-success' : 'text-destructive'
                    )} />
                    <span className={cn(
                      'text-xs font-medium',
                      isPositive ? 'text-success' : 'text-destructive'
                    )}>
                      {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({trend.transactionCount} tx)
                    </span>
                  </div>
                  <Sparkline 
                    data={trend.dailyData}
                    width={50}
                    height={16}
                    strokeWidth={1.5}
                    showArea={false}
                    color={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Savings Rate Widget
interface SavingsRateWidgetProps {
  income: number;
  expenses: number;
  previousIncome?: number;
  previousExpenses?: number;
  formatAmount: (amount: number) => string;
  className?: string;
}

export function SavingsRateWidget({
  income,
  expenses,
  previousIncome,
  previousExpenses,
  formatAmount,
  className,
}: SavingsRateWidgetProps) {
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  
  const previousSavings = previousIncome && previousExpenses 
    ? previousIncome - previousExpenses 
    : undefined;
  const previousSavingsRate = previousIncome && previousIncome > 0 
    ? ((previousSavings || 0) / previousIncome) * 100 
    : undefined;
  
  const rateChange = previousSavingsRate !== undefined 
    ? savingsRate - previousSavingsRate 
    : undefined;

  return (
    <Card className={cn('bg-background/80 border-foreground/10 shadow-soft', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Tasa de Ahorro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            'text-3xl font-bold',
            savingsRate >= 20 ? 'text-success' : savingsRate >= 0 ? 'text-warning' : 'text-destructive'
          )}>
            {savingsRate.toFixed(1)}%
          </span>
          {rateChange !== undefined && (
            <Badge variant={rateChange >= 0 ? 'default' : 'destructive'} className="text-xs">
              {rateChange >= 0 ? '+' : ''}{rateChange.toFixed(1)}%
            </Badge>
          )}
        </div>
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Ahorrado</span>
            <span className={savings >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
              {savings >= 0 ? '+' : ''}{formatAmount(savings)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>De {formatAmount(income)} ingresos</span>
          </div>
        </div>
        {savingsRate < 20 && (
          <p className="mt-3 text-xs text-muted-foreground">
            💡 Se recomienda ahorrar al menos el 20% de tus ingresos
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Net Worth Progress Widget
interface NetWorthProgressWidgetProps {
  currentNetWorth: number;
  goalNetWorth?: number;
  previousNetWorth?: number;
  formatAmount: (amount: number) => string;
  className?: string;
}

export function NetWorthProgressWidget({
  currentNetWorth,
  goalNetWorth = 100000,
  previousNetWorth,
  formatAmount,
  className,
}: NetWorthProgressWidgetProps) {
  const progress = goalNetWorth > 0 ? (currentNetWorth / goalNetWorth) * 100 : 0;
  const change = previousNetWorth !== undefined 
    ? currentNetWorth - previousNetWorth 
    : undefined;

  return (
    <Card className={cn('bg-background/80 border-foreground/10 shadow-soft', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Patrimonio Neto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {formatAmount(currentNetWorth)}
          </span>
          {change !== undefined && (
            <span className={cn(
              'text-xs font-medium',
              change >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {change >= 0 ? '+' : ''}{formatAmount(change)}
            </span>
          )}
        </div>
        
        {goalNetWorth && (
          <>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{progress.toFixed(0)}% del objetivo</span>
              <span>{formatAmount(goalNetWorth)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
