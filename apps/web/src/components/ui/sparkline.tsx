'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fillColor?: string;
  showArea?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  strokeWidth = 2,
  color = 'currentColor',
  fillColor,
  showArea = true,
  className,
}: SparklineProps) {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return { line: '', area: '' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create line path
    const linePath = points
      .map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        
        // Use smooth curves for better appearance
        const prev = points[index - 1];
        const cpX = (prev.x + point.x) / 2;
        return `C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
      })
      .join(' ');

    // Create area path
    const areaPath = showArea
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`
      : '';

    return { line: linePath, area: areaPath };
  }, [data, width, height, showArea]);

  if (!data || data.length < 2) {
    return (
      <div 
        className={cn('flex items-center justify-center text-muted-foreground text-xs', className)}
        style={{ width, height }}
      >
        Sin datos
      </div>
    );
  }

  const trend = data[data.length - 1] - data[0];
  const trendColor = trend >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  const finalColor = color === 'auto' ? trendColor : color;
  const finalFillColor = fillColor || (color === 'auto' ? (trend >= 0 ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--destructive) / 0.1)') : `${finalColor}10`);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {showArea && pathData.area && (
        <path
          d={pathData.area}
          fill={finalFillColor}
          className="transition-all duration-300"
        />
      )}
      <path
        d={pathData.line}
        fill="none"
        stroke={finalColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
      {/* End point indicator */}
      <circle
        cx={width - 2}
        cy={2 + (height - 4) - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 4)}
        r={3}
        fill={finalColor}
        className="transition-all duration-300"
      />
    </svg>
  );
}

// Variant with trend indicator
interface SparklineWithTrendProps extends SparklineProps {
  showTrend?: boolean;
  trendLabel?: string;
}

export function SparklineWithTrend({
  data,
  showTrend = true,
  trendLabel,
  ...props
}: SparklineWithTrendProps) {
  const trend = useMemo(() => {
    if (!data || data.length < 2) return { value: 0, percentage: 0, isPositive: true };
    
    const first = data[0];
    const last = data[data.length - 1];
    const diff = last - first;
    const percentage = first !== 0 ? (diff / first) * 100 : 0;
    
    return {
      value: diff,
      percentage,
      isPositive: diff >= 0,
    };
  }, [data]);

  return (
    <div className="flex items-center gap-2">
      <Sparkline data={data} color="auto" {...props} />
      {showTrend && (
        <span className={cn(
          'text-xs font-medium',
          trend.isPositive ? 'text-success' : 'text-destructive'
        )}>
          {trend.isPositive ? '+' : ''}{trend.percentage.toFixed(1)}%
          {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
        </span>
      )}
    </div>
  );
}
