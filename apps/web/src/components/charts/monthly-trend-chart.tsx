'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/contexts/currency-context';
import type { Transaction } from '@/types/api';

interface MonthlyTrendChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function MonthlyTrendChart({ transactions, isLoading }: MonthlyTrendChartProps) {
  const { preferredCurrency, convertAmount, convertAndFormat } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);

  // Fix for ResponsiveContainer width/height -1 warning
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const data = useMemo(() => {
    const monthlyData = new Map<string, { income: number; expense: number }>();
    
    // Get date range from transactions, or default to last 6 months
    if (transactions.length > 0) {
      // Find min and max dates from transactions
      const dates = transactions.map(t => new Date(t.occurredAt));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      // Generate all months between min and max date
      const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      
      while (current <= end) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(key, { income: 0, expense: 0 });
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      // Default: last 6 months
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(key, { income: 0, expense: 0 });
      }
    }
    
    transactions.forEach(t => {
      const date = new Date(t.occurredAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.has(key)) {
        const data = monthlyData.get(key)!;
        const amount = parseFloat(t.amount);
        const converted = convertAmount(amount, t.currency) ?? amount;
        
        if (t.type === 'INCOME') {
          data.income += converted;
        } else if (t.type === 'EXPENSE') {
          data.expense += converted;
        }
      }
    });
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Sort entries by date
    const sortedEntries = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    return sortedEntries.map(([key, value]) => {
      const [year, month] = key.split('-');
      const shortYear = year.slice(-2);
      return {
        name: `${months[parseInt(month) - 1]} '${shortYear}`,
        ingresos: value.income,
        gastos: value.expense,
        balance: value.income - value.expense,
      };
    });
  }, [transactions, convertAmount]);

  // Determine description based on data range
  const dateRangeDescription = useMemo(() => {
    if (data.length === 0) return 'Ingresos vs Gastos';
    if (data.length <= 6) return 'Ingresos vs Gastos últimos meses';
    return `Ingresos vs Gastos (${data.length} meses)`;
  }, [data.length]);

  if (isLoading || !isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución Mensual</CardTitle>
          <CardDescription>Ingresos vs Gastos</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución Mensual</CardTitle>
        <CardDescription>{dateRangeDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value, name) => [
                  convertAndFormat(Number(value || 0), preferredCurrency),
                  String(name).charAt(0).toUpperCase() + String(name).slice(1)
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIngresos)"
                name="Ingresos"
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGastos)"
                name="Gastos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
