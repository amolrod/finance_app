'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudgets, useCreateBudget, useDeleteBudget } from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { cn, getInitials } from '@/lib/utils';
import { useCurrency } from '@/contexts/currency-context';
import { Plus, PiggyBank, Trash2, AlertTriangle, Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Decimal from 'decimal.js';
import { COLOR_PALETTE } from '@/lib/color-palettes';

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'La categoría es requerida'),
  periodMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato debe ser YYYY-MM'),
  limitAmount: z.string().min(1, 'El monto es requerido'),
});

type BudgetForm = z.infer<typeof budgetSchema>;

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function BudgetsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { preferredCurrency, formatAmount } = useCurrency();

  const { data: budgets, isLoading } = useBudgets();
  const { data: categories } = useCategories('EXPENSE');
  const createMutation = useCreateBudget();
  const deleteMutation = useDeleteBudget();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      periodMonth: getCurrentMonth(),
    },
  });

  const onSubmit = async (data: BudgetForm) => {
    try {
      await createMutation.mutateAsync({
        categoryId: data.categoryId,
        periodMonth: data.periodMonth,
        limitAmount: data.limitAmount,
      });
      toast({
        title: 'Presupuesto creado',
        description: 'El presupuesto se ha creado correctamente.',
      });
      setIsDialogOpen(false);
      reset({ periodMonth: getCurrentMonth() });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el presupuesto.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el presupuesto "${name}"?`)) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Presupuesto eliminado',
        description: 'El presupuesto se ha eliminado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el presupuesto.',
        variant: 'destructive',
      });
    }
  };

  // Calcular estadísticas
  const budgetStats = budgets ? {
    total: budgets.length,
    healthy: budgets.filter(b => b.percentageUsed < 80).length,
    warning: budgets.filter(b => b.percentageUsed >= 80 && b.percentageUsed < 100).length,
    exceeded: budgets.filter(b => b.percentageUsed >= 100).length,
  } : { total: 0, healthy: 0, warning: 0, exceeded: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Presupuestos</h1>
          <p className="text-[13px] text-muted-foreground">
            Establece límites y controla tus gastos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Presupuesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Presupuesto</DialogTitle>
              <DialogDescription>
                Define un límite de gasto mensual
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoría</Label>
                  <Select onValueChange={(value) => setValue('categoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="limitAmount">Monto Límite</Label>
                    <Input
                      id="limitAmount"
                      type="number"
                      step="0.01"
                      placeholder="500.00"
                      {...register('limitAmount')}
                    />
                    {errors.limitAmount && (
                      <p className="text-sm text-destructive">{errors.limitAmount.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodMonth">Mes del Período</Label>
                    <Input
                      id="periodMonth"
                      type="month"
                      {...register('periodMonth')}
                    />
                    {errors.periodMonth && (
                      <p className="text-sm text-destructive">{errors.periodMonth.message}</p>
                    )}
                  </div>
                </div>
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

      {/* Stats Cards */}
      {budgets && budgets.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-background/80 border border-foreground/10 p-3 shadow-soft">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/5">
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{budgetStats.total}</p>
              <p className="text-[11px] text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-background/80 border border-foreground/10 p-3 shadow-soft">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/5">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{budgetStats.healthy}</p>
              <p className="text-[11px] text-muted-foreground">En orden</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-background/80 border border-foreground/10 p-3 shadow-soft">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/5">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{budgetStats.warning}</p>
              <p className="text-[11px] text-muted-foreground">En alerta</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-background/80 border border-foreground/10 p-3 shadow-soft">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/5">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{budgetStats.exceeded}</p>
              <p className="text-[11px] text-muted-foreground">Excedidos</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Budgets Grid */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="h-20 bg-secondary rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !budgets?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <Card className="border-dashed border-border/60">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <PiggyBank className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-[14px] font-medium mb-1">No tienes presupuestos</h3>
              <p className="text-[12px] text-muted-foreground mb-4 max-w-sm mx-auto">
                Crea tu primer presupuesto para controlar tus gastos
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Presupuesto
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {budgets.map((budget, index) => {
              const remaining = new Decimal(budget.remainingAmount);
              const percentage = budget.percentageUsed;
              const isOverBudget = percentage >= 100;
              const isWarning = percentage >= 80 && percentage < 100;
              const accentColor = budget.categoryColor || COLOR_PALETTE[index % COLOR_PALETTE.length];
              const statusLabel = isOverBudget ? 'Excedido' : isWarning ? 'Alerta' : 'En orden';
              const statusDot = isOverBudget ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981';
              
              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.02 }}
                >
                  <Card className="group relative overflow-hidden card-hover h-full bg-background/80 border-foreground/10 shadow-soft">
                    <div
                      className="absolute inset-x-0 top-0 h-0.5 opacity-50"
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${accentColor}, transparent)`,
                      }}
                    />
                    
                    <CardHeader className="pb-2 pt-4 pl-5 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div
                              className="absolute -inset-1 rounded-2xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
                              style={{ backgroundColor: accentColor }}
                            />
                            <div
                              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border bg-background/90"
                              style={{
                                borderColor: `${accentColor}55`,
                                boxShadow: `0 8px 18px -16px ${accentColor}88`,
                                backgroundImage: `linear-gradient(140deg, ${accentColor}14, rgba(255,255,255,0.75))`,
                              }}
                            >
                              <span className="text-[10px] font-semibold" style={{ color: accentColor }}>
                                {getInitials(budget.categoryName)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-[14px] font-medium flex items-center gap-2">
                              {budget.categoryName}
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                              {new Date(budget.periodMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-foreground/70">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusDot }} />
                            {statusLabel}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                            onClick={() => handleDelete(budget.id, budget.categoryName)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pl-5 relative">
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-semibold tracking-tight tabular-nums">
                            {formatAmount(parseFloat(budget.spentAmount))}
                          </span>
                          <span className="text-[12px] text-muted-foreground tabular-nums">
                            de {formatAmount(parseFloat(budget.limitAmount))}
                          </span>
                        </div>
                        <div className="relative pt-3">
                          <Progress
                            value={Math.min(percentage, 100)}
                            indicatorClassName={cn(
                              'transition-all',
                              isOverBudget ? 'bg-rose-500/70' : isWarning ? 'bg-amber-500/70' : 'bg-emerald-500/70'
                            )}
                          />
                          <span className="absolute right-0 -top-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary tabular-nums">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-border/40">
                        {remaining.isNegative() ? (
                          <span className="text-[12px] font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {formatAmount(remaining.abs().toNumber())} excedido
                          </span>
                        ) : (
                        <span className="text-[12px] font-medium text-emerald-600/80 dark:text-emerald-400/80 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {formatAmount(parseFloat(budget.remainingAmount))} disponible
                        </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
