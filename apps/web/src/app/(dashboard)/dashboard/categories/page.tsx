'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-categories';
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
import { cn } from '@/lib/utils';
import { Plus, FolderTree, Trash2, TrendingUp, TrendingDown, Folder, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CategoryType } from '@/types/api';
import { COLOR_PALETTE } from '@/lib/color-palettes';

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().optional(),
  parentId: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

const defaultColors = COLOR_PALETTE;

const getCategoryInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return '—';
  const parts = trimmed.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

export default function CategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE');
  const { toast } = useToast();

  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type: 'EXPENSE',
      color: defaultColors[0],
    },
  });

  const selectedColor = watch('color');
  const selectedType = watch('type');

  const filteredCategories = categories?.filter((cat) => cat.type === activeTab) || [];
  const parentCategories = filteredCategories.filter((cat) => !cat.parentId);

  const onSubmit = async (data: CategoryForm) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        type: data.type as CategoryType,
        color: data.color,
        parentId: data.parentId || undefined,
      });
      toast({
        title: 'Categoría creada',
        description: 'La categoría se ha creado correctamente.',
      });
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la categoría.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string, isSystem: boolean) => {
    if (isSystem) {
      toast({
        title: 'No permitido',
        description: 'Las categorías del sistema no se pueden eliminar.',
        variant: 'destructive',
      });
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Categoría eliminada',
        description: 'La categoría se ha eliminado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la categoría.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Organiza tus ingresos y gastos
          </p>
        </div>
        
        {/* Stats cards */}
        <div className="flex gap-2">
          <div className="flex items-center gap-2.5 rounded-lg bg-secondary border border-border/40 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/5">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">
                {categories?.filter(c => c.type === 'EXPENSE').length || 0}
              </p>
              <p className="text-[11px] text-muted-foreground">Gastos</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-secondary border border-border/40 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/5">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">
                {categories?.filter(c => c.type === 'INCOME').length || 0}
              </p>
              <p className="text-[11px] text-muted-foreground">Ingresos</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Categoría</DialogTitle>
              <DialogDescription>
                Añade una categoría para organizar tus transacciones
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Restaurantes"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    {(['EXPENSE', 'INCOME'] as CategoryType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('type', type)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors',
                          selectedType === type
                            ? 'border-foreground/30 bg-foreground/5 text-foreground'
                            : 'border-border/60 hover:bg-secondary/50'
                        )}
                      >
                        {type === 'INCOME' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="text-[13px] font-medium">
                          {type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoría Padre (opcional)</Label>
                  <Select onValueChange={(value) => setValue('parentId', value === 'none' ? undefined : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin categoría padre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría padre</SelectItem>
                      {categories
                        ?.filter((cat) => cat.type === selectedType && !cat.parentId)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'relative h-8 w-8 rounded-full border border-white/40 shadow-sm transition-all duration-150',
                          selectedColor === color && 'scale-110 ring-2 ring-foreground/20 ring-offset-2'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setValue('color', color)}
                      >
                        {selectedColor === color ? (
                          <Check className="h-4 w-4 text-white drop-shadow" />
                        ) : null}
                      </button>
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

      {/* Tabs mejorados */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-0.5 p-0.5 bg-secondary rounded-lg w-fit"
      >
        <button
          onClick={() => setActiveTab('EXPENSE')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all',
            activeTab === 'EXPENSE' 
              ? 'bg-background shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingDown className="h-3.5 w-3.5" />
          Gastos
        </button>
        <button
          onClick={() => setActiveTab('INCOME')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all',
            activeTab === 'INCOME' 
              ? 'bg-background shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Ingresos
        </button>
      </motion.div>

      {/* Categories */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="h-14 bg-secondary rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !parentCategories.length ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <FolderTree className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">No hay categorías de {activeTab === 'EXPENSE' ? 'gastos' : 'ingresos'}</h3>
            <p className="text-[13px] text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
              Crea tu primera categoría para organizar tus transacciones
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Categoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {parentCategories.map((category, index) => {
              const children = filteredCategories.filter((cat) => cat.parentId === category.id);
              const accentColor = category.color || defaultColors[index % defaultColors.length];
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.02 }}
                >
                  <Card className="group relative overflow-hidden card-hover h-full">
                    <CardHeader className="pb-2 pt-4 pl-5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div
                            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5"
                          >
                            <span className="text-[11px] font-semibold text-foreground/70">
                              {getCategoryInitials(category.name)}
                            </span>
                            <span
                              className="absolute bottom-1 right-1 h-2 w-2 rounded-full"
                              style={{ backgroundColor: accentColor }}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-[14px] font-medium truncate">{category.name}</CardTitle>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {category.isSystem && (
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-secondary text-muted-foreground">
                                Sistema
                              </span>
                            )}
                            {children.length > 0 && (
                              <span className="text-[11px] text-muted-foreground">
                                {children.length} sub{children.length === 1 ? 'categoría' : 'categorías'}
                              </span>
                            )}
                          </div>
                        </div>
                        {!category.isSystem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 shrink-0"
                            onClick={() => handleDelete(category.id, category.name, category.isSystem)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    {children.length > 0 && (
                      <CardContent className="pt-1 pl-5 pb-3">
                        <div className="space-y-0.5">
                          {children.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center gap-2 text-[12px] text-muted-foreground py-1.5 px-2.5 rounded-md hover:bg-secondary/50 group/child transition-colors"
                            >
                              <div
                                className="flex h-6 w-6 items-center justify-center rounded-full border bg-background/80"
                                style={{
                                  borderColor: `${child.color || accentColor}40`,
                                  color: child.color || accentColor,
                                }}
                              >
                                <span className="text-[9px] font-semibold">
                                  {getCategoryInitials(child.name)}
                                </span>
                              </div>
                              <span className="flex-1 truncate">{child.name}</span>
                              {!child.isSystem && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover/child:opacity-100 transition-opacity h-5 w-5 shrink-0"
                                  onClick={() => handleDelete(child.id, child.name, child.isSystem)}
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
