'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Fraunces, Sora } from 'next/font/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoText } from '@/components/logo';
import { ArrowLeft, Eye, EyeOff, Shield, Sparkles, TrendingUp, Zap } from 'lucide-react';

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

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: 'Seguridad real',
    description: 'Tus datos cifrados, sin ruido.'
  },
  {
    icon: Zap,
    title: 'Fluido y veloz',
    description: 'Carga instantánea en cualquier pantalla.'
  },
  {
    icon: Sparkles,
    title: 'Sin distracciones',
    description: 'Panel limpio, foco en lo importante.'
  }
];

const LOGIN_STATS = [
  { label: 'Alertas activas', value: '3' },
  { label: 'Presupuesto', value: '72%' },
  { label: 'Ahorro semanal', value: '+€240' }
];

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: '¡Bienvenido!',
        description: 'Redirigiendo al dashboard...'
      });
      window.location.href = '/dashboard';
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error de autenticación',
        description: err?.response?.data?.message || 'Credenciales inválidas',
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
        <div className="absolute -top-20 right-0 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_top,var(--accent-a)_0%,transparent_70%)] opacity-60 blur-3xl motion-safe:animate-[drift_18s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_top,var(--accent-c)_0%,transparent_70%)] opacity-45 blur-3xl motion-safe:animate-[drift_22s_ease-in-out_infinite]" />
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

      <main className="container mx-auto flex h-full items-center px-4 pb-12 pt-24">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:block space-y-8 xl:space-y-10">
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
                Acceso seguro
              </p>
              <h1 className="text-4xl font-semibold sm:text-5xl font-[var(--font-display)]">
                Tu panel te esperaba.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Retoma el control con un panel rápido, limpio y listo para tus próximas decisiones.
              </p>
            </div>

            <div
              className="grid gap-4 sm:grid-cols-3 motion-safe:animate-[rise_700ms_ease-out_both]"
              style={{ animationDelay: '320ms' }}
            >
              {LOGIN_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-emerald-500/10 via-background/80 to-sky-500/10 p-4 shadow-soft"
                >
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            <div
              className="hidden xl:grid gap-4 sm:grid-cols-3 motion-safe:animate-[rise_700ms_ease-out_both]"
              style={{ animationDelay: '420ms' }}
            >
              {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-background/70 via-background/90 to-emerald-500/10 p-4"
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
              className="relative hidden xl:block motion-safe:animate-[rise_700ms_ease-out_both]"
              style={{ animationDelay: '520ms' }}
            >
              <div className="rounded-3xl border border-foreground/10 bg-gradient-to-br from-background/85 via-background/95 to-emerald-500/10 p-6 shadow-soft-lg">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Actividad reciente</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                    +8.4%
                  </span>
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">€12,450.00</p>
                <svg viewBox="0 0 200 70" className="mt-4 h-20 w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="loginTrend" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                    <linearGradient id="loginFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 58 L22 54 L44 44 L66 48 L88 40 L110 28 L132 34 L154 24 L176 28 L200 18"
                    fill="none"
                    stroke="url(#loginTrend)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0 58 L22 54 L44 44 L66 48 L88 40 L110 28 L132 34 L154 24 L176 28 L200 18 L200 70 L0 70 Z"
                    fill="url(#loginFill)"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="relative motion-safe:animate-[rise_700ms_ease-out_both]"
            style={{ animationDelay: '260ms' }}
          >
            <Card className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-background/92 shadow-[0_40px_120px_-70px_rgba(15,23,42,0.7)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--accent-a)_0%,transparent_58%)] opacity-35" />
              <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(20,184,166,0.12),transparent)]" />
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="relative space-y-5 p-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                      Inicia sesión
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold font-[var(--font-display)]">
                      Vuelve a tu cuenta
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Tus finanzas se sienten mejor aquí.
                    </p>
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
                      className="h-11 rounded-2xl border-foreground/10 bg-background/80 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
                      {...register('email')}
                      error={errors.email?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Contraseña
                      </Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-500"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-11 rounded-2xl border-foreground/10 bg-background/80 pr-10 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
                        {...register('password')}
                        error={errors.password?.message}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? (
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
                    className="w-full rounded-full bg-[linear-gradient(135deg,var(--accent-a),var(--accent-b))] text-base font-semibold text-white shadow-[0_20px_40px_-22px_rgba(16,185,129,0.9)]"
                    isLoading={isSubmitting || loginMutation.isPending}
                  >
                    Entrar
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    ¿Nuevo en FinanceApp?{' '}
                    <Link
                      href="/auth/register"
                      className="font-semibold text-emerald-600 transition-colors hover:text-emerald-500"
                    >
                      Crea tu cuenta
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
