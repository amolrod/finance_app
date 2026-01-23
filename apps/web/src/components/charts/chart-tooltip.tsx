'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipContentProps {
  title: string;
  items: {
    label: string;
    value: string | number;
    color?: string;
    highlight?: boolean;
  }[];
  footer?: ReactNode;
  className?: string;
}

export function EnhancedTooltipContent({
  title,
  items,
  footer,
  className,
}: TooltipContentProps) {
  return (
    <div className={cn(
      'bg-popover/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 min-w-[180px]',
      className
    )}>
      <p className="font-semibold text-sm mb-2 text-foreground">{title}</p>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={cn(
              'flex items-center justify-between text-sm',
              item.highlight && 'font-semibold'
            )}
          >
            <div className="flex items-center gap-2">
              {item.color && (
                <div 
                  className="h-2.5 w-2.5 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-muted-foreground">{item.label}</span>
            </div>
            <span className={cn(
              'font-medium',
              item.highlight && 'text-primary'
            )}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
      {footer && (
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

// Custom tooltip for Recharts
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: Record<string, unknown>;
  }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
  showTotal?: boolean;
  totalLabel?: string;
}

export function CustomChartTooltip({
  active,
  payload,
  label,
  formatter = (v) => v.toLocaleString('es-ES', { minimumFractionDigits: 2 }),
  labelFormatter = (l) => l,
  showTotal = false,
  totalLabel = 'Total',
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const total = showTotal 
    ? payload.reduce((sum, entry) => sum + (entry.value || 0), 0)
    : 0;

  const items = payload.map((entry) => ({
    label: entry.name,
    value: formatter(entry.value, entry.name),
    color: entry.color,
    highlight: false,
  }));

  if (showTotal) {
    items.push({
      label: totalLabel,
      value: formatter(total, totalLabel),
      highlight: true,
      color: '',
    });
  }

  return (
    <EnhancedTooltipContent
      title={labelFormatter(label || '')}
      items={items}
    />
  );
}

// Tooltip for pie charts with percentage
interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      color: string;
      percent?: number;
      transactionCount?: number;
    };
  }>;
  formatter?: (value: number) => string;
}

export function PieChartTooltip({
  active,
  payload,
  formatter = (v) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
}: PieTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  const percent = data.percent !== undefined 
    ? data.percent 
    : 0;

  const items = [
    {
      label: 'Monto',
      value: `€${formatter(data.value)}`,
      highlight: true,
    },
    {
      label: 'Porcentaje',
      value: `${(percent * 100).toFixed(1)}%`,
    },
  ];

  if (data.transactionCount !== undefined) {
    items.push({
      label: 'Transacciones',
      value: data.transactionCount.toString(),
    });
  }

  return (
    <EnhancedTooltipContent
      title={data.name}
      items={items}
      footer="Haz clic para ver detalles"
    />
  );
}

// Legend component with interactive items
interface LegendItem {
  name: string;
  color: string;
  value?: string | number;
  active?: boolean;
}

interface InteractiveLegendProps {
  items: LegendItem[];
  onItemClick?: (name: string) => void;
  onItemHover?: (name: string | null) => void;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

export function InteractiveLegend({
  items,
  onItemClick,
  onItemHover,
  className,
  layout = 'horizontal',
}: InteractiveLegendProps) {
  return (
    <div className={cn(
      'flex flex-wrap gap-3',
      layout === 'vertical' && 'flex-col',
      className
    )}>
      {items.map((item) => (
        <button
          key={item.name}
          className={cn(
            'flex items-center gap-2 text-sm transition-opacity',
            item.active === false && 'opacity-40',
            (onItemClick || onItemHover) && 'cursor-pointer hover:opacity-80'
          )}
          onClick={() => onItemClick?.(item.name)}
          onMouseEnter={() => onItemHover?.(item.name)}
          onMouseLeave={() => onItemHover?.(null)}
        >
          <div 
            className="h-3 w-3 rounded-sm" 
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.name}</span>
          {item.value !== undefined && (
            <span className="font-medium">{item.value}</span>
          )}
        </button>
      ))}
    </div>
  );
}
