'use client';

import { useState } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useInvestmentOperations, useDeleteInvestmentOperation } from '@/hooks/use-investments';
import { formatDate } from '@/lib/utils';
import { useCurrency } from '@/contexts/currency-context';
import type { OperationType } from '@/types/api';

const operationTypeLabels: Record<OperationType, { label: string; className: string; color: string }> = {
  BUY: { label: 'Compra', className: 'border-foreground/10 text-foreground/70 bg-foreground/5', color: '#f43f5e' },
  SELL: { label: 'Venta', className: 'border-foreground/10 text-foreground/70 bg-foreground/5', color: '#10b981' },
  DIVIDEND: { label: 'Dividendo', className: 'border-foreground/10 text-foreground/70 bg-foreground/5', color: '#0ea5e9' },
  FEE: { label: 'Comisión', className: 'border-foreground/10 text-foreground/70 bg-foreground/5', color: '#f59e0b' },
  SPLIT: { label: 'Split', className: 'border-foreground/10 text-foreground/70 bg-foreground/5', color: '#6366f1' },
};

interface OperationsTableProps {
  onEdit: (id: string) => void;
}

export function OperationsTable({ onEdit }: OperationsTableProps) {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 10;
  const { convertAndFormat } = useCurrency();

  const { data, isLoading } = useInvestmentOperations({ page, limit });
  const deleteMutation = useDeleteInvestmentOperation();

  const operations = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-background/80 border-foreground/10 shadow-soft">
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Cargando operaciones...</p>
        </CardContent>
      </Card>
    );
  }

  if (operations.length === 0 && page === 1) {
    return (
      <Card className="bg-background/80 border-foreground/10 shadow-soft">
        <CardHeader>
          <CardTitle>Historial de Operaciones</CardTitle>
          <CardDescription>Todas tus compras, ventas y dividendos</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-32 text-center">
          <p className="text-muted-foreground">
            No hay operaciones registradas
          </p>
          <p className="text-sm text-muted-foreground">
            Registra tu primera operación para comenzar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-background/80 border-foreground/10 shadow-soft">
        <CardHeader>
          <CardTitle>Historial de Operaciones</CardTitle>
          <CardDescription>Todas tus compras, ventas y dividendos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((op) => {
                const typeInfo = operationTypeLabels[op.type] || operationTypeLabels.BUY;
                const symbol = (op.asset?.symbol || op.asset?.name || '?').slice(0, 3).toUpperCase();
                const quantity = parseFloat(op.quantity);
                const price = parseFloat(op.pricePerUnit);
                const total = parseFloat(op.totalAmount);
                const fees = parseFloat(op.fees);

                return (
                  <TableRow key={op.id}>
                    <TableCell>
                      {formatDate(op.occurredAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background/80"
                        style={{
                          borderColor: `${typeInfo.color}40`,
                          color: typeInfo.color,
                          boxShadow: `0 8px 18px -16px ${typeInfo.color}88`,
                        }}
                      >
                          <span className="text-[9px] font-semibold">{symbol}</span>
                        </div>
                        <div>
                          <div className="font-medium">{op.asset?.symbol}</div>
                          <div className="text-sm text-muted-foreground">{op.asset?.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={typeInfo.className}>
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {convertAndFormat(price, op.currency)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${
                      op.type === 'BUY' || op.type === 'FEE' ? 'text-foreground' : 'text-emerald-600/80 dark:text-emerald-400/80'
                    }`}>
                      {op.type === 'BUY' || op.type === 'FEE' ? '-' : '+'}
                      {convertAndFormat(Math.abs(total), op.currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {fees > 0 ? convertAndFormat(fees, op.currency) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(op.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(op.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar operación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La operación será eliminada permanentemente
              y los cálculos de posiciones se recalcularán.
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
    </>
  );
}
