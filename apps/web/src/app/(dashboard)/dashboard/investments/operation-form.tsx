'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/currency-context';
import {
  useCreateInvestmentOperation,
  useUpdateInvestmentOperation,
  useInvestmentOperation,
} from '@/hooks/use-investments';
import { useCreateAsset, useUpdateAsset, useAssetSearch } from '@/hooks/use-assets';
import { useAccounts } from '@/hooks/use-accounts';
import type { Asset, OperationType, AssetType, AssetSearchResult } from '@/types/api';

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
  accountId: z.string().optional(),
  platform: z.string().optional(),
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
  currency: string;
}

export function OperationForm({ open, onClose, editId, assets }: Props) {
  const { toast } = useToast();
  const { preferredCurrency, formatAmount, getCurrencySymbol } = useCurrency();
  const [showNewAsset, setShowNewAsset] = useState(false);
  const [newAsset, setNewAsset] = useState<NewAssetState>({
    symbol: '',
    name: '',
    type: 'STOCK',
    currency: preferredCurrency || 'USD',
  });
  const [assetSearchOpen, setAssetSearchOpen] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(assetSearchQuery.trim());
    }, 250);
    return () => clearTimeout(handle);
  }, [assetSearchQuery]);

  const currencyOptions = useMemo(() => {
    const base = ['EUR', 'USD', 'GBP', 'MXN'];
    if (preferredCurrency && !base.includes(preferredCurrency)) {
      return [preferredCurrency, ...base];
    }
    return base;
  }, [preferredCurrency]);
  
  const { data: accountsRaw } = useAccounts();
  const accounts = useMemo(() => {
    if (!accountsRaw) return [];
    // If it's already an array (queryFn returns response.data which is Account[])
    if (Array.isArray(accountsRaw)) return accountsRaw;
    // If it's the full paginated response { data: Account[] }
    if (typeof accountsRaw === 'object' && accountsRaw !== null && 'data' in accountsRaw) {
      const inner = (accountsRaw as any).data;
      if (Array.isArray(inner)) return inner;
    }
    return [];
  }, [accountsRaw]);

  const { data: existingData } = useInvestmentOperation(editId || '');
  const createMutation = useCreateInvestmentOperation();
  const updateMutation = useUpdateInvestmentOperation();
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const { data: marketResults = [], isFetching: isSearchingMarket } = useAssetSearch(debouncedSearch);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: '',
      type: 'BUY',
      quantity: undefined as unknown as number,
      pricePerUnit: undefined as unknown as number,
      fees: undefined as unknown as number,
      currency: preferredCurrency || 'USD',
      accountId: '',
      platform: '',
      occurredAt: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });
  const assetId = form.watch('assetId');

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
        accountId: existingData.accountId || '',
        platform: existingData.platform || '',
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

  useEffect(() => {
    if (!assetId || editId) return;
    const selected = assets.find((asset) => asset.id === assetId);
    if (!selected?.currency) return;
    const currentCurrency = form.getValues('currency');
    const isDirty = !!form.formState.dirtyFields.currency;
    if (!isDirty && currentCurrency !== selected.currency) {
      form.setValue('currency', selected.currency, { shouldDirty: false });
    }
  }, [assetId, assets, editId, form]);

  // Reset form when closing
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSelectMarketAsset = async (result: AssetSearchResult) => {
    try {
      if (result.assetId) {
        form.setValue('assetId', result.assetId);
        if (result.currency) {
          form.setValue('currency', result.currency, { shouldDirty: false });
        }
      } else {
        const created = await createAssetMutation.mutateAsync({
          symbol: result.symbol,
          name: result.name,
          type: result.type,
          currency: result.currency || preferredCurrency || 'USD',
          exchange: result.exchange,
        });
        form.setValue('assetId', created.id);
        form.setValue('currency', created.currency, { shouldDirty: false });
      }
      setAssetSearchOpen(false);
      setAssetSearchQuery('');
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo añadir el activo desde el mercado.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    const selectedAsset = assets.find((asset) => asset.id === values.assetId);
    try {
      if (selectedAsset && values.currency && values.currency !== selectedAsset.currency) {
        try {
          await updateAssetMutation.mutateAsync({
            id: selectedAsset.id,
            data: { currency: values.currency },
          });
        } catch {
          toast({
            title: 'Aviso',
            description: 'No se pudo actualizar la moneda del activo. La operación se guardará igualmente.',
          });
        }
      }

      if (editId) {
        // Update: send only changed/relevant fields; send null to clear optional fields
        const updatePayload: Record<string, unknown> = {
          assetId: values.assetId,
          type: values.type,
          quantity: values.quantity,
          pricePerUnit: values.pricePerUnit,
          fees: values.fees || 0,
          currency: values.currency,
          occurredAt: values.occurredAt,
          accountId: values.accountId || null,
        };
        if (values.platform) updatePayload.platform = values.platform;
        if (values.notes) updatePayload.notes = values.notes;

        await updateMutation.mutateAsync({ id: editId, data: updatePayload as any });
        toast({ title: 'Operación actualizada', description: 'La operación ha sido actualizada' });
      } else {
        // Create: only include optional fields if they have a value
        const createPayload: Record<string, unknown> = {
          assetId: values.assetId,
          type: values.type,
          quantity: values.quantity,
          pricePerUnit: values.pricePerUnit,
          fees: values.fees || 0,
          currency: values.currency,
          occurredAt: values.occurredAt,
        };
        if (values.accountId) createPayload.accountId = values.accountId;
        if (values.platform) createPayload.platform = values.platform;
        if (values.notes) createPayload.notes = values.notes;

        await createMutation.mutateAsync(createPayload as any);
        toast({ title: 'Operación registrada', description: 'La operación ha sido registrada' });
      }
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.message;
      const msg = Array.isArray(detail) ? detail.join(', ') : (detail || 'No se pudo guardar la operación');
      toast({
        title: 'Error',
        description: msg,
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
        currency: newAsset.currency,
      });
      form.setValue('assetId', created.id);
      setShowNewAsset(false);
      setNewAsset({ symbol: '', name: '', type: 'STOCK', currency: preferredCurrency || 'USD' });
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
      <DialogContent className="sm:max-w-[680px] md:max-w-[760px] max-h-[90vh] overflow-y-auto">
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
                              {filteredAssets.length > 0 && (
                                <CommandGroup heading="Tus activos">
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
                              )}
                              {assetSearchQuery.trim().length >= 2 && (
                                <CommandGroup heading="Mercado">
                                  {isSearchingMarket && (
                                    <div className="px-2 py-2 text-xs text-muted-foreground">
                                      Buscando en mercados...
                                    </div>
                                  )}
                                  {!isSearchingMarket && marketResults.length === 0 && (
                                    <div className="px-2 py-2 text-xs text-muted-foreground">
                                      Sin resultados en el mercado.
                                    </div>
                                  )}
                                  {marketResults.map((result) => (
                                    <CommandItem
                                      key={`${result.symbol}-${result.type}`}
                                      value={`${result.symbol}-${result.type}`}
                                      onSelect={() => handleSelectMarketAsset(result)}
                                    >
                                      <div className="flex w-full items-center gap-2">
                                        <span className="font-mono font-medium">{result.symbol}</span>
                                        <span className="text-muted-foreground truncate">
                                          {result.name}
                                        </span>
                                        <span className="ml-auto text-xs text-muted-foreground">
                                          {result.type === 'STOCK' && 'Acción'}
                                          {result.type === 'ETF' && 'ETF'}
                                          {result.type === 'CRYPTO' && 'Cripto'}
                                          {result.type === 'BOND' && 'Bono'}
                                          {result.type === 'MUTUAL_FUND' && 'Fondo'}
                                          {result.type === 'OTHER' && 'Otro'}
                                          {result.exchange ? ` · ${result.exchange}` : ''}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="ml-2 border-foreground/10 text-[10px] text-muted-foreground"
                                        >
                                          {result.assetId ? 'Ya añadido' : 'Añadir'}
                                        </Badge>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
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
                <Select
                  value={newAsset.currency}
                  onValueChange={(value) => setNewAsset({ ...newAsset, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Moneda del activo" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code} ({getCurrencySymbol(code)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Cuenta asociada */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta asociada (opcional)</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin cuenta asociada" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Sin cuenta asociada</SelectItem>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <div className="flex items-center gap-2">
                            {acc.color && (
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: acc.color }}
                              />
                            )}
                            <span>{acc.name}</span>
                            <span className="text-muted-foreground text-xs">({acc.type})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
