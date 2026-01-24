'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { usePreviewImport, useConfirmImport } from '@/hooks/use-import';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  AlertCircle,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  Building2,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, cn, getInitials } from '@/lib/utils';
import type { ImportPreview, ImportTransaction } from '@/types/api';
import { COLOR_PALETTE } from '@/lib/color-palettes';

type ImportStep = 'upload' | 'preview' | 'result';

interface TransactionSelection {
  [hash: string]: {
    selected: boolean;
    categoryId?: string;
    description?: string;
  };
}

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selections, setSelections] = useState<TransactionSelection>({});
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    duplicates: number;
  } | null>(null);

  const { toast } = useToast();
  const { data: accountsData } = useAccounts();
  const { data: categoriesData } = useCategories();
  const previewMutation = usePreviewImport();
  const confirmMutation = useConfirmImport();

  const accounts = accountsData || [];
  const categories = categoriesData || [];

  // File upload handler
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!selectedAccountId) {
        toast({
          title: 'Cuenta requerida',
          description: 'Por favor selecciona una cuenta antes de subir el archivo',
          variant: 'destructive',
        });
        return;
      }

      try {
        const result = await previewMutation.mutateAsync({
          file,
          accountId: selectedAccountId,
        });

        setPreview(result);

        // Initialize selections
        const initialSelections: TransactionSelection = {};
        result.transactions.forEach((tx) => {
          initialSelections[tx.hash] = {
            selected: !tx.isDuplicate,
            categoryId: tx.suggestedCategory?.categoryId,
            description: tx.description,
          };
        });
        setSelections(initialSelections);

        setStep('preview');
      } catch (error) {
        toast({
          title: 'Error al procesar archivo',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        });
      }
    },
    [selectedAccountId, previewMutation, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024, // 15MB for PDFs
    disabled: !selectedAccountId || previewMutation.isPending,
  });

  // Handle transaction selection toggle
  const toggleTransaction = (hash: string) => {
    setSelections((prev) => ({
      ...prev,
      [hash]: {
        ...prev[hash],
        selected: !prev[hash]?.selected,
      },
    }));
  };

  // Handle select all / deselect all
  const toggleSelectAll = (selected: boolean) => {
    if (!preview) return;
    const newSelections: TransactionSelection = {};
    preview.transactions.forEach((tx) => {
      newSelections[tx.hash] = {
        ...selections[tx.hash],
        selected: selected && !tx.isDuplicate,
      };
    });
    setSelections(newSelections);
  };

  // Handle category change
  const setCategoryForTransaction = (hash: string, categoryId: string | undefined) => {
    setSelections((prev) => ({
      ...prev,
      [hash]: {
        ...prev[hash],
        categoryId,
      },
    }));
  };

  // Calculate selected counts
  const selectedCount = useMemo(() => {
    return Object.values(selections).filter((s) => s.selected).length;
  }, [selections]);

  const selectedIncome = useMemo(() => {
    if (!preview) return 0;
    return preview.transactions
      .filter((tx) => selections[tx.hash]?.selected && tx.type === 'INCOME')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [preview, selections]);

  const selectedExpenses = useMemo(() => {
    if (!preview) return 0;
    return preview.transactions
      .filter((tx) => selections[tx.hash]?.selected && tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [preview, selections]);

  // Confirm import
  const handleConfirmImport = async () => {
    if (!preview || !selectedAccountId) return;

    const transactions: ImportTransaction[] = preview.transactions.map((tx) => ({
      hash: tx.hash,
      categoryId: selections[tx.hash]?.categoryId,
      skip: !selections[tx.hash]?.selected,
      description: selections[tx.hash]?.description,
    }));

    try {
      const result = await confirmMutation.mutateAsync({
        accountId: selectedAccountId,
        transactions,
        preview,
      });

      setImportResult({
        imported: result.imported,
        skipped: result.skipped,
        duplicates: result.duplicates,
      });
      setStep('result');

      toast({
        title: 'Importación completada',
        description: `Se importaron ${result.imported} transacciones`,
      });
    } catch (error) {
      toast({
        title: 'Error en importación',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  // Reset to start new import
  const handleReset = () => {
    setStep('upload');
    setPreview(null);
    setSelections({});
    setImportResult(null);
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-gray-400';
  };

  const steps = [
    { id: 'upload', label: 'Subir archivo', icon: Upload },
    { id: 'preview', label: 'Revisar datos', icon: FileText },
    { id: 'result', label: 'Confirmar', icon: CheckCircle2 },
  ] as const;
  const activeStepIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-teal-500/30 blur-md" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-500/30 bg-background/80 shadow-soft">
              <Download className="h-5 w-5 text-teal-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Importar Transacciones</h1>
            <p className="text-muted-foreground text-[13px]">
              Importa transacciones desde extractos bancarios en formato CSV
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.id === step;
          const isComplete = index < activeStepIndex;
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-medium',
                  isComplete
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                    : isActive
                      ? 'border-foreground/30 bg-foreground/5 text-foreground'
                      : 'border-border/60 text-muted-foreground'
                )}
              >
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className={cn(
                'text-[12px] font-medium',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {item.label}
              </div>
              {index < steps.length - 1 && (
                <div className="hidden sm:block h-px w-8 bg-border/60" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div 
            className="grid gap-6 md:grid-cols-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.1 }}
          >
            {/* Account Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-foreground/10 bg-background/80 shadow-soft h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    Seleccionar Cuenta
                  </CardTitle>
                  <CardDescription className="text-[13px]">
                    Elige la cuenta donde se importarán las transacciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <span>{account.name}</span>
                            <Badge variant="outline" className="rounded-full">{account.currency}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>

            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-foreground/10 bg-background/80 shadow-soft h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    </div>
                    Subir Archivo
                  </CardTitle>
                  <CardDescription className="text-[13px]">
                    Arrastra un archivo de extracto bancario o haz clic para seleccionar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-gradient-to-br from-foreground/[0.03] via-transparent to-transparent',
                      isDragActive && 'border-primary bg-primary/5',
                      !selectedAccountId && 'opacity-50 cursor-not-allowed',
                      previewMutation.isPending && 'opacity-50 cursor-wait'
                    )}
                  >
                    <input {...getInputProps()} />
                    {previewMutation.isPending ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Procesando archivo...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                        {isDragActive ? (
                          <p className="text-sm text-primary font-medium">Suelta el archivo aquí...</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Arrastra tu extracto bancario aquí
                            </p>
                            <p className="text-[13px] text-muted-foreground">
                              Formatos: CSV, Excel (.xlsx, .xls), PDF (máx. 15MB)
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Supported Banks */}
            <motion.div 
              className="md:col-span-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-foreground/10 bg-background/80 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Bancos Soportados</CardTitle>
                  <CardDescription className="text-[13px]">
                    El sistema detecta automáticamente el formato del banco
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                      { name: 'Santander', formats: 'CSV, Excel, PDF' },
                      { name: 'BBVA', formats: 'CSV, Excel, PDF' },
                      { name: 'CaixaBank', formats: 'CSV, Excel, PDF' },
                  { name: 'ING', formats: 'CSV, Excel, PDF' },
                  { name: 'Sabadell', formats: 'CSV, Excel, PDF' },
                  { name: 'Bankinter', formats: 'CSV, Excel, PDF' },
                  { name: 'Unicaja', formats: 'CSV, Excel, PDF' },
                  { name: 'Openbank', formats: 'CSV, Excel' },
                  { name: 'Revolut', formats: 'CSV' },
                  { name: 'N26', formats: 'CSV' },
                  { name: 'Wise', formats: 'CSV' },
                  { name: 'Genérico', formats: 'CSV, Excel, PDF' },
                ].map((bank, index) => (
                  <motion.div
                    key={bank.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.02 }}
                    className="flex flex-col gap-1 p-3 rounded-xl bg-background/70 border border-foreground/10 shadow-soft"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">{bank.name}</span>
                    </div>
                    <span className="text-[13px] text-muted-foreground ml-6">{bank.formats}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-foreground/10 bg-background/80 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-medium text-muted-foreground">
                  Formato Detectado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-lg font-semibold">{preview.detectedFormat}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-foreground/10 bg-background/80 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-medium text-muted-foreground">
                  Total Transacciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold tabular-nums">{preview.totalTransactions}</div>
                <p className="text-[13px] text-muted-foreground">
                  {preview.duplicatesFound} duplicados detectados
                </p>
              </CardContent>
            </Card>

            <Card className="border-foreground/10 bg-background/80 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-medium text-muted-foreground">
                  Seleccionados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold tabular-nums text-primary">{selectedCount}</div>
                <p className="text-[13px] text-muted-foreground">de {preview.totalTransactions}</p>
              </CardContent>
            </Card>

            <Card className="border-foreground/10 bg-background/80 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-medium text-muted-foreground">
                  Balance Neto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-xl font-semibold tabular-nums',
                    selectedIncome - selectedExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {formatCurrency(selectedIncome - selectedExpenses, preview.detectedCurrency)}
                </div>
                <p className="text-[13px] text-muted-foreground">
                  +{formatCurrency(selectedIncome, preview.detectedCurrency)} / -
                  {formatCurrency(selectedExpenses, preview.detectedCurrency)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Banner */}
          {preview.duplicatesFound > 0 && (
            <div className="flex items-center gap-2 p-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-800 dark:text-amber-200">
                Se encontraron {preview.duplicatesFound} transacciones que ya existen en el sistema.
                Están desmarcadas por defecto.
              </span>
            </div>
          )}

          {/* Transaction Table */}
          <Card className="border-foreground/10 bg-background/80 shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Transacciones a Importar</CardTitle>
                  <CardDescription className="text-[13px]">
                    Revisa y selecciona las transacciones que deseas importar. Puedes cambiar la
                    categoría sugerida.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleSelectAll(true)}>
                    Seleccionar Todo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleSelectAll(false)}>
                    Deseleccionar Todo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedCount === preview.totalTransactions - preview.duplicatesFound}
                          onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                        />
                      </TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.transactions.map((tx, index) => (
                      <TableRow
                        key={`${tx.hash}-${index}`}
                        className={cn(
                          tx.isDuplicate && 'opacity-50 bg-muted/30',
                          !selections[tx.hash]?.selected && 'opacity-60'
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selections[tx.hash]?.selected || false}
                            onCheckedChange={() => toggleTransaction(tx.hash)}
                            disabled={tx.isDuplicate}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(tx.originalDate)}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate" title={tx.description}>
                          {tx.description}
                        </TableCell>
                        <TableCell>
                          {tx.type === 'INCOME' ? (
                        <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-600">
                          <ArrowDownRight className="h-3.5 w-3.5" />
                          Ingreso
                        </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-500/10 text-rose-500">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              Gasto
                            </div>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-medium whitespace-nowrap',
                            tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {tx.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(Math.abs(tx.amount), preview.detectedCurrency)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={selections[tx.hash]?.categoryId || 'none'}
                            onValueChange={(value) => setCategoryForTransaction(tx.hash, value === 'none' ? undefined : value)}
                            disabled={tx.isDuplicate}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Sin categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin categoría</SelectItem>
                              {categories
                                .filter((c) => c.type === tx.type)
                                .map((category, catIndex) => {
                                  const accentColor = category.color || COLOR_PALETTE[catIndex % COLOR_PALETTE.length];
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
                          {tx.suggestedCategory && (
                            <div
                              className={cn(
                                'text-xs mt-1',
                                getConfidenceColor(tx.suggestedCategory.confidence)
                              )}
                            >
                              Sugerida: {tx.suggestedCategory.categoryName} (
                              {Math.round(tx.suggestedCategory.confidence * 100)}%)
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.isDuplicate ? (
                            <Badge variant="secondary" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Duplicado
                            </Badge>
                          ) : selections[tx.hash]?.selected ? (
                            <Badge variant="default" className="gap-1 bg-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Incluir
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Excluir
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <div className="text-sm text-muted-foreground self-center mr-4">
                {selectedCount} transacciones seleccionadas
              </div>
              <Button
                onClick={handleConfirmImport}
                disabled={selectedCount === 0 || confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Importar {selectedCount} Transacciones
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && importResult && (
        <Card className="max-w-lg mx-auto bg-background/80 border-foreground/10 shadow-soft">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>¡Importación Completada!</CardTitle>
            <CardDescription>Las transacciones se han añadido correctamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-muted-foreground">Importadas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-400">{importResult.skipped}</div>
                <div className="text-sm text-muted-foreground">Omitidas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">{importResult.duplicates}</div>
                <div className="text-sm text-muted-foreground">Duplicados</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleReset} className="w-full">
                Importar Más Transacciones
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/transactions">Ver Transacciones</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
