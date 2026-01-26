'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAssets, useCreateAsset } from '@/hooks/use-assets';
import { useCreateInvestmentOperationsBatch } from '@/hooks/use-investments';
import { useCurrency } from '@/contexts/currency-context';
import type { AssetType, OperationType } from '@/types/api';
import { cn } from '@/lib/utils';

type ImportStep = 'upload' | 'mapping' | 'result';

type MappingKey =
  | 'date'
  | 'symbol'
  | 'name'
  | 'operationType'
  | 'assetType'
  | 'quantity'
  | 'price'
  | 'total'
  | 'fees'
  | 'currency';

const mappingFields: { key: MappingKey; label: string; required?: boolean }[] = [
  { key: 'date', label: 'Fecha', required: true },
  { key: 'symbol', label: 'Símbolo / Ticker', required: true },
  { key: 'name', label: 'Nombre del activo' },
  { key: 'operationType', label: 'Tipo operación' },
  { key: 'assetType', label: 'Tipo activo' },
  { key: 'quantity', label: 'Cantidad', required: true },
  { key: 'price', label: 'Precio unitario' },
  { key: 'total', label: 'Total' },
  { key: 'fees', label: 'Comisión' },
  { key: 'currency', label: 'Divisa' },
];

const brokerTemplates: Record<string, Record<MappingKey, string[]>> = {
  generic: {
    date: ['fecha', 'date', 'trade date'],
    symbol: ['ticker', 'symbol', 'símbolo'],
    name: ['nombre', 'name', 'activo'],
    operationType: ['tipo', 'type', 'operation'],
    assetType: ['clase', 'asset type', 'tipo activo'],
    quantity: ['cantidad', 'quantity', 'shares', 'units'],
    price: ['precio', 'price', 'precio unitario'],
    total: ['importe', 'total', 'amount'],
    fees: ['comisión', 'fee', 'commission'],
    currency: ['divisa', 'currency', 'moneda'],
  },
  myinvestor: {
    date: ['fecha', 'fecha operación'],
    symbol: ['ticker', 'símbolo', 'isin'],
    name: ['descripción', 'activo'],
    operationType: ['tipo operación', 'operación'],
    assetType: ['producto', 'tipo producto'],
    quantity: ['cantidad', 'participaciones'],
    price: ['precio', 'precio unitario'],
    total: ['importe', 'total'],
    fees: ['comisión', 'gastos'],
    currency: ['divisa', 'moneda'],
  },
  degiro: {
    date: ['fecha', 'fecha operación'],
    symbol: ['ticker', 'producto', 'isin'],
    name: ['descripción', 'producto'],
    operationType: ['tipo', 'tipo de operación'],
    assetType: ['tipo producto', 'tipo'],
    quantity: ['cantidad', 'número'],
    price: ['precio', 'precio/ud'],
    total: ['total', 'importe'],
    fees: ['comisión', 'coste'],
    currency: ['divisa', 'moneda'],
  },
};

const normalizeHeader = (value: string) => value.trim().toLowerCase();

const parseNumber = (value: string | number | undefined) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return value;
  const cleaned = value
    .replace(/[^\d,.\-]/g, '')
    .replace(/\s+/g, '')
    .trim();
  if (!cleaned) return null;
  const normalized =
    cleaned.includes(',') && cleaned.includes('.')
      ? cleaned.replace(/,/g, '')
      : cleaned.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseDate = (value: string) => {
  if (!value) return null;
  const trimmed = value.trim();
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const match = trimmed.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const parsed = new Date(year, month, day);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
};

const normalizeOperationType = (raw?: string, fallback: OperationType = 'BUY'): OperationType => {
  if (!raw) return fallback;
  const value = raw.trim().toLowerCase();
  if (['buy', 'compra', 'purchase'].some((label) => value.includes(label))) return 'BUY';
  if (['sell', 'venta'].some((label) => value.includes(label))) return 'SELL';
  if (['div', 'dividendo'].some((label) => value.includes(label))) return 'DIVIDEND';
  if (['fee', 'comisión', 'commission', 'gasto'].some((label) => value.includes(label))) return 'FEE';
  if (['split', 'desdoblamiento'].some((label) => value.includes(label))) return 'SPLIT';
  return fallback;
};

const normalizeAssetType = (raw?: string, fallback: AssetType = 'STOCK'): AssetType => {
  if (!raw) return fallback;
  const value = raw.trim().toLowerCase();
  if (value.includes('etf')) return 'ETF';
  if (value.includes('fondo') || value.includes('fund')) return 'MUTUAL_FUND';
  if (value.includes('crypto') || value.includes('cripto')) return 'CRYPTO';
  if (value.includes('bono') || value.includes('bond')) return 'BOND';
  return fallback;
};

export default function InvestmentImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<MappingKey, string>>({
    date: '',
    symbol: '',
    name: '',
    operationType: '',
    assetType: '',
    quantity: '',
    price: '',
    total: '',
    fees: '',
    currency: '',
  });
  const [templateKey, setTemplateKey] = useState<string>('generic');
  const [defaultOperationType, setDefaultOperationType] = useState<OperationType>('BUY');
  const [defaultAssetType, setDefaultAssetType] = useState<AssetType>('STOCK');
  const [defaultCurrency, setDefaultCurrency] = useState<string>('');
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { preferredCurrency } = useCurrency();
  const { data: assets = [] } = useAssets();
  const createAssetMutation = useCreateAsset();
  const batchCreateMutation = useCreateInvestmentOperationsBatch();
  const { toast } = useToast();

  useEffect(() => {
    if (!defaultCurrency) {
      setDefaultCurrency(preferredCurrency);
    }
  }, [defaultCurrency, preferredCurrency]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (value) => value.trim(),
      });
      if (parsed.errors.length) {
        toast({
          title: 'Error al leer CSV',
          description: parsed.errors[0]?.message || 'No se pudo leer el archivo.',
          variant: 'destructive',
        });
        return;
      }
      const parsedHeaders = parsed.meta.fields || [];
      setHeaders(parsedHeaders);
      setRows(parsed.data);
      setStep('mapping');
    };
    reader.readAsText(file);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
    multiple: false,
  });

  const headerOptions = useMemo(() => headers.map((header) => ({ label: header, value: header })), [headers]);

  const applyTemplate = useCallback((key: string) => {
    const template = brokerTemplates[key];
    if (!template) return;
    const normalizedHeaders = headers.map((header) => normalizeHeader(header));
    const headerMap = new Map(normalizedHeaders.map((header, index) => [header, headers[index]]));
    const nextMapping: Record<MappingKey, string> = {
      date: '',
      symbol: '',
      name: '',
      operationType: '',
      assetType: '',
      quantity: '',
      price: '',
      total: '',
      fees: '',
      currency: '',
    };

    Object.entries(template).forEach(([fieldKey, candidates]) => {
      const match = candidates.find((candidate) => headerMap.has(normalizeHeader(candidate)));
      if (match) {
        nextMapping[fieldKey as MappingKey] = headerMap.get(normalizeHeader(match)) || '';
      }
    });

    setMapping(nextMapping);
  }, [headers]);

  useEffect(() => {
    if (headers.length) {
      applyTemplate(templateKey);
    }
  }, [headers, templateKey, applyTemplate]);

  const previewRows = useMemo(() => rows.slice(0, 8), [rows]);

  const mappingComplete = mapping.date && mapping.symbol && mapping.quantity;

  const derivedPreview = useMemo(() => {
    return previewRows.map((row) => {
      const date = mapping.date ? row[mapping.date] : '';
      const symbol = mapping.symbol ? row[mapping.symbol] : '';
      const quantity = mapping.quantity ? row[mapping.quantity] : '';
      const price = mapping.price ? row[mapping.price] : '';
      const total = mapping.total ? row[mapping.total] : '';
      const currency = mapping.currency ? row[mapping.currency] : defaultCurrency || preferredCurrency;
      return { date, symbol, quantity, price, total, currency };
    });
  }, [previewRows, mapping, defaultCurrency, preferredCurrency]);

  const handleImport = async () => {
    if (!mappingComplete) {
      toast({
        title: 'Faltan columnas requeridas',
        description: 'Selecciona fecha, símbolo y cantidad para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      const assetMap = new Map(assets.map((asset) => [`${asset.symbol}-${asset.type}`, asset]));
      const operations = [];
      let skipped = 0;

      for (const row of rows) {
        const dateRaw = row[mapping.date] || '';
        const symbolRaw = row[mapping.symbol] || '';
        const quantityRaw = row[mapping.quantity] || '';
        if (!symbolRaw || !quantityRaw || !dateRaw) {
          skipped += 1;
          continue;
        }

        const occurredAt = parseDate(String(dateRaw));
        if (!occurredAt) {
          skipped += 1;
          continue;
        }

        let quantity = parseNumber(String(quantityRaw)) ?? 0;
        const price = parseNumber(mapping.price ? row[mapping.price] : undefined);
        const total = parseNumber(mapping.total ? row[mapping.total] : undefined);
        const fees = parseNumber(mapping.fees ? row[mapping.fees] : undefined) ?? 0;

        let operationType = normalizeOperationType(
          mapping.operationType ? row[mapping.operationType] : undefined,
          defaultOperationType,
        );
        const assetType = normalizeAssetType(
          mapping.assetType ? row[mapping.assetType] : undefined,
          defaultAssetType,
        );

        const currency = String(mapping.currency ? row[mapping.currency] : defaultCurrency || preferredCurrency || '')
          .toUpperCase()
          .trim();

        const symbol = String(symbolRaw).trim().toUpperCase();
        if (!symbol) {
          skipped += 1;
          continue;
        }

        const name = mapping.name ? String(row[mapping.name] || symbol).trim() : symbol;
        const assetKey = `${symbol}-${assetType}`;
        let asset = assetMap.get(assetKey);
        if (!asset) {
          asset = await createAssetMutation.mutateAsync({
            symbol,
            name,
            type: assetType,
            currency: currency || preferredCurrency,
          });
          assetMap.set(assetKey, asset);
        }

        if (!mapping.operationType) {
          if (quantity < 0 || (total ?? 0) < 0) {
            operationType = 'SELL';
            quantity = Math.abs(quantity);
          }
        }

        let pricePerUnit = price ?? null;
        if (pricePerUnit === null && total !== null && quantity) {
          pricePerUnit = Math.abs(total) / Math.abs(quantity);
        }

        if (operationType === 'DIVIDEND') {
          pricePerUnit = total ?? pricePerUnit ?? 0;
        }

        if (pricePerUnit === null) {
          skipped += 1;
          continue;
        }

        operations.push({
          assetId: asset.id,
          type: operationType,
          quantity: operationType === 'DIVIDEND' ? 0 : quantity,
          pricePerUnit: pricePerUnit,
          fees: fees,
          currency: currency || preferredCurrency,
          occurredAt,
          notes: `Importado desde ${fileName}`,
        });
      }

      const chunkSize = 200;
      let imported = 0;
      for (let i = 0; i < operations.length; i += chunkSize) {
        const chunk = operations.slice(i, i + chunkSize);
        const result = await batchCreateMutation.mutateAsync(chunk);
        imported += result.created;
      }

      setImportResult({ imported, skipped });
      setStep('result');
      toast({
        title: 'Importación completada',
        description: `Se importaron ${imported} operaciones.`,
      });
    } catch (error) {
      toast({
        title: 'Error al importar',
        description: 'No se pudo completar la importación.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
          <Link href="/dashboard/investments">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Card className="bg-background/80 border-foreground/10 shadow-soft">
          <CardHeader>
            <CardTitle>Importar operaciones de inversión</CardTitle>
            <CardDescription>
              Sube un CSV de tu broker, ajusta las columnas y crea las operaciones en lote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'upload' && (
              <div
                {...getRootProps()}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-foreground/10 px-6 py-12 text-center transition',
                  isDragActive && 'border-primary/40 bg-primary/5'
                )}
              >
                <input {...getInputProps()} />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Arrastra tu CSV aquí</p>
                  <p className="text-xs text-muted-foreground">o haz click para seleccionar</p>
                </div>
                <Badge variant="secondary">CSV · TXT</Badge>
              </div>
            )}

            {step === 'mapping' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="text-sm font-medium">{fileName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={templateKey}
                      onValueChange={(value) => {
                        setTemplateKey(value);
                        applyTemplate(value);
                      }}
                    >
                      <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue placeholder="Plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">Plantilla genérica</SelectItem>
                        <SelectItem value="myinvestor">MyInvestor</SelectItem>
                        <SelectItem value="degiro">DeGiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => setStep('upload')}>
                      Cambiar archivo
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="bg-background/60 border-foreground/10">
                    <CardHeader>
                      <CardTitle className="text-sm">Mapeo de columnas</CardTitle>
                      <CardDescription className="text-xs">
                        Ajusta cómo leer cada campo del CSV.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mappingFields.map((field) => (
                        <div key={field.key} className="grid gap-2">
                          <Label className="text-xs font-medium">
                            {field.label}
                            {field.required && <span className="ml-1 text-rose-500">*</span>}
                          </Label>
                          <Select
                            value={mapping[field.key]}
                            onValueChange={(value) =>
                              setMapping((prev) => ({ ...prev, [field.key]: value }))
                            }
                          >
                            <SelectTrigger className="h-8 text-[12px]">
                              <SelectValue placeholder="Sin asignar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Sin asignar</SelectItem>
                              {headerOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-background/60 border-foreground/10">
                    <CardHeader>
                      <CardTitle className="text-sm">Valores por defecto</CardTitle>
                      <CardDescription className="text-xs">
                        Se usarán si no existe columna correspondiente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tipo de operación</Label>
                        <Select value={defaultOperationType} onValueChange={(value) => setDefaultOperationType(value as OperationType)}>
                          <SelectTrigger className="h-8 text-[12px]">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BUY">Compra</SelectItem>
                            <SelectItem value="SELL">Venta</SelectItem>
                            <SelectItem value="DIVIDEND">Dividendo</SelectItem>
                            <SelectItem value="FEE">Comisión</SelectItem>
                            <SelectItem value="SPLIT">Split</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de activo</Label>
                        <Select value={defaultAssetType} onValueChange={(value) => setDefaultAssetType(value as AssetType)}>
                          <SelectTrigger className="h-8 text-[12px]">
                            <SelectValue placeholder="Activo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STOCK">Acción</SelectItem>
                            <SelectItem value="ETF">ETF</SelectItem>
                            <SelectItem value="MUTUAL_FUND">Fondo</SelectItem>
                            <SelectItem value="CRYPTO">Cripto</SelectItem>
                            <SelectItem value="BOND">Bono</SelectItem>
                            <SelectItem value="OTHER">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Divisa</Label>
                        <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                          <SelectTrigger className="h-8 text-[12px]">
                            <SelectValue placeholder="Divisa" />
                          </SelectTrigger>
                          <SelectContent>
                            {['EUR', 'USD', 'GBP', 'MXN'].map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-background/60 border-foreground/10">
                  <CardHeader>
                    <CardTitle className="text-sm">Vista previa</CardTitle>
                    <CardDescription className="text-xs">
                      Primeras filas del CSV con las columnas seleccionadas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Símbolo</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Divisa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {derivedPreview.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.date || '-'}</TableCell>
                            <TableCell>{row.symbol || '-'}</TableCell>
                            <TableCell>{row.quantity || '-'}</TableCell>
                            <TableCell>{row.price || '-'}</TableCell>
                            <TableCell>{row.total || '-'}</TableCell>
                            <TableCell>{row.currency || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleImport} disabled={!mappingComplete || isImporting} isLoading={isImporting}>
                    Importar operaciones
                  </Button>
                </div>
              </div>
            )}

            {step === 'result' && (
              <div className="space-y-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <p className="text-sm font-medium">Importación finalizada</p>
                  <p className="text-xs text-muted-foreground">
                    {importResult?.imported || 0} operaciones importadas · {importResult?.skipped || 0} omitidas
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/dashboard/investments">Volver a inversiones</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
