'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTransactions } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, cn, getInitials } from '@/lib/utils';
import { useCurrency } from '@/contexts/currency-context';
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Wallet, Calendar, PiggyBank, CreditCard, ArrowRight, BarChart3 } from 'lucide-react';
import { InteractiveExpenseChart, InteractiveMonthlyChart } from '@/components/charts';
import type { TransactionFilters, TransactionType } from '@/types/api';
import Link from 'next/link';
import { COLOR_PALETTE } from '@/lib/color-palettes';

export default function ReportsPage() {
  const { convertAmount, formatAmount, preferredCurrency } = useCurrency();
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    limit: 500,
  });

  const { data: transactions, isLoading } = useTransactions(filters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  // Calculate summary - convertir cada transacción a la moneda preferida
  const summary = useMemo(() => {
    if (!transactions?.data) return { income: 0, expense: 0, balance: 0 };
    
    const income = transactions.data
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => {
        const converted = convertAmount(parseFloat(t.amount), t.currency);
        return sum + (converted ?? parseFloat(t.amount));
      }, 0);
    
    const expense = transactions.data
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => {
        const converted = convertAmount(parseFloat(t.amount), t.currency);
        return sum + (converted ?? parseFloat(t.amount));
      }, 0);
    
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions, convertAmount]);

  // Group by category - con conversión de moneda
  const categoryBreakdown = useMemo(() => {
    if (!transactions?.data) return [];
    
    const categoryMap = new Map<string, { 
      name: string; 
      categoryId?: string;
      income: number; 
      expense: number;
      transactionCount: number;
      color?: string;
    }>();
    
    transactions.data.forEach(t => {
      const categoryName = t.category?.name || 'Sin categoría';
      const categoryId = t.category?.id;
      const categoryColor = t.category?.color || undefined;
      const existing = categoryMap.get(categoryName) || { 
        name: categoryName, 
        categoryId,
        income: 0, 
        expense: 0,
        transactionCount: 0,
        color: categoryColor,
      };
      const amount = parseFloat(t.amount);
      const converted = convertAmount(amount, t.currency) ?? amount;
      
      existing.transactionCount++;
      
      if (t.type === 'INCOME') {
        existing.income += converted;
      } else if (t.type === 'EXPENSE') {
        existing.expense += converted;
      }
      
      categoryMap.set(categoryName, existing);
    });
    
    return Array.from(categoryMap.values())
      .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
  }, [transactions, convertAmount]);

  // Export to CSV
  const exportToCSV = () => {
    if (!transactions?.data) return;
    
    const headers = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Cuenta', 'Monto', 'Moneda'];
    const rows = transactions.data.map(t => [
      formatDate(t.occurredAt),
      t.type === 'INCOME' ? 'Ingreso' : t.type === 'EXPENSE' ? 'Gasto' : 'Transferencia',
      t.description || '',
      t.category?.name || '',
      t.account?.name || '',
      t.amount,
      t.currency,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones_${filters.startDate}_${filters.endDate}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    if (!transactions?.data) return;

    const headers = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Cuenta', 'Monto', 'Moneda'];
    const rows = transactions.data.map(t => [
      formatDate(t.occurredAt),
      t.type === 'INCOME' ? 'Ingreso' : t.type === 'EXPENSE' ? 'Gasto' : 'Transferencia',
      t.description || '',
      t.category?.name || '',
      t.account?.name || '',
      t.amount,
      t.currency,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones_${filters.startDate}_${filters.endDate}.xls`;
    link.click();
  };

  // Quick date presets
  const setDatePreset = (preset: string) => {
    const now = new Date();
    let start: Date;
    let end = now;
    
    switch (preset) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last3Months':
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }
    
    setFilters({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PageHeader
          title="Reportes"
          description="Análisis detallado de tus finanzas"
          icon={<BarChart3 className="h-5 w-5" />}
          action={
            <>
              <Button 
                onClick={exportToCSV} 
                disabled={!transactions?.data?.length}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                onClick={exportToExcel}
                disabled={!transactions?.data?.length}
              >
                Exportar Excel
              </Button>
            </>
          }
        />
      </motion.div>

      {/* Date Filters - Mejorado */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-foreground/10 bg-background/80 shadow-soft">
          <CardContent className="p-0">
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-foreground/[0.02] via-transparent to-transparent border-b border-border/50">
              <span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground mr-2">
                <Calendar className="h-4 w-4" />
                Período:
              </span>
              {[
                { id: 'thisMonth', label: 'Este mes' },
                { id: 'lastMonth', label: 'Mes anterior' },
                { id: 'last3Months', label: 'Últimos 3 meses' },
                { id: 'thisYear', label: 'Este año' },
              ].map((preset) => (
                <Button 
                  key={preset.id}
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDatePreset(preset.id)}
                  className="rounded-full h-8 text-[13px]"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            {/* Date inputs */}
            <div className="flex flex-wrap gap-4 items-end p-4">
              <div className="space-y-2">
                <Label className="text-[13px] text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] text-muted-foreground">Tipo</Label>
                <Select onValueChange={(value) => {
                  const newFilters = { ...filters };
                  if (value === 'ALL') {
                    delete newFilters.type;
                  } else {
                    newFilters.type = value as TransactionType;
                  }
                  setFilters(newFilters);
                }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="INCOME">Ingresos</SelectItem>
                    <SelectItem value="EXPENSE">Gastos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">Total Ingresos</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5">
                <TrendingUp className="h-4 w-4 text-foreground/70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums text-success/80">
                +{formatAmount(summary.income)}
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">
                {transactions?.data?.filter(t => t.type === 'INCOME').length || 0} transacciones
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expense Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">Total Gastos</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5">
                <TrendingDown className="h-4 w-4 text-foreground/70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums text-foreground">
                -{formatAmount(summary.expense)}
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">
                {transactions?.data?.filter(t => t.type === 'EXPENSE').length || 0} transacciones
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">Balance Neto</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5">
                <Wallet className="h-4 w-4 text-foreground/70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-semibold tabular-nums",
                summary.balance >= 0 ? 'text-success/80' : 'text-foreground'
              )}>
                {summary.balance >= 0 ? '+' : ''}{formatAmount(summary.balance)}
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">
                Diferencia del período
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Interactive Charts */}
      <motion.div 
        className="grid gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <InteractiveMonthlyChart 
          transactions={transactions?.data || []} 
          isLoading={isLoading}
        />
        <InteractiveExpenseChart 
          transactions={transactions?.data || []} 
          isLoading={isLoading}
        />
      </motion.div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">Días Analizados</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5">
                <Calendar className="h-4 w-4 text-foreground/70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tabular-nums">
                {(() => {
                  if (!filters.startDate || !filters.endDate) return '-';
                  const start = new Date(filters.startDate);
                  const end = new Date(filters.endDate);
                  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                })()}
              </div>
              <p className="text-[13px] text-muted-foreground">
                {filters.startDate} - {filters.endDate}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">Tasa de Ahorro</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5">
                <PiggyBank className="h-4 w-4 text-foreground/70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-xl font-semibold tabular-nums",
                summary.income > 0 && (summary.balance / summary.income) * 100 >= 20 
                  ? 'text-success/80' 
                  : 'text-foreground'
              )}>
                {summary.income > 0 
                  ? `${((summary.balance / summary.income) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
              <p className="text-[13px] text-muted-foreground">
                Del total de ingresos
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">Gasto Diario Promedio</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5">
                <CreditCard className="h-4 w-4 text-foreground/70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tabular-nums">
                {(() => {
                  if (!filters.startDate || !filters.endDate) return '-';
                  const start = new Date(filters.startDate);
                  const end = new Date(filters.endDate);
                  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  return formatAmount(summary.expense / days);
                })()}
              </div>
              <p className="text-[13px] text-muted-foreground">
                Por día en el período
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">Categorías Activas</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5">
                <FileSpreadsheet className="h-4 w-4 text-foreground/70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                {categoryBreakdown.length}
              </div>
              <p className="text-[13px] text-muted-foreground">
                Con movimientos en el período
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Breakdown Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-foreground/10 bg-background/80 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                  </div>
                  Desglose por Categoría
                </CardTitle>
                <CardDescription className="mt-1 text-[13px]">Haz clic en una categoría para ver sus transacciones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No hay datos para el período seleccionado
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Transacciones</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.map((category, index) => {
                  const balance = category.income - category.expense;
                  const categoryParam = category.categoryId 
                    ? `categoryId=${category.categoryId}`
                    : `category=${encodeURIComponent(category.name)}`;
                  const dateParams = filters.startDate && filters.endDate 
                    ? `&startDate=${filters.startDate}&endDate=${filters.endDate}`
                    : '';
                  const accentColor = category.color || COLOR_PALETTE[index % COLOR_PALETTE.length];
                  
                  return (
                    <motion.tr
                      key={category.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-b"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full border bg-background/80 shrink-0"
                            style={{
                              borderColor: `${accentColor}40`,
                              color: accentColor,
                            }}
                          >
                            <span className="text-[9px] font-semibold">
                              {getInitials(category.name)}
                            </span>
                          </div>
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-muted">
                          {category.transactionCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-success/80">
                        {category.income > 0 ? `+${formatAmount(category.income)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right text-destructive/80">
                        {category.expense > 0 ? `-${formatAmount(category.expense)}` : '-'}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-semibold",
                        balance >= 0 ? 'text-success/80' : 'text-destructive/80'
                      )}>
                        {balance >= 0 ? '+' : ''}{formatAmount(balance)}
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/dashboard/transactions?${categoryParam}${dateParams}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
