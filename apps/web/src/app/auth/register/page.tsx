'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Fraunces, Sora } from 'next/font/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoText } from '@/components/logo';
import { ArrowLeft, Check, Eye, EyeOff, Shield, Sparkles, Star, Zap } from 'lucide-react';

const displayFont = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display'
});

const textFont = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-text'
});

const PAGE_STYLE = {
  '--accent-a': '#10b981',
  '--accent-b': '#14b8a6',
  '--accent-c': '#0ea5e9',
  '--accent-d': '#f59e0b'
} as React.CSSProperties;

const REGISTER_STEPS = [
  {
    title: 'Crea tu espacio',
    description: 'Configura cuentas y monedas en minutos.'
  },
  {
    title: 'Trae tus datos',
    description: 'Importa extractos o empieza a registrar.'
  },
  {
    title: 'Mide y ajusta',
    description: 'Reportes claros para mejores decisiones.'
  }
];

const REGISTER_HIGHLIGHTS = [
  {
    icon: Shield,
    title: 'Privacidad primero',
    description: 'Tu información permanece segura.'
  },
  {
    icon: Zap,
    title: 'Experiencia veloz',
    description: 'Interfaz fluida sin esperas.'
  },
  {
    icon: Star,
    title: 'Gratis siempre',
    description: 'Sin planes ocultos ni anuncios.'
  }
];

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const password = watch('password', '');

  const passwordChecks = [
    { label: 'Al menos 8 caracteres', valid: password.length >= 8 },
    { label: 'Una letra mayúscula', valid: /[A-Z]/.test(password) },
    { label: 'Una letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Un número', valid: /[0-9]/.test(password) }
  ];

  const passwordScore = passwordChecks.filter((check) => check.valid).length;
  const passwordStrength = (passwordScore / passwordChecks.length) * 100;
  const allPasswordChecksValid = passwordChecks.every((check) => check.valid);

  const strengthLabel = ['Débil', 'Aceptable', 'Sólida', 'Fuerte', 'Excelente'][passwordScore] ?? 'Débil';
  const strengthTone =
    passwordScore <= 1
      ? 'bg-rose-500'
      : passwordScore === 2
      ? 'bg-amber-500'
      : passwordScore === 3
      ? 'bg-lime-500'
      : 'bg-emerald-500';

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        firstName: data.firstName
      });
      toast({
        title: '¡Cuenta creada!',
        description: 'Redirigiendo al dashboard...'
      });
      window.location.href = '/dashboard';
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const message = Array.isArray(err?.response?.data?.message)
        ? err.response.data.message[0]
        : err?.response?.data?.message || 'Error al crear la cuenta';
      toast({
        title: 'Error de registro',
        description: message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div
      className={`${displayFont.variable} ${textFont.variable} min-h-screen bg-background text-foreground font-[var(--font-text)]`}
      style={PAGE_STYLE}
    >
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 left-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_top,var(--accent-b)_0%,transparent_70%)] opacity-55 blur-3xl motion-safe:animate-[drift_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_top,var(--accent-d)_0%,transparent_70%)] opacity-45 blur-3xl motion-safe:animate-[drift_24s_ease-in-out_infinite]" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40 dark:opacity-30"
          style={{ maskImage: 'radial-gradient(circle at top, black, transparent 70%)' }}
        />
      </div>

      <header className="fixed left-0 right-0 top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto flex min-h-screen items-center px-4 py-20">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-10">
            <div
              className="motion-safe:animate-[rise_700ms_ease-out_both]"
              style={{ animationDelay: '120ms' }}
            >
              <LogoText
                className="gap-2 font-[var(--font-display)]"
                logoClassName="h-12 w-12"
                textClassName="text-2xl sm:text-3xl"
              />
            </div>

            <div
              className="space-y-4 motion-safe:animate-[rise_700ms_ease-out_both]"
              style={{ animationDelay: '220ms' }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Empieza hoy
              </p>
              <h1 className="text-4xl font-semibold sm:text-5xl font-[var(--font-display)]">
                Crea tu cuenta en minutos.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Un panel elegante, sin anuncios, con todo lo que necesitas para sentir claridad.
              </p>
            </div>

            <div
              className="grid gap-4 sm:grid-cols-3 motion-safe:animate-[rise_700ms_ease-out_both]"
              style={{ animationDelay: '320ms' }}
            >
              {REGISTER_HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-foreground/10 bg-background/70 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground/5 text-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>

            <div
              className="rounded-3xl border border-foreground/10 bg-background/80 p-6 shadow-soft-lg motion-safe:animate-[rise_700ms_ease-out_both]"
              style={{ animationDelay: '420ms' }}
            >
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Flujo guiado
              </div>
              <div className="mt-4 grid gap-3">
                {REGISTER_STEPS.map((step, index) => (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="relative motion-safe:animate-[rise_700ms_ease-out_both]"
            style={{ animationDelay: '260ms' }}
          >
            <Card className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-background/90 shadow-[0_40px_120px_-70px_rgba(15,23,42,0.7)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--accent-b)_0%,transparent_60%)] opacity-30" />
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="relative space-y-5 p-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                      Registro
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold font-[var(--font-display)]">
                      Crea tu cuenta
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Te tomará menos de un minuto.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      Nombre
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Tu nombre"
                      autoComplete="given-name"
                      className="h-11 rounded-2xl bg-background/80"
                      {...register('firstName')}
                      error={errors.firstName?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      className="h-11 rounded-2xl bg-background/80"
                      {...register('email')}
                      error={errors.email?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-11 rounded-2xl bg-background/80 pr-10"
                        {...register('password')}
                        error={errors.password?.message}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Fuerza: {strengthLabel}</span>
                        <span>{passwordScore}/4</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-foreground/10">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${strengthTone}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {passwordChecks.map((check) => (
                          <div
                            key={check.label}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${
                              check.valid ? 'text-emerald-600' : 'text-muted-foreground'
                            }`}
                          >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-foreground/10">
                              {check.valid ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                              )}
                            </span>
                            {check.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirmar contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-11 rounded-2xl bg-background/80 pr-10"
                        {...register('confirmPassword')}
                        error={errors.confirmPassword?.message}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="relative flex flex-col gap-4 px-8 pb-8">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full bg-[linear-gradient(135deg,var(--accent-a),var(--accent-b))] text-base font-semibold text-white shadow-[0_18px_40px_-22px_rgba(16,185,129,0.8)]"
                    isLoading={isSubmitting || registerMutation.isPending}
                    disabled={!allPasswordChecksValid}
                  >
                    Crear cuenta
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Al registrarte aceptas nuestros términos y política de privacidad.
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    ¿Ya tienes cuenta?{' '}
                    <Link
                      href="/auth/login"
                      className="font-semibold text-emerald-600 transition-colors hover:text-emerald-500"
                    >
                      Inicia sesión
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
