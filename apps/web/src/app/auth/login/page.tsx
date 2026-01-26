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
import { ArrowLeft, BarChart3, Eye, EyeOff, Shield, Zap } from 'lucide-react';
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
  '--accent-a': '#2F9D8F',
  '--accent-b': '#3BA99C',
  '--accent-c': '#3A86C6',
  '--accent-d': '#C99D4A'
} as React.CSSProperties;

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: 'Datos protegidos',
    description: 'Cifrado y control total.'
  },
  {
    icon: Zap,
    title: 'Sincronización rápida',
    description: 'Movimientos en segundos.'
  },
  {
    icon: BarChart3,
    title: 'Panel limpio',
    description: 'Solo lo esencial y claro.'
  }
];

const LOGIN_BARS = [38, 54, 42, 60, 48, 66, 52, 70, 58, 76];

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
                Acceso seguro
              </p>
              <h1 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
                Tu panel te esperaba.
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Retoma el control con un panel rápido, limpio y listo para tus próximas decisiones.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div
                className="w-full max-w-[210px]"
                style={{ animationDelay: '260ms' }}
              >
                <Iphone>
                  <LoginPhoneScreen />
                </Iphone>
              </div>
              <div className="space-y-3 text-xs text-muted-foreground">
                {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 text-foreground/40" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-foreground/80">{title}</p>
                      <p>{description}</p>
                    </div>
                  </div>
                ))}
                <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/80 px-3 py-1 text-[11px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                  Última sincronización hace 2 min
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
                      Inicia sesión
                    </p>
                    <h2 className="mt-1 text-lg font-semibold font-[var(--font-display)]">
                      Vuelve a tu cuenta
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tus finanzas se sienten mejor aquí.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                    >
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
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                      >
                        Contraseña
                      </Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
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
                        {showPassword ? (
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
                    isLoading={isSubmitting || loginMutation.isPending}
                  >
                    Entrar
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    ¿Nuevo en FinanceApp?{' '}
                    <Link
                      href="/auth/register"
                      className="font-semibold text-primary transition-colors hover:text-primary/80"
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

function LoginPhoneScreen() {
  return (
    <div className="flex h-full w-full flex-col gap-3 bg-[#0f1115] px-4 py-5 text-white">
      <div className="flex items-center justify-between text-[10px] text-white/60">
        <span className="text-white/80">FinanceApp / Vista general</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-white/70">
          Live
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-[10px] text-white/60">
          <span>Balance total</span>
          <span className="text-success/70">+4.8%</span>
        </div>
        <p className="mt-1 text-[20px] font-semibold tracking-tight">€14,280</p>
        <div className="mt-3 flex h-16 items-end gap-1">
          {LOGIN_BARS.map((bar, index) => (
            <div
              key={`${bar}-${index}`}
              className="flex-1 rounded-full bg-gradient-to-t from-success/60 to-success/30"
              style={{ height: `${bar}%` }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-[10px]">
          <p className="text-white/50">Ingresos</p>
          <p className="mt-1 text-sm font-semibold text-white/90">€3,220</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-[10px]">
          <p className="text-white/50">Gastos</p>
          <p className="mt-1 text-sm font-semibold text-white/90">€1,840</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="text-[9px] text-white/50">Presupuesto</p>
        <div className="mt-2 space-y-2">
          <div className="rounded-lg bg-white/5 p-2">
            <div className="flex items-center justify-between text-[10px] text-white/60">
              <span>Necesidades</span>
              <span>72%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-success/50" />
            </div>
          </div>
          <div className="rounded-lg bg-white/5 p-2">
            <div className="flex items-center justify-between text-[10px] text-white/60">
              <span>Deseos</span>
              <span>41%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div className="h-full w-[41%] rounded-full bg-primary/40" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="text-[9px] text-white/50">Alertas suaves</p>
        <div className="mt-2 space-y-1.5 text-[10px] text-white/70">
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
            <span>Suscripciones</span>
            <span>3 activas</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
            <span>Meta ahorro</span>
            <span>89%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
