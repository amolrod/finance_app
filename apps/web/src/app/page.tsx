'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  PieChart, 
  TrendingUp, 
  Shield,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">FinanceApp</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero */}
        <section className="py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Toma el control de tus{' '}
            <span className="text-primary">finanzas personales</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Rastrea gastos, gestiona presupuestos y haz crecer tus inversiones. 
            Todo en un solo lugar, con la precisión que tus finanzas merecen.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Ver Características
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <h2 className="text-center text-3xl font-bold">
            Todo lo que necesitas para gestionar tu dinero
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Wallet className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Múltiples Cuentas</CardTitle>
                <CardDescription>
                  Gestiona todas tus cuentas bancarias, tarjetas y efectivo en un solo lugar.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <PieChart className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Categorías Inteligentes</CardTitle>
                <CardDescription>
                  Organiza tus gastos con categorías personalizables y jerarquías.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Presupuestos</CardTitle>
                <CardDescription>
                  Establece límites de gasto y recibe alertas antes de excederlos.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Precisión Numérica</CardTitle>
                <CardDescription>
                  Cálculos exactos con decimales. Nunca pierdas un céntimo por redondeo.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold">
                Empieza a controlar tus finanzas hoy
              </h2>
              <p className="mx-auto mt-4 max-w-xl opacity-90">
                Únete a miles de usuarios que ya gestionan su dinero de forma inteligente.
                Es gratis y solo toma un minuto.
              </p>
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="mt-8">
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Personal Finance App. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
