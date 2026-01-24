'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pause, Play, Trash2, Edit, Calendar, RefreshCw, Repeat } from 'lucide-react';
import { useRecurringTransactions, useDeleteRecurringTransaction, usePauseRecurringTransaction, useResumeRecurringTransaction } from '@/hooks/use-recurring-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RecurringTransactionForm } from './recurring-form';
import { cn, getInitials } from '@/lib/utils';
import { ConvertedAmount } from '@/components/converted-amount';
import type { RecurringTransaction, RecurrenceFrequency } from '@/types/api';
import { COLOR_PALETTE } from '@/lib/color-palettes';

const frequencyLabels: Record<RecurrenceFrequency, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
};

const dayOfWeekLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function RecurringTransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: recurringList, isLoading } = useRecurringTransactions();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const deleteMutation = useDeleteRecurringTransaction();
  const pauseMutation = usePauseRecurringTransaction();
  const resumeMutation = useResumeRecurringTransaction();

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleToggleActive = (item: RecurringTransaction) => {
    if (item.isActive) {
      pauseMutation.mutate(item.id);
    } else {
      resumeMutation.mutate(item.id);
    }
  };

  const getFrequencyDescription = (item: RecurringTransaction) => {
    let desc = frequencyLabels[item.frequency];
    if (item.dayOfWeek !== null && item.dayOfWeek !== undefined && ['WEEKLY', 'BIWEEKLY'].includes(item.frequency)) {
      desc += ` (${dayOfWeekLabels[item.dayOfWeek]})`;
    }
    if (item.dayOfMonth && ['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(item.frequency)) {
      desc += ` (día ${item.dayOfMonth})`;
    }
    return desc;
  };

  const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
          <p className="text-[13px] text-muted-foreground">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  const activeCount = recurringList?.filter(r => r.isActive).length || 0;
  const pausedCount = recurringList?.filter(r => !r.isActive).length || 0;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas - Estilo Apple */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5">
              <Repeat className="h-5 w-5 text-foreground/70" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transacciones Recurrentes</h1>
            <p className="text-[13px] text-muted-foreground">
              Gestiona tus pagos automáticos
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-2">
          <div className="flex items-center gap-2.5 rounded-lg bg-background/80 border border-foreground/10 px-3 py-2 shadow-soft">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 bg-foreground/5">
              <Play className="h-3.5 w-3.5 text-foreground/70 ml-0.5" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{activeCount}</p>
              <p className="text-[11px] text-muted-foreground">Activas</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-background/80 border border-foreground/10 px-3 py-2 shadow-soft">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 bg-foreground/5">
              <Pause className="h-3.5 w-3.5 text-foreground/70" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{pausedCount}</p>
              <p className="text-[11px] text-muted-foreground">Pausadas</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Button size="sm" onClick={() => setShowForm(true)} className="h-9 text-[13px]">
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva Recurrente
        </Button>
      </motion.div>
      {(!recurringList || recurringList.length === 0) ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mx-auto w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-[15px] font-medium mb-1">Sin transacciones recurrentes</h3>
              <p className="text-[13px] text-muted-foreground text-center mb-5 max-w-sm">
                Automatiza pagos como suscripciones o ingresos fijos
              </p>
              <Button size="sm" onClick={() => setShowForm(true)} className="h-9 text-[13px]">
                <Plus className="mr-1.5 h-4 w-4" />
                Crear Primera
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="bg-background/80 border-foreground/10 shadow-soft">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              <AnimatePresence mode="popLayout">
                {recurringList.map((item, index) => {
                  const accentColor = item.category?.color || COLOR_PALETTE[index % COLOR_PALETTE.length];
                  const initialsSource = item.category?.name || item.description;
                  return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'group flex items-center justify-between p-4 hover:bg-foreground/[0.02] transition-colors',
                      !item.isActive && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className="absolute -inset-1 rounded-2xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
                          style={{ backgroundColor: accentColor }}
                        />
                        <div
                          className="relative flex h-9 w-9 items-center justify-center rounded-xl border bg-background/90"
                          style={{
                            borderColor: `${accentColor}40`,
                            boxShadow: `0 8px 18px -16px ${accentColor}88`,
                            backgroundImage: `linear-gradient(140deg, ${accentColor}12, rgba(255,255,255,0.8))`,
                          }}
                        >
                          <span className="text-[9px] font-semibold" style={{ color: accentColor }}>
                            {getInitials(initialsSource)}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium truncate">{item.description}</span>
                          {!item.isActive && (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              Pausada
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                          <span>{item.account?.name}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-secondary/60 px-2 py-0.5 text-[11px] text-foreground/70">
                            {getFrequencyDescription(item)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-background/80 px-2 py-0.5 text-[11px] text-foreground/70">
                            Próx: {new Date(item.nextOccurrence).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        'text-[14px] font-medium tabular-nums',
                        item.type === 'INCOME' ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-foreground'
                      )}>
                        <ConvertedAmount 
                          amount={item.amount} 
                          currency={item.currency}
                          prefix={item.type === 'INCOME' ? '+' : '-'}
                        />
                      </span>
                      
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(item)}
                          disabled={pauseMutation.isPending || resumeMutation.isPending}
                        >
                          {item.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingId(item.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    </motion.div>
                );
              })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form Dialog */}
      <RecurringTransactionForm
        open={showForm || !!editingId}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        editId={editingId}
        accounts={accounts || []}
        categories={categories || []}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar transacción recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las transacciones ya creadas no se verán afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
