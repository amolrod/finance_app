'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccounts, useCreateAccount, useDeleteAccount, useAccountSummary } from '@/hooks/use-accounts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatCurrency, cn } from '@/lib/utils';
import { ConvertedAmount } from '@/components/converted-amount';
import { useCurrency } from '@/contexts/currency-context';
import { Plus, Wallet, CreditCard, Banknote, PiggyBank, TrendingUp, Trash2, Building2, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AccountType } from '@/types/api';
import Decimal from 'decimal.js';

const accountSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['BANK', 'SAVINGS', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'INVESTMENT', 'OTHER']),
  currency: z.string().min(1, 'La moneda es requerida'),
  balance: z.string().optional(),
  color: z.string().optional(),
});

type AccountForm = z.infer<typeof accountSchema>;

const accountTypeIcons: Record<AccountType, typeof Wallet> = {
  BANK: Building2,
  SAVINGS: PiggyBank,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: CreditCard,
  CASH: Banknote,
  INVESTMENT: TrendingUp,
  OTHER: Wallet,
};

const accountTypeLabels: Record<AccountType, string> = {
  BANK: 'Cuenta Bancaria',
  SAVINGS: 'Cuenta de Ahorros',
  CREDIT_CARD: 'Tarjeta de Crédito',
  DEBIT_CARD: 'Tarjeta de Débito',
  CASH: 'Efectivo',
  INVESTMENT: 'Inversiones',
  OTHER: 'Otro',
};

const defaultColors = [
  '#3b82f6', // blue
  '#6b7280', // gray
  '#71717a', // zinc
  '#737373', // neutral
  '#78716c', // stone
  '#64748b', // slate
  '#525252', // neutral-600
  '#57534e', // stone-600
  '#404040', // neutral-700
];

export default function AccountsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { preferredCurrency, formatAmount } = useCurrency();
  
  const { data: accounts, isLoading } = useAccounts();
  const { data: summary } = useAccountSummary(preferredCurrency);
  const createMutation = useCreateAccount();
  const deleteMutation = useDeleteAccount();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      currency: 'EUR',
      color: defaultColors[0],
    },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: AccountForm) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        type: data.type as AccountType,
        currency: data.currency,
        initialBalance: data.balance || '0',
        color: data.color,
      });
      toast({
        title: 'Cuenta creada',
        description: 'La cuenta se ha creado correctamente.',
      });
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la cuenta.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la cuenta "${name}"?`)) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Cuenta eliminada',
        description: 'La cuenta se ha eliminado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cuenta.',
        variant: 'destructive',
      });
    }
  };

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
          <h1 className="text-2xl font-semibold tracking-tight">Mis Cuentas</h1>
          <p className="text-[13px] text-muted-foreground">
            Gestiona tus activos financieros
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Cuenta</DialogTitle>
              <DialogDescription>
                Añade una nueva cuenta para rastrear tus finanzas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Mi cuenta principal"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Cuenta</Label>
                  <Select
                    onValueChange={(value) => setValue('type', value as AccountType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(accountTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive">{errors.type.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="balance">Balance Inicial</Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('balance')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      defaultValue="EUR"
                      onValueChange={(value) => setValue('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'h-7 w-7 rounded-full transition-all duration-150',
                          selectedColor === color && 'ring-2 ring-offset-2 ring-foreground/30 scale-110'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setValue('color', color)}
                      />
                    ))}
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

      {/* Hero Balance Card */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[linear-gradient(135deg,#0b1220,#0f172a)] p-6 text-white shadow-[0_35px_90px_-60px_rgba(14,165,233,0.55)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.32)_0%,transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(14,165,233,0.28)_0%,transparent_60%)]" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-[12px] font-medium text-neutral-400 mb-1">Balance Total</p>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    {formatAmount(
                      parseFloat(summary.totalBalanceConverted || summary.totalBalance),
                      preferredCurrency
                    ).replace(preferredCurrency, '').trim()}
                  </span>
                  <span className="text-sm font-medium text-neutral-400">{preferredCurrency}</span>
                </motion.div>
                
                {summary.byCurrency.length > 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-2 mt-3"
                  >
                    {summary.byCurrency.map((bc) => (
                      <div key={bc.currency} className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-[12px]">
                        <span className="font-medium">{bc.currency}</span>
                        <span className="text-neutral-300 tabular-nums">
                          {formatAmount(parseFloat(bc.balance), bc.currency)}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-4 text-[12px] text-neutral-400"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <span>{accounts?.length || 0} cuentas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span>{summary.byCurrency.length} monedas</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Accounts Grid */}
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
      ) : !accounts?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <Card className="border-dashed border-border/60">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium mb-1">No tienes cuentas</h3>
              <p className="text-[13px] text-muted-foreground mb-5 max-w-sm mx-auto">
                Crea tu primera cuenta para empezar a rastrear tus finanzas
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Cuenta
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
          {accounts.map((account, index) => {
            const Icon = accountTypeIcons[account.type];
            const balance = new Decimal(account.currentBalance);
            
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.02 + index * 0.02 }}
              >
                <Card className="group relative overflow-hidden card-hover h-full">
                  {/* Color accent */}
                  <div 
                    className="absolute top-0 left-0 w-0.5 h-full"
                    style={{ backgroundColor: account.color || '#3b82f6' }}
                  />
                  
                  <CardHeader className="pb-2 pl-5">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <CardTitle className="text-[14px] font-medium truncate">{account.name}</CardTitle>
                        <CardDescription className="text-[12px] mt-0.5">
                          {accountTypeLabels[account.type]}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2 h-7 w-7"
                        onClick={() => handleDelete(account.id, account.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pl-5 pt-0">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-0.5">Balance</p>
                        <div className={cn(
                          'text-lg font-semibold tracking-tight tabular-nums',
                          balance.isNegative() ? 'text-foreground' : ''
                        )}>
                          <ConvertedAmount 
                            amount={account.currentBalance} 
                            currency={account.currency}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                        {account.currency}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
