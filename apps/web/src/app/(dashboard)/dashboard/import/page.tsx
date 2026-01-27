'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories, useCreateCategory } from '@/hooks/use-categories';
import { useTransactions } from '@/hooks/use-transactions';
import { usePreviewImport, useConfirmImport } from '@/hooks/use-import';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CategoryRule, applyCategoryRules, loadCategoryRules, normalizeText } from '@/lib/category-rules';
import { logAuditEvent } from '@/lib/audit-log';

type ImportStep = 'upload' | 'preview' | 'result';

interface TransactionSelection {
  [hash: string]: {
    selected: boolean;
    categoryId?: string;
    description?: string;
  };
}

type ImportPreviewTransaction = ImportPreview['transactions'][number];

const deriveCategoryName = (description: string | null | undefined) => {
  if (!description) return '';
  const cleaned = description
    .replace(/\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const candidate = cleaned.split(/[-|,]/)[0]?.trim() || cleaned;
  return candidate.slice(0, 28);
};

const normalizeCategoryKey = (value: string) => {
  return normalizeText(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getCategoryCandidate = (tx: ImportPreviewTransaction) => {
  const suggestedName = tx.suggestedCategory?.categoryName?.trim();
  if (suggestedName) return suggestedName;
  return deriveCategoryName(tx.description);
};

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selections, setSelections] = useState<TransactionSelection>({});
  const [suggestionSources, setSuggestionSources] = useState<Record<string, 'rule' | 'history' | 'auto'>>({});
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [viewFilter, setViewFilter] = useState<'all' | 'selected' | 'duplicates' | 'uncategorized' | 'needsReview'>('all');
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [isBatchConfirming, setIsBatchConfirming] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const autoCreatedRef = useRef<Set<string>>(new Set());
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    duplicates: number;
  } | null>(null);

  const { toast } = useToast();
  const { data: accountsData } = useAccounts();
  const { data: categoriesData, refetch: refetchCategories } = useCategories();
  const { data: historyTransactions } = useTransactions({ limit: 300 });
  const previewMutation = usePreviewImport();
  const confirmMutation = useConfirmImport();
  const createCategoryMutation = useCreateCategory();

  const accounts = accountsData || [];
  const categories = categoriesData || [];

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; type: 'INCOME' | 'EXPENSE' }>();
    categories.forEach((category) => {
      const key = normalizeCategoryKey(category.name);
      if (!key) return;
      map.set(key, { id: category.id, name: category.name, type: category.type });
    });
    return map;
  }, [categories]);

  useEffect(() => {
    setCategoryRules(loadCategoryRules());
  }, []);

  const learnedCategoryMap = useMemo(() => {
    const map = new Map<string, { categoryId: string; count: number }>();
    (historyTransactions?.data || []).forEach((tx) => {
      if (!tx.description || !tx.categoryId) return;
      if (tx.type === 'TRANSFER') return;
      const key = `${tx.type}-${normalizeText(tx.description)}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { categoryId: tx.categoryId, count: 1 });
      } else {
        map.set(key, { categoryId: existing.categoryId, count: existing.count + 1 });
      }
    });
    return map;
  }, [historyTransactions?.data]);

  useEffect(() => {
    if (!preview) return;
    const updatedSources: Record<string, 'rule' | 'history' | 'auto'> = {};
    setSelections((prev) => {
      const next = { ...prev };
      preview.transactions.forEach((tx) => {
        if (tx.isDuplicate) return;
        if (next[tx.hash]?.categoryId) return;
        const normalized = tx.description ? normalizeText(tx.description) : '';
        const ruleCategoryId = applyCategoryRules(categoryRules, tx.description, tx.type);
        const learnedCategoryId = normalized
          ? learnedCategoryMap.get(`${tx.type}-${normalized}`)?.categoryId
          : undefined;
        let categoryId = ruleCategoryId || learnedCategoryId;
        let source: 'rule' | 'history' | 'auto' | undefined = ruleCategoryId
          ? 'rule'
          : learnedCategoryId
          ? 'history'
          : undefined;

        if (!categoryId && tx.suggestedCategory?.categoryId) {
          categoryId = tx.suggestedCategory.categoryId;
          source = 'auto';
        }

        if (!categoryId && tx.suggestedCategory?.categoryName) {
          const key = normalizeCategoryKey(tx.suggestedCategory.categoryName);
          const match = key ? categoryNameMap.get(key) : undefined;
          if (match && match.type === tx.type) {
            categoryId = match.id;
            source = 'auto';
          }
        }

        if (!categoryId) {
          const derivedName = deriveCategoryName(tx.description);
          if (derivedName) {
            const key = normalizeCategoryKey(derivedName);
            const match = key ? categoryNameMap.get(key) : undefined;
            if (match && match.type === tx.type) {
              categoryId = match.id;
              source = 'auto';
            }
          }
        }

        if (categoryId) {
          next[tx.hash] = {
            ...next[tx.hash],
            categoryId,
          };
          if (source) {
            updatedSources[tx.hash] = source;
          }
        }
      });
      return next;
    });
    if (Object.keys(updatedSources).length) {
      setSuggestionSources((prev) => ({ ...prev, ...updatedSources }));
    }
  }, [categoryRules, learnedCategoryMap, preview, categoryNameMap]);

  useEffect(() => {
    if (!preview || isAutoCreating) return;
    const existing = new Set(categoryNameMap.keys());
    const pending: Array<{ name: string; type: 'INCOME' | 'EXPENSE' }> = [];

    preview.transactions.forEach((tx) => {
      if (tx.isDuplicate) return;
      if (selections[tx.hash]?.categoryId) return;
      const suggestedName = tx.suggestedCategory?.categoryName?.trim();
      const derivedName = deriveCategoryName(tx.description);
      const candidate = suggestedName || derivedName;
      if (!candidate) return;
      const key = normalizeCategoryKey(candidate);
      if (!key) return;
      if (existing.has(key) || autoCreatedRef.current.has(key)) return;
      pending.push({ name: candidate, type: tx.type });
      existing.add(key);
      autoCreatedRef.current.add(key);
    });

    if (!pending.length) return;
    setIsAutoCreating(true);
    (async () => {
      const createdCategories: Array<{ id: string; name: string; type: 'INCOME' | 'EXPENSE' }> = [];
      for (const item of pending) {
        try {
          const created = await createCategoryMutation.mutateAsync({
            name: item.name,
            type: item.type,
          });
          createdCategories.push({
            id: created.id,
            name: created.name,
            type: created.type,
          });
        } catch {
          // ignore single failures
        }
      }
      if (createdCategories.length && preview) {
        setSelections((prev) => {
          const next = { ...prev };
          preview.transactions.forEach((tx) => {
            if (tx.isDuplicate) return;
            if (next[tx.hash]?.categoryId) return;
            const candidate = getCategoryCandidate(tx);
            if (!candidate) return;
            const key = normalizeCategoryKey(candidate);
            const match = createdCategories.find(
              (category) =>
                normalizeCategoryKey(category.name) === key && category.type === tx.type
            );
            if (match) {
              next[tx.hash] = {
                ...next[tx.hash],
                categoryId: match.id,
              };
            }
          });
          return next;
        });
        const newSources: Record<string, 'auto'> = {};
        preview.transactions.forEach((tx) => {
          if (tx.isDuplicate) return;
          const candidate = getCategoryCandidate(tx);
          if (!candidate) return;
          const key = normalizeCategoryKey(candidate);
          const match = createdCategories.find(
            (category) =>
              normalizeCategoryKey(category.name) === key && category.type === tx.type
          );
          if (match) {
            newSources[tx.hash] = 'auto';
          }
        });
        if (Object.keys(newSources).length) {
          setSuggestionSources((prev) => ({ ...prev, ...newSources }));
        }
      }
      if (createdCategories.length) {
        toast({
          title: 'Categorias creadas',
          description: `Se crearon ${createdCategories.length} categorias nuevas para la importacion.`,
        });
      }
    })()
      .finally(() => setIsAutoCreating(false));
  }, [preview, selections, categoryNameMap, createCategoryMutation, toast, isAutoCreating]);

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
        refetchCategories().catch(() => undefined);

        // Initialize selections
        const initialSelections: TransactionSelection = {};
        const initialSources: Record<string, 'rule' | 'history' | 'auto'> = {};

        result.transactions.forEach((tx) => {
          const normalized = tx.description ? normalizeText(tx.description) : '';
          const ruleCategoryId = applyCategoryRules(categoryRules, tx.description, tx.type);
          const learnedCategoryId = normalized
            ? learnedCategoryMap.get(`${tx.type}-${normalized}`)?.categoryId
            : undefined;
          let categoryId: string | undefined;
          if (ruleCategoryId) {
            categoryId = ruleCategoryId;
            initialSources[tx.hash] = 'rule';
          }
          if (!categoryId && learnedCategoryId) {
            categoryId = learnedCategoryId;
            initialSources[tx.hash] = 'history';
          }
          if (!categoryId && tx.suggestedCategory?.categoryId) {
            categoryId = tx.suggestedCategory.categoryId;
            initialSources[tx.hash] = 'auto';
          }

          if (!categoryId && tx.suggestedCategory?.categoryName) {
            const key = normalizeCategoryKey(tx.suggestedCategory.categoryName);
            const match = key ? categoryNameMap.get(key) : undefined;
            if (match && match.type === tx.type) {
              categoryId = match.id;
              initialSources[tx.hash] = 'auto';
            }
          }

          if (!categoryId) {
            const derivedName = deriveCategoryName(tx.description);
            if (derivedName) {
              const derivedKey = normalizeCategoryKey(derivedName);
              const existingCategory = derivedKey ? categoryNameMap.get(derivedKey) : undefined;
              if (existingCategory && existingCategory.type === tx.type) {
                categoryId = existingCategory.id;
                initialSources[tx.hash] = 'auto';
              }
            }
          }

          initialSelections[tx.hash] = {
            selected: !tx.isDuplicate,
            categoryId,
            description: tx.description,
          };
        });
        setSelections(initialSelections);
        setSuggestionSources(initialSources);

        setStep('preview');
      } catch (error) {
        toast({
          title: 'Error al procesar archivo',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        });
      }
    },
    [selectedAccountId, previewMutation, toast, categoryRules, learnedCategoryMap, categoryNameMap, refetchCategories]
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

  const isConfirming = confirmMutation.isPending || isBatchConfirming;

  const validationStats = useMemo(() => {
    if (!preview) {
      return { duplicates: 0, missingDescription: 0, zeroAmount: 0, uncategorized: 0 };
    }
    const missingDescription = preview.transactions.filter((tx) => !tx.description || !tx.description.trim()).length;
    const zeroAmount = preview.transactions.filter((tx) => Number(tx.amount) === 0).length;
    const uncategorized = preview.transactions.filter((tx) => !selections[tx.hash]?.categoryId).length;
    return {
      duplicates: preview.duplicatesFound,
      missingDescription,
      zeroAmount,
      uncategorized,
    };
  }, [preview, selections]);

  const filteredTransactions = useMemo(() => {
    if (!preview) return [];
    return preview.transactions.filter((tx) => {
      if (viewFilter === 'selected') {
        return selections[tx.hash]?.selected;
      }
      if (viewFilter === 'duplicates') {
        return tx.isDuplicate;
      }
      if (viewFilter === 'uncategorized') {
        return !selections[tx.hash]?.categoryId;
      }
      if (viewFilter === 'needsReview') {
        return !tx.description || tx.amount === 0;
      }
      return true;
    });
  }, [preview, selections, viewFilter]);

  const chunkTransactions = useCallback((items: ImportTransaction[], chunkSize: number) => {
    const chunks: ImportTransaction[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }, []);

  // Confirm import
  const handleConfirmImport = async () => {
    if (!preview || !selectedAccountId) return;

    const selectedTransactions = preview.transactions.filter(
      (tx) => selections[tx.hash]?.selected
    );
    const skippedByUser = preview.totalTransactions - selectedTransactions.length;

    const categoryLookup = new Map(categoryNameMap);
    const pendingCategories = new Map<string, { name: string; type: 'INCOME' | 'EXPENSE' }>();

    selectedTransactions.forEach((tx) => {
      if (selections[tx.hash]?.categoryId) return;
      const candidate = getCategoryCandidate(tx);
      if (!candidate) return;
      const key = normalizeCategoryKey(candidate);
      if (!key) return;
      if (categoryLookup.has(key)) return;
      if (!pendingCategories.has(key)) {
        pendingCategories.set(key, { name: candidate, type: tx.type });
      }
    });

    if (pendingCategories.size > 0) {
      setIsAutoCreating(true);
      for (const [key, item] of pendingCategories.entries()) {
        try {
          const created = await createCategoryMutation.mutateAsync({
            name: item.name,
            type: item.type,
          });
          categoryLookup.set(key, {
            id: created.id,
            name: created.name,
            type: created.type,
          });
        } catch {
          const fallback = categories.find(
            (category) => normalizeCategoryKey(category.name) === key
          );
          if (fallback) {
            categoryLookup.set(key, {
              id: fallback.id,
              name: fallback.name,
              type: fallback.type,
            });
          }
        }
      }
      setIsAutoCreating(false);
    }

    const transactions: ImportTransaction[] = selectedTransactions.map((tx) => {
      let categoryId = selections[tx.hash]?.categoryId;
      if (!categoryId) {
        const candidate = getCategoryCandidate(tx);
        const key = candidate ? normalizeCategoryKey(candidate) : '';
        const match = key ? categoryLookup.get(key) : undefined;
        if (match && match.type === tx.type) {
          categoryId = match.id;
        }
      }

      return {
        hash: tx.hash,
        categoryId,
        description: selections[tx.hash]?.description || tx.description,
        date: tx.originalDate,
        amount: tx.amount,
        type: tx.type,
        suggestedCategoryId: tx.suggestedCategory?.categoryId,
        confidence: tx.suggestedCategory
          ? Math.round(tx.suggestedCategory.confidence * 100)
          : undefined,
      };
    });

    try {
      const batches = chunkTransactions(transactions, 100);
      let totalImported = 0;
      let totalSkipped = 0;

      setIsBatchConfirming(true);
      setBatchProgress({ current: 0, total: batches.length });

      for (let i = 0; i < batches.length; i += 1) {
        setBatchProgress({ current: i + 1, total: batches.length });
        const result = await confirmMutation.mutateAsync({
          accountId: selectedAccountId,
          transactions: batches[i],
        });
        totalImported += result.imported;
        totalSkipped += result.skipped;
      }

      setImportResult({
        imported: totalImported,
        skipped: skippedByUser + totalSkipped,
        duplicates: preview.duplicatesFound,
      });
      setStep('result');

      toast({
        title: 'Importación completada',
        description: `Se importaron ${result.imported} transacciones`,
      });
      logAuditEvent({
        action: 'Importacion completada',
        detail: `${totalImported} transacciones`,
      });
    } catch (error) {
      toast({
        title: 'Error en importación',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setIsBatchConfirming(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  // Reset to start new import
  const handleReset = () => {
    setStep('upload');
    setPreview(null);
    setSelections({});
    setSuggestionSources({});
    setViewFilter('all');
    setIsBatchConfirming(false);
    setBatchProgress({ current: 0, total: 0 });
    setImportResult(null);
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.5) return 'text-warning';
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
        <PageHeader
          title="Importar Transacciones"
          description="Importa transacciones desde extractos bancarios en formato CSV"
          icon={<Download className="h-5 w-5" />}
        />
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
                    ? 'border-foreground/20 bg-foreground/5 text-foreground'
                    : isActive
                      ? 'border-foreground/30 bg-background text-foreground'
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5">
                      <Building2 className="h-4 w-4 text-foreground/60" />
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5">
                      <FileSpreadsheet className="h-4 w-4 text-foreground/60" />
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
                      'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-foreground/[0.02]',
                      isDragActive && 'border-foreground/30 bg-foreground/5',
                      !selectedAccountId && 'opacity-50 cursor-not-allowed',
                      previewMutation.isPending && 'opacity-50 cursor-wait'
                    )}
                  >
                    <input {...getInputProps()} />
                    {previewMutation.isPending ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 text-foreground/70 animate-spin" />
                        <p className="text-sm text-muted-foreground">Procesando archivo...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                        {isDragActive ? (
                          <p className="text-sm text-foreground font-medium">Suelta el archivo aquí...</p>
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
                      <CheckCircle2 className="h-4 w-4 text-foreground/60" />
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
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="border-foreground/10 bg-background/80 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-medium text-muted-foreground">
                  Rango de fechas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {formatDate(preview.dateRange.from)}
                </div>
                <p className="text-[12px] text-muted-foreground">hasta {formatDate(preview.dateRange.to)}</p>
              </CardContent>
            </Card>
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
                    selectedIncome - selectedExpenses >= 0 ? 'text-success' : 'text-destructive'
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
            <div className="flex items-center gap-2 p-4 rounded-xl border border-foreground/10 bg-foreground/5">
              <AlertTriangle className="h-5 w-5 text-warning/80" />
              <span className="text-sm text-muted-foreground">
                Se encontraron {preview.duplicatesFound} transacciones que ya existen en el sistema.
                Están desmarcadas por defecto.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
              <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1">
                Duplicados: {validationStats.duplicates}
              </span>
              <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1">
                Sin descripcion: {validationStats.missingDescription}
              </span>
              <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1">
                Monto cero: {validationStats.zeroAmount}
              </span>
              <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1">
                Sin categoria: {validationStats.uncategorized}
              </span>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              {isAutoCreating && (
                <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creando categorias...
                </div>
              )}
              {([
                { key: 'all', label: 'Todo' },
                { key: 'selected', label: 'Seleccionadas' },
                { key: 'duplicates', label: 'Duplicados' },
                { key: 'uncategorized', label: 'Sin categoria' },
                { key: 'needsReview', label: 'Revisar' },
              ] as const).map((filter) => (
                <Button
                  key={filter.key}
                  variant={viewFilter === filter.key ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-[12px]"
                  onClick={() => setViewFilter(filter.key)}
                >
                  {filter.label}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px]"
                onClick={() => setCategoryRules(loadCategoryRules())}
              >
                Aplicar reglas
              </Button>
            </div>
          </div>

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
                    {filteredTransactions.map((tx, index) => {
                      const needsReview = !tx.description || Number(tx.amount) === 0;
                      return (
                        <TableRow
                          key={`${tx.hash}-${index}`}
                          className={cn(
                            tx.isDuplicate && 'opacity-50 bg-muted/30',
                            !selections[tx.hash]?.selected && 'opacity-60',
                            needsReview && 'border-l-2 border-warning/40'
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
                        <div className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground/70">
                          <span className="h-1.5 w-1.5 rounded-full bg-success/70" />
                          Ingreso
                        </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground/70">
                              <span className="h-1.5 w-1.5 rounded-full bg-destructive/70" />
                              Gasto
                            </div>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-medium whitespace-nowrap',
                            tx.type === 'INCOME' ? 'text-success' : 'text-destructive'
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
                          {tx.suggestedCategory ? (
                            <div
                              className={cn(
                                'text-xs mt-1',
                                getConfidenceColor(tx.suggestedCategory.confidence)
                              )}
                            >
                              Sugerida: {tx.suggestedCategory.categoryName} (
                              {Math.round(tx.suggestedCategory.confidence * 100)}%)
                            </div>
                          ) : suggestionSources[tx.hash] ? (
                            <div className="text-xs mt-1 text-muted-foreground">
                              Sugerida por{' '}
                              {suggestionSources[tx.hash] === 'rule'
                                ? 'regla'
                                : suggestionSources[tx.hash] === 'history'
                                ? 'historial'
                                : 'auto'}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {tx.isDuplicate ? (
                            <Badge variant="secondary" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Duplicado
                            </Badge>
                          ) : selections[tx.hash]?.selected ? (
                            <Badge variant="default" className="gap-1 bg-success">
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
                      );
                    })}
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
                disabled={selectedCount === 0 || isConfirming || isAutoCreating}
              >
                {isConfirming || isAutoCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {batchProgress.total > 1
                      ? `Importando ${batchProgress.current}/${batchProgress.total}...`
                      : isAutoCreating
                        ? 'Preparando categorias...'
                        : 'Importando...'}
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
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-success/15 dark:bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <CardTitle>¡Importación Completada!</CardTitle>
            <CardDescription>Las transacciones se han añadido correctamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-success">{importResult.imported}</div>
                <div className="text-sm text-muted-foreground">Importadas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-400">{importResult.skipped}</div>
                <div className="text-sm text-muted-foreground">Omitidas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-warning">{importResult.duplicates}</div>
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
