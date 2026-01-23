'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { formatDate, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ExternalLink, BarChart3, LineChart } from 'lucide-react';
import type { Transaction } from '@/types/api';

interface InteractiveMonthlyChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

interface MonthData {
  key: string;
  name: string;
  fullName: string;
  ingresos: number;
  gastos: number;
  balance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  transactions: Transaction[];
}

export function InteractiveMonthlyChart({ transactions, isLoading }: InteractiveMonthlyChartProps) {
  const router = useRouter();
  const { preferredCurrency, convertAmount, convertAndFormat, formatAmount } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = useMemo(() => {
    const monthlyData = new Map<string, MonthData>();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    if (transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.occurredAt));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      
      while (current <= end) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const shortYear = current.getFullYear().toString().slice(-2);
        monthlyData.set(key, {
          key,
          name: `${shortMonths[current.getMonth()]} '${shortYear}`,
          fullName: `${months[current.getMonth()]} ${current.getFullYear()}`,
          ingresos: 0,
          gastos: 0,
          balance: 0,
          transactionCount: 0,
          incomeCount: 0,
          expenseCount: 0,
          transactions: [],
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const shortYear = date.getFullYear().toString().slice(-2);
        monthlyData.set(key, {
          key,
          name: `${shortMonths[date.getMonth()]} '${shortYear}`,
          fullName: `${months[date.getMonth()]} ${date.getFullYear()}`,
          ingresos: 0,
          gastos: 0,
          balance: 0,
          transactionCount: 0,
          incomeCount: 0,
          expenseCount: 0,
          transactions: [],
        });
      }
    }
    
    transactions.forEach(t => {
      const date = new Date(t.occurredAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.has(key)) {
        const data = monthlyData.get(key)!;
        const amount = parseFloat(t.amount);
        const converted = convertAmount(amount, t.currency) ?? amount;
        
        data.transactions.push(t);
        data.transactionCount++;
        
        if (t.type === 'INCOME') {
          data.ingresos += converted;
          data.incomeCount++;
        } else if (t.type === 'EXPENSE') {
          data.gastos += converted;
          data.expenseCount++;
        }
        
        data.balance = data.ingresos - data.gastos;
      }
    });
    
    return Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, value]) => value);
  }, [transactions, convertAmount]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    
    const totalIncome = data.reduce((sum, m) => sum + m.ingresos, 0);
    const totalExpense = data.reduce((sum, m) => sum + m.gastos, 0);
    const avgIncome = totalIncome / data.length;
    const avgExpense = totalExpense / data.length;
    const bestMonth = [...data].sort((a, b) => b.balance - a.balance)[0];
    const worstMonth = [...data].sort((a, b) => a.balance - b.balance)[0];
    
    // Calculate trend (compare last month to average)
    const lastMonth = data[data.length - 1];
    const incomeTrend = lastMonth ? ((lastMonth.ingresos - avgIncome) / avgIncome) * 100 : 0;
    const expenseTrend = lastMonth ? ((lastMonth.gastos - avgExpense) / avgExpense) * 100 : 0;
    
    return {
      totalIncome,
      totalExpense,
      avgIncome,
      avgExpense,
      bestMonth,
      worstMonth,
      incomeTrend,
      expenseTrend,
    };
  }, [data]);

  const handleBarClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const monthData = data.activePayload[0].payload as MonthData;
      setSelectedMonth(monthData);
      setIsDialogOpen(true);
    }
  }, []);

  const navigateToTransactions = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;
    router.push(`/dashboard/transactions?startDate=${startDate}&endDate=${endDate}`);
  };

  if (isLoading || !isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución Mensual</CardTitle>
          <CardDescription>Haz clic en un mes para ver detalles</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evolución Mensual</CardTitle>
              <CardDescription>
                {data.length} meses · Haz clic en un mes para ver detalles
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant={chartType === 'area' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setChartType('area')}
              >
                <LineChart className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              {chartType === 'area' ? (
                <AreaChart 
                  data={data} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                >
                  <defs>
                    <linearGradient id="colorIngresosInt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGastosInt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
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
                    labelFormatter={(label) => `📅 ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIngresosInt)"
                    name="Ingresos"
                  />
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGastosInt)"
                    name="Gastos"
                  />
                </AreaChart>
              ) : (
                <BarChart 
                  data={data} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
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
                    labelFormatter={(label) => `📅 ${label}`}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" />
                  <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Stats summary */}
          {stats && (
            <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Promedio Ingresos</p>
                <p className="text-sm font-semibold text-success">
                  +{formatAmount(stats.avgIncome)}
                </p>
                {stats.incomeTrend !== 0 && (
                  <p className={cn(
                    "text-xs flex items-center justify-center gap-1",
                    stats.incomeTrend > 0 ? "text-success" : "text-destructive"
                  )}>
                    {stats.incomeTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(stats.incomeTrend).toFixed(0)}% vs promedio
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Promedio Gastos</p>
                <p className="text-sm font-semibold text-destructive">
                  -{formatAmount(stats.avgExpense)}
                </p>
                {stats.expenseTrend !== 0 && (
                  <p className={cn(
                    "text-xs flex items-center justify-center gap-1",
                    stats.expenseTrend < 0 ? "text-success" : "text-destructive"
                  )}>
                    {stats.expenseTrend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {Math.abs(stats.expenseTrend).toFixed(0)}% vs promedio
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Mejor Mes</p>
                <p className="text-sm font-semibold">{stats.bestMonth?.name}</p>
                <p className="text-xs text-success">+{formatAmount(stats.bestMonth?.balance || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Peor Mes</p>
                <p className="text-sm font-semibold">{stats.worstMonth?.name}</p>
                <p className={cn(
                  "text-xs",
                  (stats.worstMonth?.balance || 0) >= 0 ? "text-success" : "text-destructive"
                )}>
                  {(stats.worstMonth?.balance || 0) >= 0 ? '+' : ''}{formatAmount(stats.worstMonth?.balance || 0)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for month details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>📅 {selectedMonth?.fullName}</DialogTitle>
            <DialogDescription>
              {selectedMonth?.transactionCount} transacciones totales
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {/* Month summary */}
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="p-4 bg-success/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-xl font-bold text-success">
                  +{formatAmount(selectedMonth?.ingresos || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedMonth?.incomeCount} transacciones
                </p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-xl font-bold text-destructive">
                  -{formatAmount(selectedMonth?.gastos || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedMonth?.expenseCount} transacciones
                </p>
              </div>
              <div className={cn(
                "p-4 rounded-lg text-center",
                (selectedMonth?.balance || 0) >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={cn(
                  "text-xl font-bold",
                  (selectedMonth?.balance || 0) >= 0 ? "text-success" : "text-destructive"
                )}>
                  {(selectedMonth?.balance || 0) >= 0 ? '+' : ''}{formatAmount(selectedMonth?.balance || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ahorro del mes
                </p>
              </div>
            </div>

            {/* Category breakdown for the month */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Top categorías de gasto</h4>
              <div className="space-y-2">
                {(() => {
                  const categoryTotals = new Map<string, { name: string; total: number; color: string }>();
                  selectedMonth?.transactions
                    .filter(t => t.type === 'EXPENSE')
                    .forEach(t => {
                      const name = t.category?.name || 'Sin categoría';
                      const existing = categoryTotals.get(name);
                      const amount = convertAmount(parseFloat(t.amount), t.currency) ?? parseFloat(t.amount);
                      if (existing) {
                        existing.total += amount;
                      } else {
                        categoryTotals.set(name, { name, total: amount, color: t.category?.color || '#6b7280' });
                      }
                    });
                  
                  return Array.from(categoryTotals.values())
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map(cat => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        <span className="text-sm font-medium text-destructive">
                          -{formatAmount(cat.total)}
                        </span>
                      </div>
                    ));
                })()}
              </div>
            </div>
            
            {/* Recent transactions */}
            <h4 className="text-sm font-medium mb-2">Últimas transacciones</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedMonth?.transactions
                  .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
                  .slice(0, 15)
                  .map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">
                        {formatDate(tx.occurredAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'INCOME' ? 'default' : 'destructive'}>
                          {tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tx.description || tx.category?.name || '-'}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        tx.type === 'INCOME' ? 'text-success' : 'text-destructive'
                      )}>
                        {tx.type === 'INCOME' ? '+' : '-'}{convertAndFormat(parseFloat(tx.amount), tx.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            
            {(selectedMonth?.transactions.length || 0) > 15 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Mostrando 15 de {selectedMonth?.transactions.length} transacciones
              </p>
            )}
          </div>
          
          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              if (selectedMonth) {
                navigateToTransactions(selectedMonth.key);
              }
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
