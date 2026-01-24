'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile, useChangePassword, useDeleteAccount } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Palette, Bell, Shield, Globe, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useCurrency } from '@/contexts/currency-context';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Mínimo 1 caracter'),
  lastName: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Requerido'),
  confirmText: z.string(),
}).refine((data) => data.confirmText === 'ELIMINAR', {
  message: 'Escribe ELIMINAR para confirmar',
  path: ['confirmText'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const { theme, setTheme: setNextTheme } = useTheme();
  const [locale, setLocale] = useState<string>('es-ES');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    weeklyReport: false,
    monthlyReport: true,
  });
  const { preferredCurrency, setPreferredCurrency } = useCurrency();
  const cardClassName = 'bg-background/80 border-foreground/10 shadow-soft';

  // Mutations
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();

  // Parse user name into firstName and lastName
  const nameParts = user?.name?.split(' ') || ['', ''];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: firstName,
      lastName: lastName,
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const deleteForm = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmText: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName || undefined,
      });
      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos han sido guardados correctamente.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada correctamente.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cambiar la contraseña. Verifica tu contraseña actual.',
        variant: 'destructive',
      });
    }
  };

  const onDeleteSubmit = async (data: DeleteAccountFormData) => {
    try {
      await deleteAccountMutation.mutateAsync({
        password: data.password,
      });
      toast({
        title: 'Cuenta eliminada',
        description: 'Tu cuenta ha sido eliminada permanentemente.',
      });
      router.push('/auth/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la cuenta. Verifica tu contraseña.',
        variant: 'destructive',
      });
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast({
      title: 'Preferencias actualizadas',
      description: 'Tus notificaciones han sido configuradas.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
            <p className="text-[13px] text-muted-foreground">
              Administra tu cuenta y preferencias
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Pills */}
      <motion.div 
        className="flex gap-0.5 p-0.5 bg-secondary rounded-lg w-fit overflow-x-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        {[
          { icon: User, label: 'Perfil', id: 'profile' },
          { icon: Shield, label: 'Seguridad', id: 'security' },
          { icon: Palette, label: 'Apariencia', id: 'appearance' },
          { icon: Globe, label: 'Regional', id: 'regional' },
          { icon: Bell, label: 'Notificaciones', id: 'notifications' },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all whitespace-nowrap"
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </a>
        ))}
      </motion.div>

      <div className="grid gap-4">
        {/* Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.08 }}
        >
          <Card id="profile" className={cardClassName}>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-[14px] font-medium">Perfil</CardTitle>
                  <CardDescription className="text-[12px]">
                    Actualiza tu información personal
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    {...profileForm.register('firstName')}
                    className="bg-muted/30"
                  />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    {...profileForm.register('lastName')}
                    className="bg-muted/30"
                    placeholder="Opcional"
                  />
                  {profileForm.formState.errors.lastName && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-muted/50 text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
              </div>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </form>
          </CardContent>
        </Card>
        </motion.div>

        {/* Seguridad */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.12 }}
        >
          <Card id="security" className={cardClassName}>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-[14px] font-medium">Seguridad</CardTitle>
                  <CardDescription className="text-[12px]">
                  Cambia tu contraseña
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register('currentPassword')}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
        </motion.div>

        {/* Apariencia */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.16 }}
        >
          <Card id="appearance" className={cardClassName}>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-[14px] font-medium">Apariencia</CardTitle>
                  <CardDescription className="text-[12px]">
                    Personaliza el aspecto de la aplicación
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-[12px]">Tema</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'light', label: 'Claro', icon: '☀️' },
                    { value: 'dark', label: 'Oscuro', icon: '🌙' },
                    { value: 'system', label: 'Sistema', icon: '💻' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNextTheme(option.value)}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all',
                        theme === option.value 
                          ? 'border-foreground/30 bg-foreground/5' 
                          : 'border-border/60 hover:bg-secondary/50'
                      )}
                    >
                      <span className="text-xl">{option.icon}</span>
                      <span className="text-[12px] font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Regional */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <Card id="regional" className={cardClassName}>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-[14px] font-medium">Regional</CardTitle>
                  <CardDescription className="text-[12px]">
                    Configura moneda y formato
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Moneda principal</Label>
                <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="USD">USD - Dólar estadounidense</SelectItem>
                    <SelectItem value="GBP">GBP - Libra esterlina</SelectItem>
                    <SelectItem value="MXN">MXN - Peso mexicano</SelectItem>
                    <SelectItem value="ARS">ARS - Peso argentino</SelectItem>
                    <SelectItem value="CLP">CLP - Peso chileno</SelectItem>
                    <SelectItem value="COP">COP - Peso colombiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato regional</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es-ES">España</SelectItem>
                    <SelectItem value="es-MX">México</SelectItem>
                    <SelectItem value="es-AR">Argentina</SelectItem>
                    <SelectItem value="en-US">Estados Unidos</SelectItem>
                    <SelectItem value="en-GB">Reino Unido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Notificaciones */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.24 }}
        >
          <Card id="notifications" className={cardClassName}>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-[14px] font-medium">Notificaciones</CardTitle>
                  <CardDescription className="text-[12px]">
                    Configura cuándo recibir alertas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {[
                { key: 'budgetAlerts' as const, title: 'Alertas de presupuesto', desc: 'Notificación cuando estés cerca del límite' },
                { key: 'weeklyReport' as const, title: 'Resumen semanal', desc: 'Email con el resumen de la semana' },
                { key: 'monthlyReport' as const, title: 'Resumen mensual', desc: 'Email con el resumen del mes' },
              ].map((item) => (
                <div 
                  key={item.key} 
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div>
                    <p className="font-medium text-[13px]">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification(item.key)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      notifications[item.key] ? 'bg-foreground' : 'bg-foreground/20'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-3.5 w-3.5 transform rounded-full bg-background transition-transform',
                        notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Zona de peligro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-red-200 dark:border-red-900/50 bg-background/80 shadow-soft">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-base">
                Zona de peligro
              </CardTitle>
              <CardDescription>
                Acciones irreversibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <div>
                  <p className="font-medium text-sm">Eliminar cuenta</p>
                  <p className="text-[13px] text-muted-foreground">
                    Elimina permanentemente tu cuenta y todos tus datos
                  </p>
                </div>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Eliminar cuenta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminarán permanentemente tu cuenta
                        y todos tus datos: cuentas, transacciones, presupuestos, etc.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="deletePassword">Tu contraseña</Label>
                        <Input
                          id="deletePassword"
                          type="password"
                          {...deleteForm.register('password')}
                          placeholder="Introduce tu contraseña"
                        />
                        {deleteForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {deleteForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmText">Escribe ELIMINAR para confirmar</Label>
                        <Input
                          id="confirmText"
                          {...deleteForm.register('confirmText')}
                          placeholder="ELIMINAR"
                        />
                        {deleteForm.formState.errors.confirmText && (
                          <p className="text-sm text-destructive">
                            {deleteForm.formState.errors.confirmText.message}
                          </p>
                        )}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel type="button" onClick={() => deleteForm.reset()}>
                          Cancelar
                        </AlertDialogCancel>
                        <Button 
                          type="submit" 
                          variant="destructive"
                          disabled={deleteAccountMutation.isPending}
                        >
                          {deleteAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Eliminar mi cuenta
                        </Button>
                      </AlertDialogFooter>
                    </form>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
