'use client';

import { useState, useCallback, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Trash2, Tag, FolderOpen, X, CheckSquare, Square } from 'lucide-react';
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

// Base interface - items must have an id
interface SelectionItem {
  id: string;
}

interface BatchActionsBarProps<T extends SelectionItem> {
  selectedItems: T[];
  onClearSelection: () => void;
  onDelete?: (items: T[]) => Promise<void>;
  onCategorize?: (items: T[]) => void;
  onTag?: (items: T[]) => void;
  isBusy?: boolean;
  statusLabel?: string;
  customActions?: {
    label: string;
    icon?: ReactNode;
    onClick: (items: T[]) => void;
    variant?: 'default' | 'destructive' | 'outline';
  }[];
  className?: string;
}

export function BatchActionsBar<T extends SelectionItem>({
  selectedItems,
  onClearSelection,
  onDelete,
  onCategorize,
  onTag,
  isBusy,
  statusLabel,
  customActions,
  className,
}: BatchActionsBarProps<T>) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isProcessing = isDeleting || !!isBusy;

  const handleDelete = async () => {
    if (!onDelete || selectedItems.length === 0) return;
    setIsDeleting(true);
    try {
      await onDelete(selectedItems);
      onClearSelection();
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (selectedItems.length === 0) return null;

  return (
    <div className={cn(
      'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-4 px-5 py-3.5 rounded-2xl',
      'bg-background/95 text-foreground border border-foreground/10 shadow-soft-lg backdrop-blur-xl',
      'animate-in slide-in-from-bottom-8 zoom-in-95 duration-300',
      className
    )}>
      <div className="flex items-center gap-2.5 text-sm font-semibold">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-foreground">
          <CheckSquare className="h-4 w-4" />
        </div>
        <span>{selectedItems.length} seleccionado{selectedItems.length !== 1 ? 's' : ''}</span>
        {statusLabel && (
          <span className="text-[12px] text-muted-foreground font-normal">
            {statusLabel}
          </span>
        )}
      </div>
      
      <div className="h-6 w-px bg-foreground/10" />
      
      <div className="flex items-center gap-2">
        {onCategorize && (
          <Button
            size="sm"
            variant="outline"
            className="bg-background/70"
            onClick={() => onCategorize(selectedItems)}
          >
            <FolderOpen className="h-4 w-4 mr-1.5" />
            Categorizar
          </Button>
        )}
        
        {onTag && (
          <Button
            size="sm"
            variant="outline"
            className="bg-background/70"
            onClick={() => onTag(selectedItems)}
          >
            <Tag className="h-4 w-4 mr-1.5" />
            Etiquetar
          </Button>
        )}
        
        {customActions?.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant="outline"
            className="bg-background/70"
            onClick={() => action.onClick(selectedItems)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        
        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {isProcessing ? 'Eliminando...' : 'Eliminar'}
          </Button>
        )}
      </div>
      
      <div className="h-6 w-px bg-foreground/10" />
      
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 hover:bg-foreground/10"
        onClick={onClearSelection}
      >
        <X className="h-4 w-4" />
      </Button>

      {onDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar transacciones</AlertDialogTitle>
              <AlertDialogDescription>
                Se revertirán {selectedItems.length} transacciones. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isProcessing}>
                {isProcessing ? 'Eliminando...' : 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// Hook for managing selection state
export function useSelection<T extends SelectionItem>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedItems = items.filter(item => selectedIds.has(item.id));

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return {
    selectedIds,
    selectedItems,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isSomeSelected,
  };
}

// Selection checkbox component
interface SelectionCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export function SelectionCheckbox({ checked, onChange, className }: SelectionCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onChange}
      className={cn('transition-opacity', className)}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// Select all checkbox with indeterminate state
interface SelectAllCheckboxProps {
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  className?: string;
}

export function SelectAllCheckbox({
  isAllSelected,
  isSomeSelected,
  onSelectAll,
  onClearSelection,
  className,
}: SelectAllCheckboxProps) {
  const handleChange = () => {
    if (isAllSelected || isSomeSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  return (
    <Checkbox
      checked={isAllSelected}
      // @ts-ignore - indeterminate is valid HTML but not typed in Radix
      data-state={isSomeSelected ? 'indeterminate' : isAllSelected ? 'checked' : 'unchecked'}
      onCheckedChange={handleChange}
      className={cn(
        isSomeSelected && 'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary',
        className
      )}
    />
  );
}
