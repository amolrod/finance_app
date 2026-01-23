'use client';

import { useState, useCallback, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Trash2, Tag, FolderOpen, X, CheckSquare, Square } from 'lucide-react';

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
  customActions,
  className,
}: BatchActionsBarProps<T>) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete || selectedItems.length === 0) return;
    
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar ${selectedItems.length} elemento(s)?`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(selectedItems);
      onClearSelection();
    } finally {
      setIsDeleting(false);
    }
  };

  if (selectedItems.length === 0) return null;

  return (
    <div className={cn(
      'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-4 px-5 py-3.5 rounded-xl',
      'bg-primary text-primary-foreground shadow-2xl',
      'animate-in slide-in-from-bottom-8 zoom-in-95 duration-300',
      className
    )}>
      <div className="flex items-center gap-2.5 text-sm font-semibold">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20">
          <CheckSquare className="h-4 w-4" />
        </div>
        <span>{selectedItems.length} seleccionado{selectedItems.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="h-6 w-px bg-primary-foreground/30" />
      
      <div className="flex items-center gap-2">
        {onCategorize && (
          <Button
            size="sm"
            variant="secondary"
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
            onClick={() => onCategorize(selectedItems)}
          >
            <FolderOpen className="h-4 w-4 mr-1.5" />
            Categorizar
          </Button>
        )}
        
        {onTag && (
          <Button
            size="sm"
            variant="secondary"
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
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
            variant="secondary"
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
            onClick={() => action.onClick(selectedItems)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        
        {onDelete && (
          <Button
            size="sm"
            variant="secondary"
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-0"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        )}
      </div>
      
      <div className="h-6 w-px bg-primary-foreground/30" />
      
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
        onClick={onClearSelection}
      >
        <X className="h-4 w-4" />
      </Button>
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
