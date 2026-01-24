'use client';

import Link from 'next/link';
import { Fraunces, Sora } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoText } from '@/components/logo';
import { MacbookScroll } from '@/components/landing/macbook-scroll';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  PieChart,
  Shield,
  Bell,
  CreditCard,
  BarChart3,
  Zap,
  Check,
  Star,
  Github,
  Radar,
  Globe,
  ScanLine,
  LineChart
} from 'lucide-react';

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
  '--accent-c': '#f59e0b',
  '--accent-d': '#22c55e',
  '--accent-e': '#0ea5e9'
} as React.CSSProperties;

const HERO_STATS = [
  { value: '€0', label: 'Siempre gratis' },
  { value: '0 anuncios', label: 'Experiencia limpia' },
  { value: '100% abierto', label: 'Código abierto' }
];

const MARQUEE_ITEMS = [
  'Cuentas ilimitadas',
  'Categorías inteligentes',
  'Presupuestos vivos',
  'Inversiones claras',
  'Alertas suaves',
  'Importación de extractos',
  'Multi-divisa',
  'Precisión de céntimos'
];

const FEATURE_TILES = [
  {
    icon: Radar,
    title: 'Radar de gastos',
    description: 'Detecta picos y fugas con comparativas mensuales y etiquetas claras.',
    className: 'lg:col-span-4 lg:row-span-2',
    accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    highlight: true
  },
  {
    icon: CreditCard,
    title: 'Cuentas sin fricción',
    description: 'Banco, tarjeta, efectivo y cripto en el mismo panel.',
    className: 'lg:col-span-2',
    accent: 'from-teal-500/15 to-transparent'
  },
  {
    icon: BarChart3,
    title: 'Presupuestos vivos',
    description: 'Límites por categoría con progreso en tiempo real.',
    className: 'lg:col-span-2',
    accent: 'from-amber-500/20 to-transparent'
  },
  {
    icon: TrendingUp,
    title: 'Inversiones claras',
    description: 'Acciones, fondos y cripto con evolución visual.',
    className: 'lg:col-span-3',
    accent: 'from-sky-500/20 to-transparent'
  },
  {
    icon: Bell,
    title: 'Alertas suaves',
    description: 'Notificaciones cuando importa, sin ruido extra.',
    className: 'lg:col-span-3',
    accent: 'from-lime-500/20 to-transparent'
  },
  {
    icon: Globe,
    title: 'Multi-divisa',
    description: 'Registra gastos en distintas monedas sin perder precisión.',
    className: 'lg:col-span-2',
    accent: 'from-emerald-400/20 to-transparent'
  }
];

const FLOW_STEPS = [
  {
    icon: ScanLine,
    title: 'Importa en segundos',
    description: 'Arrastra extractos o registra gastos al vuelo.'
  },
  {
    icon: PieChart,
    title: 'Clasifica con color',
    description: 'Categorías visuales que hacen sentido al instante.'
  },
  {
    icon: LineChart,
    title: 'Decide con claridad',
    description: 'Informes simples que muestran qué ajustar.'
  }
];

const TRUST_ITEMS = [
  { icon: Shield, label: 'Transparencia de código abierto' },
  { icon: Zap, label: 'Rápido en cualquier dispositivo' },
  { icon: Star, label: 'Sin anuncios, sin ruido' }
];

const PRICING_ITEMS = [
  'Cuentas ilimitadas',
  'Transacciones ilimitadas',
  'Categorías personalizadas',
  'Presupuestos y alertas',
  'Seguimiento de inversiones',
  'Importación de extractos',
  'Multi-divisa',
  'Sin anuncios'
];

const DASHBOARD_BARS = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];

export default function HomePage() {
  const marqueeItems = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div
      className={`${displayFont.variable} ${textFont.variable} min-h-screen bg-background text-foreground font-[var(--font-text)]`}
      style={PAGE_STYLE}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 right-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_top,var(--accent-a)_0%,transparent_65%)] opacity-70 blur-3xl motion-safe:animate-[drift_18s_ease-in-out_infinite]" />
        <div className="absolute left-[-10%] top-1/3 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_top,var(--accent-c)_0%,transparent_70%)] opacity-50 blur-3xl motion-safe:animate-[drift_22s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-1/4 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_top,var(--accent-e)_0%,transparent_70%)] opacity-40 blur-3xl motion-safe:animate-[drift_26s_ease-in-out_infinite]" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40 dark:opacity-30"
          style={{ maskImage: 'radial-gradient(circle at top, black, transparent 70%)' }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <nav
          className="container mx-auto flex h-16 items-center justify-between px-4"
          aria-label="Navegación principal"
        >
          <LogoText
            className="gap-2 font-[var(--font-display)]"
            logoClassName="h-9 w-9 sm:h-10 sm:w-10"
            textClassName="hidden sm:inline-flex text-lg sm:text-2xl"
          />

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-[12px] font-semibold sm:text-sm">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                size="sm"
                className="relative overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--accent-a),var(--accent-b))] px-4 text-[12px] font-semibold text-white shadow-[0_12px_30px_-18px_rgba(16,185,129,0.85)] transition-transform duration-300 hover:-translate-y-0.5 sm:px-5 sm:text-sm"
              >
                <span className="relative z-10">Crear cuenta</span>
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="container mx-auto px-4 py-16 sm:py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600 motion-safe:animate-[rise_700ms_ease-out_both]"
                style={{ animationDelay: '100ms' }}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Open Source · Gratis · Sin anuncios
              </div>

              <h1
                className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl xl:text-7xl font-[var(--font-display)] motion-safe:animate-[rise_750ms_ease-out_both]"
                style={{ animationDelay: '200ms' }}
              >
                Finanzas sin fricción,
                <span className="block bg-[linear-gradient(120deg,var(--accent-a),var(--accent-b),var(--accent-c))] bg-clip-text text-transparent">
                  claridad que se nota.
                </span>
              </h1>

              <p
                className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl motion-safe:animate-[rise_800ms_ease-out_both]"
                style={{ animationDelay: '320ms' }}
              >
                Rastrea gastos, presupuestos e inversiones con un panel rápido, bello y sin ruido.
                Todo lo importante, al frente.
              </p>

              <div
                className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center motion-safe:animate-[rise_850ms_ease-out_both]"
                style={{ animationDelay: '440ms' }}
              >
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="group relative w-full overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--accent-a),var(--accent-b))] px-8 text-base font-semibold text-white shadow-[0_18px_50px_-22px_rgba(16,185,129,0.8)] transition-transform duration-300 hover:-translate-y-0.5 sm:w-auto"
                  >
                    <span className="relative z-10">Crear cuenta gratis</span>
                    <ArrowRight className="relative z-10 ml-2 h-4 w-4" />
                    <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.4),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full border-foreground/20 bg-background/80 text-base font-semibold shadow-soft hover:bg-foreground/5 sm:w-auto"
                  >
                    Ver el mapa
                  </Button>
                </Link>
              </div>

              <p
                className="mt-4 text-sm text-muted-foreground motion-safe:animate-[rise_900ms_ease-out_both]"
                style={{ animationDelay: '560ms' }}
              >
                Sin tarjeta de crédito. Configuración en minutos.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {HERO_STATS.map((stat, index) => (
                  <StatPill key={stat.label} value={stat.value} label={stat.label} delay={index * 120} />
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="relative motion-safe:animate-[rise_900ms_ease-out_both]"
              style={{ animationDelay: '260ms' }}
            >
              <HeroVisual />
            </div>
          </div>
        </section>

        <section className="border-y border-foreground/10 bg-background/60">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 py-6">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Incluye
              </span>
              <div className="relative flex-1 overflow-hidden">
                <p className="sr-only">{MARQUEE_ITEMS.join(', ')}</p>
                <div
                  className="flex min-w-[200%] gap-3 motion-safe:animate-[marquee_26s_linear_infinite]"
                  aria-hidden="true"
                >
                  {marqueeItems.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="inline-flex items-center rounded-full border border-foreground/10 bg-background/70 px-4 py-1 text-sm text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Mapa de control
              </p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
                Un panel que se lee como un mapa.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Cada módulo tiene su lugar, con datos claros y acciones rápidas.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-6 lg:auto-rows-[220px]">
              {FEATURE_TILES.map((feature, index) => (
                <FeatureTile
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  className={feature.className}
                  accent={feature.accent}
                  delay={index * 120}
                >
                  {feature.highlight ? <FeaturePreview /> : null}
                </FeatureTile>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 -skew-y-2 bg-muted/40" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--accent-e)_0%,transparent_70%)] opacity-30" aria-hidden="true" />
          <div className="container relative mx-auto px-4">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Flujo simple
              </p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
                Tres movimientos, cero drama.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Importa, ordena y decide con un panel que te habla claro.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {FLOW_STEPS.map((step, index) => (
                <ProcessCard
                  key={step.title}
                  icon={step.icon}
                  title={step.title}
                  description={step.description}
                  step={index + 1}
                  delay={index * 140}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="relative py-6">
          <MacbookScroll
            density="compact"
            title="Todo el estado, en un solo recorrido."
            subtitle="El panel responde al scroll para mostrar saldos, tendencias y alertas sin perder contexto."
          >
            <HomeMacbookScreen />
          </MacbookScroll>
        </section>

        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Precio claro
                </p>
                <h2 className="mt-4 text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
                  Una sola decisión: empezar.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Todo lo esencial, sin límites ocultos. Solo un plan, todo incluido.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="rounded-3xl border border-foreground/10 bg-background/70 p-6 shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                        <Shield className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">Tu control, tu ritmo</p>
                        <p className="text-sm text-muted-foreground">
                          Transparencia total con código abierto.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                      <div
                        key={`pricing-${label}`}
                        className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background/70 p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground/5 text-foreground">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-medium">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Card className="relative overflow-hidden border-foreground/10 bg-background/90 shadow-[0_40px_120px_-70px_rgba(15,23,42,0.7)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--accent-a)_0%,transparent_65%)] opacity-30" />
                <CardContent className="relative p-8">
                  <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Plan personal
                  </div>
                  <div className="mt-6 flex items-end gap-3">
                    <span className="text-5xl font-semibold font-[var(--font-display)]">€0</span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Sin tarjeta, sin límites, sin sorpresas.
                  </p>

                  <ul className="mt-6 space-y-3">
                    {PRICING_ITEMS.map((item) => (
                      <PricingItem key={item}>{item}</PricingItem>
                    ))}
                  </ul>

                  <Link href="/auth/register" className="mt-8 block">
                    <Button
                      size="lg"
                      className="w-full rounded-full bg-[linear-gradient(135deg,var(--accent-a),var(--accent-b))] text-base font-semibold text-white shadow-[0_18px_40px_-22px_rgba(16,185,129,0.8)]"
                    >
                      Crear cuenta gratis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-[36px] border border-foreground/10 bg-background/80 p-10 text-center shadow-soft-lg">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,var(--accent-a),var(--accent-e),var(--accent-c))] opacity-[0.08]" />
              <div className="relative">
                <h2 className="text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
                  Tu próxima mejor decisión financiera está a un clic.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                  Entra, ordena tu dinero y empieza a ver claridad desde el primer día.
                </p>
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="mt-8 rounded-full bg-[linear-gradient(135deg,var(--accent-a),var(--accent-b))] px-10 text-base font-semibold text-white shadow-[0_18px_40px_-22px_rgba(16,185,129,0.8)]"
                  >
                    Empezar ahora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground/10 bg-background/80 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <LogoText
                className="gap-2 font-[var(--font-display)]"
                logoClassName="h-9 w-9"
                textClassName="text-xl"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Hecho para que tus finanzas respiren.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/landing-lab">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-foreground/15 bg-background/80 text-[12px] font-semibold"
                >
                  Landing experimental
                </Button>
              </Link>
              <ThemeToggle />
              <a
                href="https://github.com/amolrod/finance_app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-foreground/10 pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} FinanceApp. Todos los derechos reservados.</p>
            <p className="mt-2">Hecho con foco y diseño, para mejores decisiones.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div
        className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_top,var(--accent-b)_0%,transparent_70%)] opacity-60 blur-3xl motion-safe:animate-[drift_16s_ease-in-out_infinite]"
        aria-hidden="true"
      />
      <div
        className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_top,var(--accent-c)_0%,transparent_70%)] opacity-50 blur-3xl motion-safe:animate-[drift_20s_ease-in-out_infinite]"
        aria-hidden="true"
      />

      <div className="relative rounded-[32px] border border-foreground/10 bg-background/80 p-6 shadow-[0_40px_120px_-70px_rgba(15,23,42,0.7)] backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Resumen de hoy
            </p>
            <p className="mt-3 text-3xl font-semibold text-foreground">€12,450.00</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              +12.5% este mes
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-foreground/10 bg-background/70 p-3">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="mt-2 text-lg font-semibold text-emerald-600">+€3,200</p>
          </div>
          <div className="rounded-2xl border border-foreground/10 bg-background/70 p-3">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="mt-2 text-lg font-semibold text-rose-500">-€1,850</p>
          </div>
          <div className="rounded-2xl border border-foreground/10 bg-background/70 p-3">
            <p className="text-xs text-muted-foreground">Ahorro</p>
            <p className="mt-2 text-lg font-semibold text-foreground">€980</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-foreground/10 bg-muted/40 p-4">
          <div className="flex h-28 items-end gap-2" aria-hidden="true">
            {DASHBOARD_BARS.map((height, index) => (
              <div
                key={`hero-bar-${index}`}
                className="flex-1 rounded-full bg-gradient-to-t from-emerald-600/80 to-emerald-400/70"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Actividad</span>
            <span>Últimos 30 días</span>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-12 w-48 rounded-2xl border border-foreground/10 bg-background/90 p-4 shadow-lg backdrop-blur motion-safe:animate-[float-reverse_9s_ease-in-out_infinite]">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Presupuesto</span>
          <span className="font-semibold text-emerald-600">72%</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-12 w-12 rounded-full bg-[conic-gradient(var(--accent-b)_0deg_260deg,rgba(148,163,184,0.35)_260deg_360deg)] p-[3px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground">
              72%
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">€860</p>
            <p className="text-xs text-muted-foreground">de €1,200</p>
          </div>
        </div>
      </div>

      <div className="absolute -left-4 bottom-6 w-56 rounded-2xl border border-foreground/10 bg-background/90 p-4 shadow-lg backdrop-blur motion-safe:animate-[float_8s_ease-in-out_infinite]">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Inversiones</p>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            +5.3%
          </span>
        </div>
        <svg
          viewBox="0 0 120 40"
          className="mt-3 h-10 w-full"
          aria-hidden="true"
        >
          <path
            d="M0 30 L18 22 L36 26 L54 18 L72 20 L90 10 L120 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-emerald-500"
          />
          <circle cx="90" cy="10" r="4" className="fill-emerald-500" />
        </svg>
      </div>
    </div>
  );
}

function FeaturePreview() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-foreground/10 bg-background/70 p-4">
        <p className="text-xs text-muted-foreground">Fuga detectada</p>
        <p className="mt-2 text-xl font-semibold text-foreground">-€124</p>
        <p className="text-xs text-rose-500">Hoy, 16:30</p>
      </div>
      <div className="rounded-2xl border border-foreground/10 bg-background/70 p-4">
        <p className="text-xs text-muted-foreground">Categoría más alta</p>
        <p className="mt-2 text-xl font-semibold text-foreground">Comida</p>
        <p className="text-xs text-muted-foreground">26% del mes</p>
      </div>
      <div className="sm:col-span-2 grid gap-4 sm:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-2xl border border-foreground/10 bg-background/70 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tendencia mensual</span>
            <span className="font-medium text-emerald-600">+8.4%</span>
          </div>
          <svg
            viewBox="0 0 200 70"
            className="mt-4 h-16 w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="featureTrendLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
              <linearGradient id="featureTrendFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 60 L24 54 L48 44 L72 48 L96 38 L120 28 L144 34 L168 22 L200 26"
              fill="none"
              stroke="url(#featureTrendLine)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M0 60 L24 54 L48 44 L72 48 L96 38 L120 28 L144 34 L168 22 L200 26 L200 70 L0 70 Z"
              fill="url(#featureTrendFill)"
            />
          </svg>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Semana 1</span>
            <span>Semana 4</span>
          </div>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-background/70 p-4">
          <p className="text-xs text-muted-foreground">Gasto por categoría</p>
          <div className="mt-4 flex items-center gap-3">
            <div
              className="relative h-16 w-16 rounded-full bg-[conic-gradient(var(--accent-a)_0deg_140deg,var(--accent-c)_140deg_250deg,var(--accent-e)_250deg_360deg)]"
              aria-hidden="true"
            >
              <div className="absolute inset-2 rounded-full bg-background" />
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Comida 32%
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Hogar 28%
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Viajes 18%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeMacbookScreen() {
  return (
    <div className="flex h-full w-full flex-col bg-[#0f1115] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[10px] text-white/60">
        <span className="text-white/80">FinanceApp / Vista general</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5">Live</span>
      </div>
      <div className="flex flex-1 gap-3 p-4">
        <div className="flex-1 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/50">Balance total</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-semibold">€14,280</span>
              <span className="text-xs text-emerald-300/80">+4.8%</span>
            </div>
            <div className="mt-4 flex h-20 items-end gap-1">
              {DASHBOARD_BARS.slice(0, 10).map((height, index) => (
                <div
                  key={`screen-bar-${index}`}
                  className="flex-1 rounded-full bg-gradient-to-t from-emerald-500/70 to-emerald-300/40"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-[11px]">
              <p className="text-white/50">Ingresos</p>
              <p className="mt-2 text-lg font-semibold text-white/90">€3,220</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-[11px]">
              <p className="text-white/50">Gastos</p>
              <p className="mt-2 text-lg font-semibold text-white/90">€1,840</p>
            </div>
          </div>
        </div>
        <div className="w-[38%] space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/50">Presupuesto</p>
            <div className="mt-3 rounded-lg bg-white/5 p-3">
              <div className="flex items-center justify-between text-[10px] text-white/60">
                <span>Necesidades</span>
                <span>72%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-emerald-400/60" />
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-white/5 p-3">
              <div className="flex items-center justify-between text-[10px] text-white/60">
                <span>Deseos</span>
                <span>41%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div className="h-full w-[41%] rounded-full bg-blue-400/50" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/50">Alertas suaves</p>
            <div className="mt-3 space-y-2 text-[10px] text-white/70">
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
                <span>Suscripciones</span>
                <span>3 activas</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
                <span>Meta ahorro</span>
                <span>89%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
                <span>Inversiones</span>
                <span>+2.1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  description,
  className,
  accent,
  delay = 0,
  children
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  accent: string;
  delay?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-foreground/10 bg-background/80 p-6 shadow-soft transition-transform duration-500 hover:-translate-y-1 ${className ?? ''} motion-safe:animate-[rise_800ms_ease-out_both]`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-70 transition-opacity duration-500 group-hover:opacity-100`}
        aria-hidden="true"
      />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 text-foreground">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {children}
      </div>
    </div>
  );
}

function ProcessCard({
  icon: Icon,
  title,
  description,
  step,
  delay = 0
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  step: number;
  delay?: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-foreground/10 bg-background/90 p-6 shadow-soft transition-transform duration-500 hover:-translate-y-1 motion-safe:animate-[rise_700ms_ease-out_both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute right-4 top-4 text-5xl font-semibold text-foreground/10 font-[var(--font-display)]">
        0{step}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 text-foreground">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PricingItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
        <Check className="h-3 w-3 text-emerald-600" />
      </div>
      <span className="text-sm text-foreground">{children}</span>
    </li>
  );
}

function StatPill({
  value,
  label,
  delay = 0
}: {
  value: string;
  label: string;
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl border border-foreground/10 bg-background/70 p-4 shadow-soft motion-safe:animate-[rise_700ms_ease-out_both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
