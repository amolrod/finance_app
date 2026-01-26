'use client';

import { ReactNode, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkline, SparklineWithTrend } from '@/components/ui/sparkline';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  sparklineData?: number[];
  className?: string;
  valueClassName?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  sparklineData,
  className,
  valueClassName,
  onClick,
}: StatCardProps) {
  const TrendIcon = useMemo(() => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  }, [trend]);

  return (
    <Card 
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-foreground/30',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <div className="space-y-1">
            <div className={cn('text-2xl font-bold', valueClassName)}>
              {value}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend.isPositive !== undefined
                  ? trend.isPositive ? 'text-success' : 'text-destructive'
                  : trend.value >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {TrendIcon && <TrendIcon className="h-3 w-3" />}
                <span>
                  {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground font-normal">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <Sparkline 
              data={sparklineData} 
              color="auto"
              width={80}
              height={32}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced stat card with comparison to previous period
interface ComparisonStatCardProps extends StatCardProps {
  previousValue?: number;
  currentValue?: number;
  comparisonLabel?: string;
}

export function ComparisonStatCard({
  title,
  value,
  previousValue,
  currentValue,
  comparisonLabel = 'vs mes anterior',
  ...props
}: ComparisonStatCardProps) {
  const comparison = useMemo(() => {
    if (previousValue === undefined || currentValue === undefined) return null;
    if (previousValue === 0) return { value: 100, isPositive: currentValue >= 0 };
    
    const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
    return {
      value: change,
      isPositive: change >= 0,
    };
  }, [previousValue, currentValue]);

  return (
    <StatCard
      title={title}
      value={value}
      trend={comparison ? {
        value: comparison.value,
        label: comparisonLabel,
        isPositive: comparison.isPositive,
      } : undefined}
      {...props}
    />
  );
}

// Grid of stats for dashboard overview
interface StatGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
