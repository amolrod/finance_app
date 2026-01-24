'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import { COLOR_PALETTE } from '@/lib/color-palettes';
import {
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
  useRecurringTransaction,
} from '@/hooks/use-recurring-transactions';
import type { Account, Category, RecurrenceFrequency } from '@/types/api';

const formSchema = z.object({
  accountId: z.string().min(1, 'Selecciona una cuenta'),
  categoryId: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  description: z.string().min(1, 'La descripción es requerida'),
  notes: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  dayOfMonth: z.number().min(1).max(31).optional().nullable(),
  dayOfWeek: z.number().min(0).max(6).optional().nullable(),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().optional(),
  autoConfirm: z.boolean(),
  notifyBeforeDays: z.number().min(0).max(30),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editId: string | null;
  accounts: Account[];
  categories: Category[];
}

const frequencies: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'DAILY', label: 'Diario' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'YEARLY', label: 'Anual' },
];

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export function RecurringTransactionForm({ open, onClose, editId, accounts, categories }: Props) {
  const { toast } = useToast();
  const { data: existingData } = useRecurringTransaction(editId || '');
  const createMutation = useCreateRecurringTransaction();
  const updateMutation = useUpdateRecurringTransaction();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      type: 'EXPENSE',
      amount: 0,
      description: '',
      notes: '',
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      dayOfWeek: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      autoConfirm: true,
      notifyBeforeDays: 1,
    },
  });

  const watchedType = form.watch('type');
  const watchedFrequency = form.watch('frequency');
  const needsDayOfMonth = ['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(watchedFrequency);
  const needsDayOfWeek = ['WEEKLY', 'BIWEEKLY'].includes(watchedFrequency);

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    (c) => c.type === watchedType || (c.children && c.children.some((child) => child.type === watchedType))
  );

  // Populate form when editing
  useEffect(() => {
    if (existingData && editId) {
      form.reset({
        accountId: existingData.accountId,
        categoryId: existingData.categoryId || '',
        type: existingData.type as 'INCOME' | 'EXPENSE',
        amount: parseFloat(existingData.amount),
        description: existingData.description,
        notes: existingData.notes || '',
        frequency: existingData.frequency,
        dayOfMonth: existingData.dayOfMonth,
        dayOfWeek: existingData.dayOfWeek,
        startDate: existingData.startDate.split('T')[0],
        endDate: existingData.endDate?.split('T')[0] || '',
        autoConfirm: existingData.autoConfirm,
        notifyBeforeDays: existingData.notifyBeforeDays,
      });
    }
  }, [existingData, editId, form]);

  // Reset form when closing
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        dayOfMonth: needsDayOfMonth && values.dayOfMonth ? values.dayOfMonth : undefined,
        dayOfWeek: needsDayOfWeek && values.dayOfWeek !== null && values.dayOfWeek !== undefined ? values.dayOfWeek : undefined,
        categoryId: values.categoryId || undefined,
        endDate: values.endDate || undefined,
        notes: values.notes || undefined,
      };

      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
        toast({ title: 'Recurrente actualizada', description: 'La transacción recurrente ha sido actualizada' });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: 'Recurrente creada', description: 'La transacción recurrente ha sido creada' });
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la transacción recurrente',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editId ? 'Editar' : 'Nueva'} Transacción Recurrente
          </DialogTitle>
          <DialogDescription>
            Configura una transacción que se repetirá automáticamente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EXPENSE">Gasto</SelectItem>
                      <SelectItem value="INCOME">Ingreso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin categoría</SelectItem>
                      {filteredCategories.map((category, index) => {
                        const accentColor = category.color || COLOR_PALETTE[index % COLOR_PALETTE.length];
                        return (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-6 w-6 items-center justify-center rounded-full border bg-background/80"
                                style={{
                                  borderColor: `${accentColor}55`,
                                  color: accentColor,
                                }}
                              >
                                <span className="text-[9px] font-semibold">
                                  {getInitials(category.name)}
                                </span>
                              </div>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {needsDayOfMonth && (
              <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día del mes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Si el mes no tiene este día, se usará el último día del mes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {needsDayOfWeek && (
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día de la semana</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      value={field.value?.toString() ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un día" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Netflix, Alquiler..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de fin (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Dejar vacío si es indefinida</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="autoConfirm"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-confirmar</FormLabel>
                      <FormDescription>
                        Crear transacciones automáticamente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyBeforeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notificar antes (días)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="30" {...field} />
                    </FormControl>
                    <FormDescription>0 = mismo día</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editId ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
