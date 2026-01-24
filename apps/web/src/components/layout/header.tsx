'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useLogout } from '@/hooks/use-auth';
import { useKeyboardShortcuts } from '@/contexts/keyboard-shortcuts-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, User, LogOut, Settings, Sun, Moon, ChevronDown, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { getInitials } from '@/lib/utils';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import { CurrencySelector } from '@/components/currency-selector';

export function Header() {
  const { user } = useAuthStore();
  const { toggle } = useSidebarStore();
  const { theme, setTheme } = useTheme();
  const { openCommandPalette } = useKeyboardShortcuts();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const initials = user?.name ? getInitials(user.name) : null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/40 bg-background/70 backdrop-blur-xl px-4 shadow-[0_8px_30px_-22px_rgba(15,23,42,0.25)] md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9 hover:bg-muted/50"
        onClick={toggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search button */}
      <Button
        variant="outline"
        onClick={openCommandPalette}
        className="hidden sm:flex items-center gap-2 h-9 px-3 text-muted-foreground hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Buscar...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Mobile search button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={openCommandPalette}
        className="sm:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Currency Selector */}
        <CurrencySelector compact className="w-[90px]" />

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>

        {/* Separator */}
        <div className="mx-1.5 h-6 w-px bg-border/50" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-9 gap-2 pl-2 pr-2.5 hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-7 w-7 ring-2 ring-background shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-semibold">
                  {initials || <User className="h-3.5 w-3.5" />}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-1.5" align="end" sideOffset={8}>
            <DropdownMenuLabel className="px-2 py-2.5">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-border/50">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold">
                    {initials || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold leading-none">{user?.name || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-[140px]">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem className="py-2 px-2 cursor-pointer rounded-md">
              <Settings className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="py-2 px-2 cursor-pointer rounded-md text-red-500 focus:text-red-500 focus:bg-red-500/10"
            >
              <LogOut className="mr-2.5 h-4 w-4" />
              <span className="text-sm">Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
