'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/currency-context';
import {
  useCreateInvestmentOperation,
  useUpdateInvestmentOperation,
  useInvestmentOperation,
} from '@/hooks/use-investments';
import { useCreateAsset } from '@/hooks/use-assets';
import type { Asset, OperationType, AssetType } from '@/types/api';

const parseLocaleNumber = (value: unknown) => {
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

const formSchema = z.object({
  assetId: z.string().min(1, 'Selecciona un activo'),
  type: z.enum(['BUY', 'SELL', 'DIVIDEND', 'FEE', 'SPLIT']),
  quantity: z.preprocess(parseLocaleNumber, z.number().positive('La cantidad debe ser positiva')),
  pricePerUnit: z.preprocess(parseLocaleNumber, z.number().min(0, 'El precio debe ser positivo o cero')),
  fees: z.preprocess(parseLocaleNumber, z.number().min(0)).optional(),
  currency: z.string().min(1, 'Selecciona una moneda'),
  occurredAt: z.string().min(1, 'Selecciona una fecha'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const operationTypes: { value: OperationType; label: string }[] = [
  { value: 'BUY', label: 'Compra' },
  { value: 'SELL', label: 'Venta' },
  { value: 'DIVIDEND', label: 'Dividendo' },
  { value: 'FEE', label: 'Comisión' },
  { value: 'SPLIT', label: 'Split' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  editId: string | null;
  assets: Asset[];
}

// New asset dialog state
interface NewAssetState {
  symbol: string;
  name: string;
  type: AssetType;
}

export function OperationForm({ open, onClose, editId, assets }: Props) {
  const { toast } = useToast();
  const { preferredCurrency, formatAmount, getCurrencySymbol } = useCurrency();
  const [showNewAsset, setShowNewAsset] = useState(false);
  const [newAsset, setNewAsset] = useState<NewAssetState>({ symbol: '', name: '', type: 'STOCK' });
  const [assetSearchOpen, setAssetSearchOpen] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // Filtrar activos por búsqueda
  const filteredAssets = useMemo(() => {
    if (!assetSearchQuery) return assets;
    const query = assetSearchQuery.toLowerCase();
    return assets.filter(
      (a) =>
        a.symbol.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query)
    );
  }, [assets, assetSearchQuery]);

  const currencyOptions = useMemo(() => {
    const base = ['EUR', 'USD', 'GBP', 'MXN'];
    if (preferredCurrency && !base.includes(preferredCurrency)) {
      return [preferredCurrency, ...base];
    }
    return base;
  }, [preferredCurrency]);
  
  const { data: existingData } = useInvestmentOperation(editId || '');
  const createMutation = useCreateInvestmentOperation();
  const updateMutation = useUpdateInvestmentOperation();
  const createAssetMutation = useCreateAsset();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: '',
      type: 'BUY',
      quantity: undefined as unknown as number,
      pricePerUnit: undefined as unknown as number,
      fees: undefined as unknown as number,
      currency: preferredCurrency || 'USD',
      occurredAt: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingData && editId) {
      form.reset({
        assetId: existingData.assetId,
        type: existingData.type,
        quantity: parseFloat(existingData.quantity),
        pricePerUnit: parseFloat(existingData.pricePerUnit),
        fees: parseFloat(existingData.fees),
        currency: existingData.currency,
        occurredAt: existingData.occurredAt.split('T')[0],
        notes: existingData.notes || '',
      });
    }
  }, [existingData, editId, form]);

  useEffect(() => {
    if (!open || editId) return;
    const current = form.getValues('currency');
    if (!current || current === 'USD') {
      form.setValue('currency', preferredCurrency || 'USD');
    }
  }, [preferredCurrency, open, editId, form]);

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
        fees: values.fees || 0,
        notes: values.notes || undefined,
      };

      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
        toast({ title: 'Operación actualizada', description: 'La operación ha sido actualizada' });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: 'Operación registrada', description: 'La operación ha sido registrada' });
      }
      onClose();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la operación',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAsset = async () => {
    if (!newAsset.symbol || !newAsset.name) {
      toast({
        title: 'Error',
        description: 'Completa el símbolo y nombre del activo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const created = await createAssetMutation.mutateAsync({
        symbol: newAsset.symbol.toUpperCase(),
        name: newAsset.name,
        type: newAsset.type,
      });
      form.setValue('assetId', created.id);
      setShowNewAsset(false);
      setNewAsset({ symbol: '', name: '', type: 'STOCK' });
      toast({ title: 'Activo creado', description: `${created.symbol} ha sido añadido` });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo crear el activo',
        variant: 'destructive',
      });
    }
  };

  const toNumber = (value: unknown) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Calculate total
  const quantity = toNumber(form.watch('quantity'));
  const price = toNumber(form.watch('pricePerUnit'));
  const fees = toNumber(form.watch('fees'));
  const type = form.watch('type');
  const currency = form.watch('currency') || preferredCurrency || 'USD';
  let total = quantity * price;
  if (type === 'BUY') total += fees;
  else if (type === 'SELL') total -= fees;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editId ? 'Editar Operación' : 'Nueva Operación'}
          </DialogTitle>
          <DialogDescription>
            {editId ? 'Modifica los datos de la operación' : 'Registra una nueva operación de inversión'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Asset Selection with Search */}
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => {
                const selectedAsset = assets.find((a) => a.id === field.value);
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Activo</FormLabel>
                    <div className="flex gap-2">
                      <Popover open={assetSearchOpen} onOpenChange={setAssetSearchOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={assetSearchOpen}
                              className={cn(
                                'flex-1 justify-between font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {selectedAsset
                                ? `${selectedAsset.symbol} - ${selectedAsset.name}`
                                : 'Buscar activo...'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Buscar por símbolo o nombre..."
                              value={assetSearchQuery}
                              onValueChange={setAssetSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>
                                No se encontraron activos.
                                <Button
                                  variant="link"
                                  className="mt-2 w-full"
                                  onClick={() => {
                                    setAssetSearchOpen(false);
                                    setShowNewAsset(true);
                                  }}
                                >
                                  + Crear nuevo activo
                                </Button>
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredAssets.slice(0, 50).map((asset) => (
                                  <CommandItem
                                    key={asset.id}
                                    value={asset.id}
                                    onSelect={() => {
                                      field.onChange(asset.id);
                                      setAssetSearchOpen(false);
                                      setAssetSearchQuery('');
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        field.value === asset.id ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    <span className="font-mono font-medium mr-2">{asset.symbol}</span>
                                    <span className="text-muted-foreground truncate">{asset.name}</span>
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {asset.type === 'STOCK' && 'Acción'}
                                      {asset.type === 'ETF' && 'ETF'}
                                      {asset.type === 'CRYPTO' && 'Cripto'}
                                      {asset.type === 'BOND' && 'Bono'}
                                      {asset.type === 'MUTUAL_FUND' && 'Fondo'}
                                      {asset.type === 'OTHER' && 'Otro'}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button type="button" variant="outline" onClick={() => setShowNewAsset(!showNewAsset)}>
                        +
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* New Asset Form */}
            {showNewAsset && (
              <div className="p-3 border rounded-md space-y-3 bg-muted/30">
                <p className="text-sm font-medium">Nuevo Activo</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Símbolo (ej: AAPL)"
                    value={newAsset.symbol}
                    onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })}
                  />
                  <Select
                    value={newAsset.type}
                    onValueChange={(v) => setNewAsset({ ...newAsset, type: v as AssetType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK">Acción</SelectItem>
                      <SelectItem value="ETF">ETF</SelectItem>
                      <SelectItem value="CRYPTO">Cripto</SelectItem>
                      <SelectItem value="BOND">Bono</SelectItem>
                      <SelectItem value="MUTUAL_FUND">Fondo</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Nombre completo (ej: Apple Inc.)"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                />
                <Button type="button" size="sm" onClick={handleCreateAsset} className="w-full">
                  Crear Activo
                </Button>
              </div>
            )}

            {/* Operation Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Operación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {operationTypes.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="10"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio por Unidad</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="150.00"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fees & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comisiones</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="5.99"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencyOptions.map((code) => (
                          <SelectItem key={code} value={code}>
                            {code} ({getCurrencySymbol(code)})
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
                name="occurredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Display */}
            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de la operación:</span>
                <span className="font-mono font-medium">
                  {formatAmount(total, currency)}
                </span>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre esta operación..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editId ? 'Guardar Cambios' : 'Registrar Operación'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
