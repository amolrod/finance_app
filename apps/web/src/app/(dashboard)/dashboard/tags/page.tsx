'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/use-tags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { Plus, Tags, Trash2, Hash, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { COLOR_PALETTE } from '@/lib/color-palettes';

const tagSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  color: z.string().optional(),
});

type TagForm = z.infer<typeof tagSchema>;

const defaultColors = COLOR_PALETTE;

const getTagInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return '#';
  const parts = trimmed.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

export default function TagsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: tags, isLoading } = useTags();
  const createMutation = useCreateTag();
  const deleteMutation = useDeleteTag();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TagForm>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      color: defaultColors[0],
    },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: TagForm) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        color: data.color,
      });
      toast({
        title: 'Etiqueta creada',
        description: 'La etiqueta se ha creado correctamente.',
      });
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la etiqueta.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la etiqueta "${name}"?`)) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Etiqueta eliminada',
        description: 'La etiqueta se ha eliminado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la etiqueta.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <Hash className="h-5 w-5 text-foreground/70" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Etiquetas</h1>
            <p className="text-[13px] text-muted-foreground">
              Organiza tus transacciones con etiquetas
            </p>
          </div>
        </div>
        
        {/* Stats card */}
        <div className="flex items-center gap-2.5 rounded-lg bg-secondary border border-border/40 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/5">
            <Tags className="h-4 w-4 text-foreground/60" />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">
              {tags?.length || 0}
            </p>
            <p className="text-[11px] text-muted-foreground">Total etiquetas</p>
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
            <Button size="sm" className="h-9 text-[13px]">
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva Etiqueta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[17px]">Crear Nueva Etiqueta</DialogTitle>
              <DialogDescription className="text-[13px]">
                Las etiquetas te ayudan a filtrar transacciones
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Vacaciones"
                    {...register('name')}
                    error={errors.name?.message}
                  />
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
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" isLoading={createMutation.isPending}>
                  Crear
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Tags List */}
      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 animate-pulse bg-secondary rounded-lg" />
          ))}
        </div>
      ) : !tags?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
        >
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <Tags className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-[15px] font-medium mb-1">No tienes etiquetas</h3>
              <p className="text-[13px] text-muted-foreground mb-5 max-w-sm mx-auto">
                Las etiquetas te ayudan a filtrar y organizar transacciones
              </p>
              <Button size="sm" onClick={() => setIsDialogOpen(true)} className="h-9 text-[13px]">
                <Plus className="mr-1.5 h-4 w-4" />
                Crear Primera
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {tags.map((tag, index) => {
                    const accentColor = tag.color || defaultColors[index % defaultColors.length];

                    return (
                      <motion.div
                        key={tag.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.02 }}
                        className="group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium border bg-background/70 shadow-sm backdrop-blur-sm hover:shadow-md transition-all cursor-default"
                        style={{
                          borderColor: `${accentColor}55`,
                          backgroundImage: `linear-gradient(120deg, ${accentColor}1f, transparent 70%)`,
                        }}
                      >
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full border bg-background/80"
                          style={{
                            borderColor: `${accentColor}55`,
                            color: accentColor,
                          }}
                        >
                          <span className="text-[9px] font-semibold">
                            {getTagInitials(tag.name)}
                          </span>
                        </div>
                        <span>{tag.name}</span>
                        <button
                          onClick={() => handleDelete(tag.id, tag.name)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground p-0.5 -mr-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
