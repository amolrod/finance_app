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
import { ArrowLeft, Eye, EyeOff, Shield, Sparkles, Zap } from 'lucide-react';

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

      <main className="container mx-auto flex h-full items-center px-4 pb-10 pt-24">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:block space-y-6">
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
              <h1 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
                Tu panel te esperaba.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground">
                Retoma el control con un panel rápido, limpio y listo para tus próximas decisiones.
              </p>
            </div>

            <div
              className="flex flex-wrap gap-3 motion-safe:animate-[rise_700ms_ease-out_both]"
              style={{ animationDelay: '320ms' }}
            >
              {HIGHLIGHTS.slice(0, 2).map(({ icon: Icon, title }) => (
                <div
                  key={title}
                  className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  <Icon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  {title}
                </div>
              ))}
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
                <CardContent className="relative space-y-4 p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                      Inicia sesión
                    </p>
                    <h2 className="mt-1 text-xl font-semibold font-[var(--font-display)]">
                      Vuelve a tu cuenta
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
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
                      className="h-10 rounded-xl border-foreground/10 bg-background/80 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
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
                        className="h-10 rounded-xl border-foreground/10 bg-background/80 pr-10 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
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
                <CardFooter className="relative flex flex-col gap-3 px-6 pb-6">
                  <Button
                    type="submit"
                    size="default"
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
