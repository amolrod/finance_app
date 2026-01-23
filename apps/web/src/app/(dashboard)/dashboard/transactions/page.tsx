'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions, useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { ConvertedAmount } from '@/components/converted-amount';
import { Plus, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Trash2, Search, Filter, X, Tag, FolderOpen, Pencil, Check, XIcon, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TransactionType, TransactionFilters, Transaction } from '@/types/api';
import { BatchActionsBar, useSelection } from '@/components/ui/batch-actions';

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.string().min(1, 'El monto es requerido'),
  description: z.string().optional(),
  date: z.string().optional(),
  accountId: z.string().min(1, 'La cuenta es requerida'),
  categoryId: z.string().optional(),
  destinationAccountId: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

const typeLabels: Record<TransactionType, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  TRANSFER: 'Transferencia',
};

const typeIcons: Record<TransactionType, typeof ArrowUpRight> = {
  INCOME: ArrowDownRight,
  EXPENSE: ArrowUpRight,
  TRANSFER: ArrowLeftRight,
};

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({ limit: 50 });
  const [activeFiltersFromUrl, setActiveFiltersFromUrl] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ description?: string; categoryId?: string }>({});
  const [batchCategoryDialogOpen, setBatchCategoryDialogOpen] = useState(false);
  const [batchCategoryId, setBatchCategoryId] = useState<string>('');
  const { toast } = useToast();

  // Read URL parameters on mount
  useEffect(() => {
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') as TransactionType | null;
    const accountId = searchParams.get('accountId');
    
    const urlFilters: string[] = [];
    const newFilters: TransactionFilters = { limit: 50 };
    
    if (categoryId) {
      newFilters.categoryId = categoryId;
      urlFilters.push('categoría');
    }
    if (startDate) {
      newFilters.startDate = startDate;
      urlFilters.push('fecha inicio');
    }
    if (endDate) {
      newFilters.endDate = endDate;
      urlFilters.push('fecha fin');
    }
    if (type && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
      newFilters.type = type;
      urlFilters.push('tipo');
    }
    if (accountId) {
      newFilters.accountId = accountId;
      urlFilters.push('cuenta');
    }
    
    if (urlFilters.length > 0) {
      setFilters(newFilters);
      setActiveFiltersFromUrl(urlFilters);
    }
  }, [searchParams]);

  const clearUrlFilters = () => {
    setFilters({ limit: 50 });
    setActiveFiltersFromUrl([]);
    // Clear URL params
    window.history.replaceState({}, '', '/dashboard/transactions');
  };

  const { data: transactions, isLoading } = useTransactions(filters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createMutation = useCreateTransaction();
  const deleteMutation = useDeleteTransaction();
  const updateMutation = useUpdateTransaction();

  // Selection for batch actions - use full transaction objects
  const transactionItems = useMemo(() => 
    transactions?.data || [], 
    [transactions?.data]
  );
  const selection = useSelection(transactionItems);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: TransactionForm) => {
    try {
      await createMutation.mutateAsync({
        type: data.type as TransactionType,
        amount: data.amount,
        description: data.description,
        occurredAt: data.date ? new Date(data.date).toISOString() : undefined,
        accountId: data.accountId,
        categoryId: data.categoryId || undefined,
        transferToAccountId: data.type === 'TRANSFER' ? data.destinationAccountId : undefined,
      });
      toast({
        title: 'Transacción creada',
        description: 'La transacción se ha registrado correctamente.',
      });
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la transacción.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción? Se creará una transacción de reversión.')) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Transacción eliminada',
        description: 'La transacción ha sido revertida.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la transacción.',
        variant: 'destructive',
      });
    }
  };

  // Inline editing handlers
  const startEditing = useCallback((tx: Transaction) => {
    setEditingId(tx.id);
    setEditValues({
      description: tx.description || '',
      categoryId: tx.categoryId || '',
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditValues({});
  }, []);

  const saveEditing = useCallback(async () => {
    if (!editingId) return;
    
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          description: editValues.description || undefined,
          categoryId: editValues.categoryId || undefined,
        },
      });
      toast({
        title: 'Transacción actualizada',
        description: 'Los cambios se han guardado correctamente.',
      });
      cancelEditing();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la transacción.',
        variant: 'destructive',
      });
    }
  }, [editingId, editValues, updateMutation, toast, cancelEditing]);

  // Batch action handlers - confirmation handled by BatchActionsBar
  const handleBatchDelete = useCallback(async () => {
    try {
      const deletePromises = Array.from(selection.selectedIds).map(id => 
        deleteMutation.mutateAsync(id)
      );
      await Promise.all(deletePromises);
      
      toast({
        title: 'Transacciones eliminadas',
        description: `Se han revertido ${selection.selectedIds.size} transacciones.`,
      });
      selection.clearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar algunas transacciones.',
        variant: 'destructive',
      });
    }
  }, [selection, deleteMutation, toast]);

  const handleBatchCategorize = useCallback(async () => {
    if (!batchCategoryId) return;
    
    try {
      const updatePromises = Array.from(selection.selectedIds).map(id =>
        updateMutation.mutateAsync({
          id,
          data: { categoryId: batchCategoryId },
        })
      );
      await Promise.all(updatePromises);
      
      toast({
        title: 'Categorías actualizadas',
        description: `Se han categorizado ${selection.selectedIds.size} transacciones.`,
      });
      selection.clearSelection();
      setBatchCategoryDialogOpen(false);
      setBatchCategoryId('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar algunas transacciones.',
        variant: 'destructive',
      });
    }
  }, [selection, batchCategoryId, updateMutation, toast]);

  const filteredCategories = categories?.filter(
    (cat) => (selectedType === 'INCOME' && cat.type === 'INCOME') ||
             (selectedType === 'EXPENSE' && cat.type === 'EXPENSE') ||
             selectedType === 'TRANSFER'
  );

  // Find category name from ID for display
  const activeCategoryName = filters.categoryId 
    ? categories?.find(c => c.id === filters.categoryId)?.name 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transacciones</h1>
          <p className="text-muted-foreground mt-1">
            Registra y consulta todos tus movimientos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Transacción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Transacción</DialogTitle>
              <DialogDescription>
                Registra un ingreso, gasto o transferencia
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                {/* Type selector */}
                <div className="flex gap-2">
                  {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((type) => {
                    const Icon = typeIcons[type];
                    const isSelected = selectedType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('type', type)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors',
                          isSelected
                            ? 'border-foreground/30 bg-foreground/5 text-foreground'
                            : 'border-border/60 hover:bg-secondary/50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[13px] font-medium">{typeLabels[type]}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount')}
                    error={errors.amount?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    placeholder="Descripción opcional"
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId">
                    {selectedType === 'TRANSFER' ? 'Cuenta Origen' : 'Cuenta'}
                  </Label>
                  <Select onValueChange={(value) => setValue('accountId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.accountId && (
                    <p className="text-sm text-destructive">{errors.accountId.message}</p>
                  )}
                </div>

                {selectedType === 'TRANSFER' && (
                  <div className="space-y-2">
                    <Label htmlFor="destinationAccountId">Cuenta Destino</Label>
                    <Select onValueChange={(value) => setValue('destinationAccountId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona cuenta destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedType !== 'TRANSFER' && (
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Categoría</Label>
                    <Select onValueChange={(value) => setValue('categoryId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={createMutation.isPending}>
                  Crear
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Active filters from URL */}
      {activeFiltersFromUrl.length > 0 && (
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-medium text-muted-foreground">Filtros activos:</span>
                {activeCategoryName && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background shadow-sm text-sm font-medium">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    {activeCategoryName}
                  </span>
                )}
                {filters.startDate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background shadow-sm text-sm font-medium">
                    Desde: {filters.startDate}
                  </span>
                )}
                {filters.endDate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background shadow-sm text-sm font-medium">
                    Hasta: {filters.endDate}
                  </span>
                )}
                {filters.type && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background shadow-sm text-sm font-medium">
                    {typeLabels[filters.type]}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearUrlFilters} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters - Mejorado */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-4 p-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transacciones..."
                  className="pl-9 bg-muted/30"
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Select onValueChange={(value) => {
                const newFilters = { ...filters };
                if (value === 'ALL') {
                  delete newFilters.type;
                } else {
                  newFilters.type = value as TransactionType;
                }
                setFilters(newFilters);
              }}>
                <SelectTrigger className="w-[140px] bg-muted/30">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="INCOME">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
                      Ingresos
                    </span>
                  </SelectItem>
                  <SelectItem value="EXPENSE">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                      Gastos
                    </span>
                  </SelectItem>
                  <SelectItem value="TRANSFER">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
                      Transferencias
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => {
                const newFilters = { ...filters };
                if (value === 'ALL') {
                  delete newFilters.accountId;
                } else {
                  newFilters.accountId = value;
                }
                setFilters(newFilters);
              }}>
                <SelectTrigger className="w-[160px] bg-muted/30">
                  <SelectValue placeholder="Cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las cuentas</SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  className="w-[150px] bg-muted/30"
                  placeholder="Desde"
                  onChange={(e) => {
                    const newFilters = { ...filters };
                    if (e.target.value) {
                      newFilters.startDate = e.target.value;
                    } else {
                      delete newFilters.startDate;
                    }
                    setFilters(newFilters);
                  }}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  className="w-[150px] bg-muted/30"
                  placeholder="Hasta"
                  onChange={(e) => {
                    const newFilters = { ...filters };
                    if (e.target.value) {
                      newFilters.endDate = e.target.value;
                    } else {
                      delete newFilters.endDate;
                    }
                    setFilters(newFilters);
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-[14px] font-medium">Historial</CardTitle>
                  <CardDescription className="text-[12px]">
                    {transactions?.total || 0} transacciones
                  </CardDescription>
                </div>
              </div>
              {transactions?.data && transactions.data.length > 0 && (
                <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-secondary/50">
                  <Checkbox
                    id="select-all"
                    checked={selection.isAllSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selection.selectAll();
                      } else {
                        selection.clearSelection();
                      }
                    }}
                  />
                  <Label htmlFor="select-all" className="text-[12px] cursor-pointer">
                    Seleccionar todo
                  </Label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0 divide-y divide-border/40">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="h-9 w-9 rounded-lg bg-secondary" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-1/3 bg-secondary rounded" />
                    <div className="h-3 w-1/4 bg-secondary rounded" />
                  </div>
                  <div className="h-3.5 w-16 bg-secondary rounded" />
                </div>
              ))}
            </div>
          ) : !transactions?.data?.length ? (
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-[14px] font-medium">No hay transacciones</h3>
              <p className="text-muted-foreground text-[12px] mt-1 mb-4 max-w-sm mx-auto">
                Registra tu primera transacción para empezar
              </p>
              <Button onClick={() => setIsDialogOpen(true)} size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nueva Transacción
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <AnimatePresence>
                {transactions.data.map((tx, index) => {
                  const Icon = typeIcons[tx.type];
                  const isIncome = tx.type === 'INCOME';
                  const isExpense = tx.type === 'EXPENSE';
                  const isReversed = tx.status === 'REVERSED' || tx.status === 'CANCELLED';
                  const isEditing = editingId === tx.id;
                  const isSelected = selection.selectedIds.has(tx.id);

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.015 }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 group transition-colors',
                        isReversed && 'opacity-50',
                        isSelected && 'bg-foreground/[0.03]',
                        isEditing && 'bg-foreground/[0.03]',
                        !isReversed && !isSelected && !isEditing && 'hover:bg-foreground/[0.02]'
                      )}
                    >
                    {/* Checkbox */}
                    {!isReversed && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => selection.toggleSelection(tx.id)}
                        className="opacity-50 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                    
                    {/* Icon */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    {/* Content - Normal or Editing mode */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editValues.description || ''}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            placeholder="Descripción"
                            className="h-8"
                          />
                          {tx.type !== 'TRANSFER' && (
                            <Select 
                              value={editValues.categoryId || ''} 
                              onValueChange={(value) => setEditValues({ ...editValues, categoryId: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.filter(c => c.type === tx.type).map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="text-[13px] font-medium truncate">
                            {tx.description || tx.category?.name || typeLabels[tx.type]}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {tx.account?.name}
                            {tx.type === 'TRANSFER' && tx.transferToAccount && (
                              <> → {tx.transferToAccount.name}</>
                            )}
                            {' • '}
                            {formatDate(tx.occurredAt)}
                            {tx.category && tx.type !== 'TRANSFER' && (
                              <> • {tx.category.name}</>
                            )}
                            {isReversed && ' • Revertida'}
                          </p>
                        </>
                      )}
                    </div>
                    
                    {/* Amount */}
                    <div className={cn(
                      'text-[13px] font-semibold shrink-0 tabular-nums',
                      isIncome ? 'text-green-600 dark:text-green-500' : ''
                    )}>
                      <ConvertedAmount 
                        amount={tx.amount} 
                        currency={tx.currency}
                        prefix={isIncome ? '+' : isExpense ? '-' : ''}
                      />
                    </div>
                    
                    {/* Actions */}
                    {!isReversed && (
                      <div className="flex items-center gap-0.5">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={saveEditing}
                              disabled={updateMutation.isPending}
                            >
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={cancelEditing}
                            >
                              <XIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                              onClick={() => startEditing(tx)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                              onClick={() => handleDelete(tx.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Batch Actions Bar */}
      <BatchActionsBar
        selectedItems={selection.selectedItems}
        onClearSelection={selection.clearSelection}
        onDelete={async () => {
          await handleBatchDelete();
        }}
        onCategorize={() => setBatchCategoryDialogOpen(true)}
      />

      {/* Batch Categorize Dialog */}
      <Dialog open={batchCategoryDialogOpen} onOpenChange={setBatchCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorizar transacciones</DialogTitle>
            <DialogDescription>
              Selecciona una categoría para las {selection.selectedIds.size} transacciones seleccionadas
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={batchCategoryId} onValueChange={setBatchCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type === 'INCOME' ? 'Ingreso' : 'Gasto'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBatchCategorize} disabled={!batchCategoryId}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Aplicar categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
