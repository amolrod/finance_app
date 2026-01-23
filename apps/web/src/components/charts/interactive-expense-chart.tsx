'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/currency-context';
import { formatDate } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import type { Transaction } from '@/types/api';

interface InteractiveExpenseChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
  dateRange?: { start: string; end: string };
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  categoryId?: string;
  transactions: Transaction[];
  percentage: number;
  [key: string]: string | number | Transaction[] | undefined;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
];

export function InteractiveExpenseChart({ transactions, isLoading }: InteractiveExpenseChartProps) {
  const router = useRouter();
  const { preferredCurrency, convertAmount, convertAndFormat, formatAmount } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = useMemo(() => {
    const categoryMap = new Map<string, CategoryData>();
    
    const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
    
    expenseTransactions.forEach(t => {
      const categoryName = t.category?.name || 'Sin categoría';
      const categoryColor = t.category?.color || '#6b7280';
      const categoryId = t.category?.id;
      const existing = categoryMap.get(categoryName);
      const amount = parseFloat(t.amount);
      const converted = convertAmount(amount, t.currency) ?? amount;
      
      if (existing) {
        existing.value += converted;
        existing.transactions.push(t);
      } else {
        categoryMap.set(categoryName, {
          name: categoryName,
          value: converted,
          color: categoryColor,
          categoryId,
          transactions: [t],
          percentage: 0,
        });
      }
    });
    
    const result = Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    const total = result.reduce((acc, item) => acc + item.value, 0);
    result.forEach(item => {
      item.percentage = total > 0 ? (item.value / total) * 100 : 0;
    });
    
    return result;
  }, [transactions, convertAmount]);

  const total = data.reduce((acc, item) => acc + item.value, 0);

  // Transform data for recharts compatibility - must be before any conditional returns
  const chartData = useMemo(() => data.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color,
  })), [data]);

  const handlePieClick = useCallback((categoryData: CategoryData) => {
    setSelectedCategory(categoryData);
    setIsDialogOpen(true);
  }, []);

  const navigateToTransactions = (categoryId?: string, categoryName?: string) => {
    if (categoryId) {
      router.push(`/dashboard/transactions?categoryId=${categoryId}`);
    } else if (categoryName) {
      router.push(`/dashboard/transactions?category=${encodeURIComponent(categoryName)}`);
    }
  };

  if (isLoading || !isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
          <CardDescription>Haz clic en una categoría para ver detalles</CardDescription>
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
          <CardDescription>Haz clic en una categoría para ver detalles</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No hay gastos registrados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
          <CardDescription>Haz clic en una categoría para ver detalles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(_, index) => handlePieClick(data[index])}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]}
                      style={{ cursor: 'pointer' }}
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
          
          {/* Category Legend with clickable items */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.slice(0, 6).map((category, index) => (
              <button
                key={category.name}
                onClick={() => handlePieClick(category)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.percentage.toFixed(1)}% · {formatAmount(category.value)}
                  </p>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">Total de gastos</p>
            <p className="text-2xl font-bold text-destructive">
              -{convertAndFormat(total, preferredCurrency)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for category details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedCategory?.color }}
              />
              {selectedCategory?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory?.transactions.length} transacciones · {selectedCategory?.percentage.toFixed(1)}% del total
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total gastado</p>
                  <p className="text-xl font-bold text-destructive">
                    -{formatAmount(selectedCategory?.value || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Promedio por transacción</p>
                  <p className="text-xl font-bold">
                    {formatAmount((selectedCategory?.value || 0) / (selectedCategory?.transactions.length || 1))}
                  </p>
                </div>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCategory?.transactions
                  .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
                  .slice(0, 20)
                  .map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">
                        {formatDate(tx.occurredAt)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tx.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.account?.name}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        -{convertAndFormat(parseFloat(tx.amount), tx.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            
            {(selectedCategory?.transactions.length || 0) > 20 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Mostrando 20 de {selectedCategory?.transactions.length} transacciones
              </p>
            )}
          </div>
          
          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              navigateToTransactions(selectedCategory?.categoryId, selectedCategory?.name);
              setIsDialogOpen(false);
            }}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver todas en Transacciones
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
