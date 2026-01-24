'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AlertProvider } from '@/components/alerts/alert-system';
import { KeyboardShortcutsProvider } from '@/contexts/keyboard-shortcuts-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <KeyboardShortcutsProvider>
      <AlertProvider>
        <div className="min-h-screen bg-background">
          <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12)_0%,transparent_68%)] blur-3xl" />
            <div className="absolute bottom-[-15%] left-[-10%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12)_0%,transparent_70%)] blur-3xl" />
            <div
              className="absolute inset-0 bg-[radial-gradient(circle,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-35"
              style={{ maskImage: 'radial-gradient(circle at top, black, transparent 70%)' }}
            />
          </div>
          <Sidebar />
          <div className="lg:pl-72">
            <Header />
            <main className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
              {children}
            </main>
          </div>
        </div>
      </AlertProvider>
    </KeyboardShortcutsProvider>
  );
}
