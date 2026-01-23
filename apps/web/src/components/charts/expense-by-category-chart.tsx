'use client';

import { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/contexts/currency-context';
import type { Transaction } from '@/types/api';

interface ExpenseByCategoryChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const COLORS = [
  '#6b7280', // gray
  '#71717a', // zinc
  '#737373', // neutral
  '#525252', // neutral-600
  '#64748b', // slate
  '#78716c', // stone
  '#404040', // neutral-700
  '#57534e', // stone-600
  '#374151', // gray-700
  '#3f3f46', // zinc-700
];

export function ExpenseByCategoryChart({ transactions, isLoading }: ExpenseByCategoryChartProps) {
  const { preferredCurrency, convertAmount, convertAndFormat } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);

  // Fix for ResponsiveContainer width/height -1 warning
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const data = useMemo(() => {
    const categoryMap = new Map<string, { name: string; value: number; color: string }>();
    
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const categoryName = t.category?.name || 'Sin categoría';
        const categoryColor = t.category?.color || '#6b7280';
        const existing = categoryMap.get(categoryName);
        const amount = parseFloat(t.amount);
        const converted = convertAmount(amount, t.currency) ?? amount;
        
        if (existing) {
          existing.value += converted;
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            value: converted,
            color: categoryColor,
          });
        }
      });
    
    return Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [transactions, convertAmount]);

  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (isLoading || !isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
          <CardDescription>Distribución de gastos del período</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded-full h-48 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
          <CardDescription>Distribución de gastos del período</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No hay gastos registrados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por Categoría</CardTitle>
        <CardDescription>Distribución de gastos del período</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [convertAndFormat(Number(value || 0), preferredCurrency), 'Gasto']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">Total de gastos</p>
          <p className="text-2xl font-bold text-destructive">
            -{convertAndFormat(total, preferredCurrency)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
