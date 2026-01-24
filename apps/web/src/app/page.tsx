'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoText } from '@/components/logo';
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
  Github
} from 'lucide-react';

const TRUST_ITEMS = [
  { icon: Shield, label: 'Datos seguros' },
  { icon: Zap, label: 'Ultra rápido' },
  { icon: Star, label: 'Sin anuncios' }
];

const FEATURE_ITEMS = [
  {
    icon: CreditCard,
    title: 'Múltiples Cuentas',
    description: 'Gestiona cuentas bancarias, tarjetas, efectivo y criptomonedas en un solo lugar.'
  },
  {
    icon: PieChart,
    title: 'Categorías Inteligentes',
    description: 'Organiza gastos con categorías personalizables, colores e iconos únicos.'
  },
  {
    icon: BarChart3,
    title: 'Presupuestos',
    description: 'Establece límites mensuales por categoría y visualiza tu progreso en tiempo real.'
  },
  {
    icon: TrendingUp,
    title: 'Inversiones',
    description: 'Rastrea acciones, fondos y criptomonedas con precios actualizados automáticamente.'
  },
  {
    icon: Bell,
    title: 'Alertas Inteligentes',
    description: 'Recibe notificaciones cuando te acerques a tus límites de presupuesto.'
  },
  {
    icon: Shield,
    title: 'Precisión Total',
    description: 'Cálculos exactos con decimales. Nunca pierdas un céntimo por redondeo.'
  }
];

const STAT_ITEMS = [
  { value: '100%', label: 'Gratis, sin límites ocultos' },
  { value: '∞', label: 'Transacciones ilimitadas' },
  { value: '10+', label: 'Divisas soportadas' }
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
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl motion-safe:animate-pulse motion-safe:delay-1000" />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl motion-safe:animate-pulse motion-safe:delay-500" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <nav
          className="container mx-auto flex h-16 items-center justify-between px-4"
          aria-label="Navegación principal"
        >
          <LogoText />
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                Registrarse
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span>100% Gratis • Sin límites • Open Source</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Toma el control total de tus{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
                finanzas personales
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Rastrea gastos, gestiona presupuestos, controla inversiones y recibe alertas inteligentes.
              Todo en una aplicación moderna, segura y completamente gratuita.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register">
                <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Ver Características
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="relative rounded-xl border bg-gradient-to-b from-muted/50 to-muted p-2 shadow-2xl">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-lg" />
              <div className="relative overflow-hidden rounded-lg bg-background">
                {/* Mock Dashboard Preview */}
                <div className="grid grid-cols-3 gap-4 p-6">
                  {/* Balance Card */}
                  <div className="col-span-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white sm:col-span-1">
                    <p className="text-sm opacity-80">Balance Total</p>
                    <p className="text-3xl font-bold">€12,450.00</p>
                    <p className="mt-2 flex items-center text-sm text-emerald-100">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      +12.5% este mes
                    </p>
                  </div>
                  
                  {/* Income Card */}
                  <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                    <p className="text-2xl font-semibold text-emerald-600">+€3,200</p>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div className="h-2 w-3/4 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                  
                  {/* Expenses Card */}
                  <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Gastos</p>
                    <p className="text-2xl font-semibold text-red-500">-€1,850</p>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div className="h-2 w-1/2 rounded-full bg-red-500" />
                    </div>
                  </div>
                </div>

                {/* Chart placeholder */}
                <div
                  className="mx-6 mb-6 flex h-32 items-end justify-between gap-2 rounded-lg border bg-muted/30 p-4"
                  aria-hidden="true"
                >
                  {DASHBOARD_BARS.map((height, i) => (
                    <div
                      key={`bar-${i}`}
                      className="flex-1 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:opacity-80"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="scroll-mt-24 border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Todo lo que necesitas para{' '}
                <span className="text-emerald-600">gestionar tu dinero</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Herramientas potentes pero fáciles de usar, diseñadas para ayudarte
                a alcanzar tus metas financieras.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_ITEMS.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-t py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 text-center sm:grid-cols-3">
              {STAT_ITEMS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-4xl font-bold text-emerald-600">{stat.value}</p>
                  <p className="mt-2 text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing/CTA Section */}
        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-lg">
              <Card className="relative overflow-hidden border-emerald-500/50">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
                <CardContent className="relative p-8 text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600">
                    <Sparkles className="h-4 w-4" />
                    Siempre Gratis
                  </div>
                  
                  <h3 className="text-2xl font-bold">Plan Personal</h3>
                  
                  <div className="my-6">
                    <span className="text-5xl font-bold">€0</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>

                  <ul className="mb-8 space-y-3 text-left">
                    {PRICING_ITEMS.map((item) => (
                      <PricingItem key={item}>{item}</PricingItem>
                    ))}
                  </ul>

                  <Link href="/auth/register" className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                      Crear Cuenta Gratis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Empieza a controlar tus finanzas{' '}
              <span className="text-emerald-600">hoy</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Solo toma un minuto crear tu cuenta. Sin tarjeta de crédito requerida.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="mt-8 bg-emerald-600 hover:bg-emerald-700">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <LogoText />
            
            <div className="flex items-center gap-6">
              <ThemeToggle />
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} FinanceApp. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="group transition-all hover:border-emerald-500/50 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="mb-4 inline-flex rounded-lg bg-emerald-500/10 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function PricingItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
        <Check className="h-3 w-3 text-emerald-600" />
      </div>
      <span className="text-sm">{children}</span>
    </li>
  );
}
