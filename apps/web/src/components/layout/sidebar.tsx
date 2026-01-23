'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  Tags,
  PiggyBank,
  FolderTree,
  Settings,
  X,
  FileBarChart,
  RefreshCw,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebarStore } from '@/stores/sidebar-store';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cuentas', href: '/dashboard/accounts', icon: Wallet },
  { name: 'Transacciones', href: '/dashboard/transactions', icon: ArrowUpDown },
  { name: 'Importar', href: '/dashboard/import', icon: Upload },
  { name: 'Recurrentes', href: '/dashboard/recurring', icon: RefreshCw },
  { name: 'Inversiones', href: '/dashboard/investments', icon: TrendingUp, badge: 'Beta' },
  { name: 'Categorías', href: '/dashboard/categories', icon: FolderTree },
  { name: 'Etiquetas', href: '/dashboard/tags', icon: Tags },
  { name: 'Presupuestos', href: '/dashboard/budgets', icon: PiggyBank },
  { name: 'Reportes', href: '/dashboard/reports', icon: FileBarChart },
];

const secondaryNavigation = [
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-background/95 backdrop-blur-xl border-r border-border/30',
          'transform transition-transform duration-300 ease-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center justify-between px-5 border-b border-border/30">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-sm">F</span>
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Finance</span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">Dashboard</span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={close}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium',
                      'transition-colors duration-150',
                      isActive
                        ? 'bg-foreground/5 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4', isActive && 'text-foreground')} />
                    <span className="flex-1">{item.name}</span>
                    {'badge' in item && item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-border/30">
              <div className="space-y-0.5">
                {secondaryNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={close}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium',
                        'transition-colors duration-150',
                        isActive
                          ? 'bg-foreground/5 text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border/30 p-4">
            <div className="flex items-center justify-center">
              <span className="text-[11px] text-muted-foreground/60">v1.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
