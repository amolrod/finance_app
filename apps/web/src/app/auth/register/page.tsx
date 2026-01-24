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
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { Iphone } from '@/components/ui/iphone';

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
      className={`${displayFont.variable} ${textFont.variable} h-screen overflow-hidden bg-background text-foreground font-[var(--font-text)]`}
      style={PAGE_STYLE}
    >
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-25 dark:opacity-25"
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

      <main className="container mx-auto flex h-full items-center px-4 pb-8 pt-24">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:flex flex-col gap-6">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Empieza hoy
              </p>
              <h1 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
                Crea tu cuenta en minutos.
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Un panel elegante, sin anuncios, con todo lo que necesitas para sentir claridad.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div
                className="w-full max-w-[210px]"
                style={{ animationDelay: '260ms' }}
              >
                <Iphone>
                  <RegisterPhoneScreen />
                </Iphone>
              </div>
              <div className="space-y-3 text-xs text-muted-foreground">
                {REGISTER_STEPS.map((step, index) => (
                  <div key={step.title} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-foreground/10 text-[10px] font-semibold text-foreground/70">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground/85">{step.title}</p>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
                <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/80 px-3 py-1 text-[11px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                  Listo para importar tus extractos
                </div>
              </div>
            </div>
          </div>

          <div
            className="relative motion-safe:animate-[rise_700ms_ease-out_both]"
            style={{ animationDelay: '260ms' }}
          >
            <Card className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-soft-lg">
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="relative space-y-3 p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                      Registro
                    </p>
                    <h2 className="mt-1 text-lg font-semibold font-[var(--font-display)]">
                      Crea tu cuenta
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Te tomará menos de un minuto.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Nombre
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Tu nombre"
                      autoComplete="given-name"
                      className="h-9 rounded-lg border-foreground/10 bg-background/90 focus-visible:ring-2 focus-visible:ring-foreground/15"
                      {...register('firstName')}
                      error={errors.firstName?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      className="h-9 rounded-lg border-foreground/10 bg-background/90 focus-visible:ring-2 focus-visible:ring-foreground/15"
                      {...register('email')}
                      error={errors.email?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-9 rounded-lg border-foreground/10 bg-background/90 pr-10 focus-visible:ring-2 focus-visible:ring-foreground/15"
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

                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Fuerza: {strengthLabel}</span>
                        <span>{passwordScore}/4</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-foreground/10">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${strengthTone}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
                        {passwordChecks.map((check) => (
                          <div
                            key={check.label}
                            className={`flex items-center gap-1.5 transition-colors ${
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
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                    >
                      Confirmar contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-9 rounded-lg border-foreground/10 bg-background/90 pr-10 focus-visible:ring-2 focus-visible:ring-foreground/15"
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

                <CardFooter className="relative flex flex-col gap-2 px-5 pb-5">
                  <Button
                    type="submit"
                    size="default"
                    className="h-10 w-full rounded-lg text-sm font-semibold"
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

function RegisterPhoneScreen() {
  return (
    <div className="flex h-full w-full flex-col gap-3 bg-[#0f1115] px-4 py-5 text-white">
      <div className="flex items-center justify-between text-[10px] text-white/60">
        <span className="text-white/80">FinanceApp / Alta rápida</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-white/70">
          Paso 1/3
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="text-[10px] text-white/60">Cuenta inicial</p>
        <p className="mt-1 text-sm font-semibold">Personal</p>
        <div className="mt-2 space-y-2 text-[10px] text-white/70">
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
            <span>Moneda</span>
            <span>EUR</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
            <span>Saldo inicial</span>
            <span>€0,00</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-[10px] text-white/60">
          <span>Categorías sugeridas</span>
          <span>3 listas</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] text-white/70">
          {['Comida', 'Hogar', 'Transporte', 'Ahorro', 'Ocio'].map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-[10px] text-white/60">
          <span>Presupuesto base</span>
          <span>Mensual</span>
        </div>
        <div className="mt-2 space-y-2 text-[10px] text-white/70">
          <div>
            <div className="flex items-center justify-between">
              <span>Necesidades</span>
              <span>50%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
              <div className="h-1.5 w-1/2 rounded-full bg-emerald-400/60" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span>Deseos</span>
              <span>30%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
              <div className="h-1.5 w-[30%] rounded-full bg-sky-400/60" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span>Ahorro</span>
              <span>20%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
              <div className="h-1.5 w-1/5 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
