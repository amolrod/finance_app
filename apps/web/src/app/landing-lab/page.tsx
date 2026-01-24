'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Space_Grotesk, Sora } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { LogoText } from '@/components/logo';
import { MacbookScroll } from '@/components/landing/macbook-scroll';
import { ArrowRight, Shield, Sparkles, Timer, Wallet, Radar, LineChart, ShieldCheck } from 'lucide-react';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const bodyFont = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
});

const PAGE_STYLE: CSSProperties = {
  '--paper': '#f6f2ea',
  '--ink': '#111827',
  '--accent-1': '#0f766e',
  '--accent-2': '#c2410c',
  '--accent-3': '#1d4ed8',
};

const FEATURE_ITEMS = [
  {
    icon: Radar,
    title: 'Foco por defecto',
    description: 'Paneles limpios que enseñan solo lo que mueve tu balance.',
  },
  {
    icon: Wallet,
    title: 'Cuenta a cuenta',
    description: 'Desglosa activos, tarjetas y efectivo con contexto real.',
  },
  {
    icon: LineChart,
    title: 'Ritmo mensual',
    description: 'Tendencias claras, alertas suaves y acciones inmediatas.',
  },
];

const STATS = [
  { label: 'Tiempo medio de setup', value: '7 min' },
  { label: 'Transacciones al mes', value: 'Sin limite' },
  { label: 'Exportaciones', value: '1 click' },
];

const BARS = [28, 54, 40, 65, 52, 70, 58, 78, 62, 85, 68, 74];

export default function LandingLabPage() {
  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[#f6f2ea] text-[#111827] font-[var(--font-body)]`}
      style={PAGE_STYLE}
    >
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_top,var(--accent-1)_0%,transparent_70%)] opacity-15 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle_at_top,var(--accent-2)_0%,transparent_70%)] opacity-10 blur-3xl" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle,rgba(17,24,39,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-30"
          style={{ maskImage: 'radial-gradient(circle at top, black, transparent 70%)' }}
        />
      </div>

      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f6f2ea]/80 backdrop-blur-xl">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <LogoText className="gap-2 font-[var(--font-display)]" textClassName="text-lg" />
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="rounded-full bg-[#111827] text-white hover:bg-black">
                Crear cuenta
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-4 pb-10 pt-16 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-600">
                <Sparkles className="h-4 w-4" />
                Finanzas con calma
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl font-[var(--font-display)]">
                Tu dinero en foco,
                <span className="block text-neutral-500">sin ruido ni drama.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-neutral-600 sm:text-lg">
                FinanceApp ordena cuentas, gastos e inversiones con un panel que respira. Menos
                brillo, mas claridad, mejores decisiones.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/auth/register">
                  <Button size="lg" className="rounded-full bg-[#111827] text-white hover:bg-black">
                    Empezar gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button variant="outline" size="lg" className="rounded-full border-black/15 bg-white/70">
                    Ver demo en scroll
                  </Button>
                </Link>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {STATS.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-soft">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{stat.label}</p>
                    <p className="mt-2 text-lg font-semibold text-neutral-800">{stat.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="relative"
            >
              <div className="rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-soft-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Balance total</p>
                    <p className="mt-2 text-3xl font-semibold text-neutral-900">€14,280</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 text-neutral-700">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Ritmo mensual</span>
                    <span className="text-neutral-700">+4.8%</span>
                  </div>
                  <div className="mt-3 flex h-20 items-end gap-1">
                    {BARS.map((height, index) => (
                      <div
                        key={`hero-bar-${index}`}
                        className="flex-1 rounded-full bg-[linear-gradient(180deg,#0f766e,#0f766e66)]"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-black/10 bg-white/70 p-3">
                    <p className="text-xs text-neutral-500">Gastos fijos</p>
                    <p className="mt-2 text-lg font-semibold text-neutral-800">€1,420</p>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-white/70 p-3">
                    <p className="text-xs text-neutral-500">Inversiones</p>
                    <p className="mt-2 text-lg font-semibold text-neutral-800">€8,120</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="demo" className="relative pb-8 pt-8">
          <MacbookScroll
            title="El tablero se despliega contigo."
            subtitle="Desliza para ver como FinanceApp revela el contexto correcto en el momento justo."
            badge={
              <div className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-neutral-600">
                Demo interactivo
              </div>
            }
          >
            <DashboardScreen />
          </MacbookScroll>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-6 lg:grid-cols-3">
            {FEATURE_ITEMS.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-soft"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5 text-neutral-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <div className="rounded-[36px] border border-black/10 bg-[#111827] px-8 py-12 text-white shadow-soft-lg">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  <ShieldCheck className="h-4 w-4" />
                  Datos claros
                </div>
                <h2 className="mt-5 text-3xl font-semibold sm:text-4xl font-[var(--font-display)]">
                  Una vista que ordena la mente.
                </h2>
                <p className="mt-4 text-sm text-white/70">
                  Dashboard, cuentas, presupuestos e inversiones en un mismo hilo visual.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
                  <div className="flex items-center gap-2 text-white/80">
                    <Timer className="h-4 w-4" />
                    Configuracion rapida, sin curvas.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
                  <div className="flex items-center gap-2 text-white/80">
                    <Shield className="h-4 w-4" />
                    Sin anuncios, sin distracciones.
                  </div>
                </div>
                <Link href="/auth/register">
                  <Button size="lg" className="mt-2 rounded-full bg-white text-black hover:bg-white/90">
                    Crear cuenta gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-[#f6f2ea]/80 py-10">
        <div className="container mx-auto flex flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center">
          <div>
            <LogoText className="gap-2 font-[var(--font-display)]" textClassName="text-lg" />
            <p className="mt-2 text-sm text-neutral-600">Landing experimental para FinanceApp.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full border-black/15 bg-white/80">
                Volver al sitio principal
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="rounded-full bg-[#111827] text-white hover:bg-black">
                Crear cuenta
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="flex h-full w-full flex-col bg-[#0f1115] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[10px] text-white/60">
        <span className="text-white/80">FinanceApp · Control diario</span>
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
              {BARS.slice(0, 10).map((height, index) => (
                <div
                  key={`screen-bar-${index}`}
                  className="flex-1 rounded-full bg-[linear-gradient(180deg,#0f766e,#0f766e55)]"
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
