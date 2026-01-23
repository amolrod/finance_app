'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useGlobalSearch, SearchResult } from '@/hooks/use-search';
import {
  Wallet,
  CreditCard,
  ArrowUpDown,
  FolderTree,
  PiggyBank,
  Tag,
  Search,
  Settings,
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  wallet: Wallet,
  'credit-card': CreditCard,
  'arrow-up-down': ArrowUpDown,
  folder: FolderTree,
  'pie-chart': PiggyBank,
  tag: Tag,
  'plus-circle': ArrowUpCircle,
  'minus-circle': ArrowDownCircle,
  transfer: RefreshCw,
};

// Quick actions for navigation
const quickActions = [
  { name: 'Dashboard', icon: LayoutDashboard, url: '/dashboard', keywords: ['inicio', 'home', 'panel'] },
  { name: 'Transacciones', icon: Receipt, url: '/dashboard/transactions', keywords: ['gastos', 'movimientos'] },
  { name: 'Cuentas', icon: Wallet, url: '/dashboard/accounts', keywords: ['banco', 'tarjeta'] },
  { name: 'Presupuestos', icon: PiggyBank, url: '/dashboard/budgets', keywords: ['budget', 'limite'] },
  { name: 'Categorías', icon: FolderTree, url: '/dashboard/categories', keywords: ['category'] },
  { name: 'Inversiones', icon: TrendingUp, url: '/dashboard/investments', keywords: ['portfolio', 'acciones'] },
  { name: 'Configuración', icon: Settings, url: '/dashboard/settings', keywords: ['ajustes', 'perfil'] },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = React.useState('');
  const [debouncedQuery] = useDebounce(inputValue, 300);

  const { data: searchResults, isLoading } = useGlobalSearch(debouncedQuery, open);

  // Reset input when dialog closes
  React.useEffect(() => {
    if (!open) {
      setInputValue('');
    }
  }, [open]);

  const handleSelect = React.useCallback(
    (url: string) => {
      onOpenChange(false);
      router.push(url);
    },
    [router, onOpenChange]
  );

  const getIconComponent = (result: SearchResult): React.ElementType => {
    if (result.icon && iconMap[result.icon]) {
      return iconMap[result.icon];
    }
    
    switch (result.type) {
      case 'transaction':
        const txType = result.metadata?.type as string;
        if (txType === 'INCOME') return ArrowUpCircle;
        if (txType === 'EXPENSE') return ArrowDownCircle;
        return RefreshCw;
      case 'account':
        return Wallet;
      case 'category':
        return FolderTree;
      case 'budget':
        return PiggyBank;
      case 'tag':
        return Tag;
      default:
        return Search;
    }
  };

  const getTypeLabel = (type: SearchResult['type']): string => {
    switch (type) {
      case 'transaction':
        return 'Transacciones';
      case 'account':
        return 'Cuentas';
      case 'category':
        return 'Categorías';
      case 'budget':
        return 'Presupuestos';
      case 'tag':
        return 'Etiquetas';
    }
  };

  // Group results by type
  const groupedResults = React.useMemo(() => {
    if (!searchResults?.results) return {};
    return searchResults.results.reduce(
      (acc, result) => {
        if (!acc[result.type]) acc[result.type] = [];
        acc[result.type].push(result);
        return acc;
      },
      {} as Record<string, SearchResult[]>
    );
  }, [searchResults]);

  const hasResults = searchResults && searchResults.results.length > 0;
  const showQuickActions = !inputValue || inputValue.length < 2;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar transacciones, cuentas, categorías..."
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        {isLoading && inputValue.length >= 2 && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Buscando...
          </div>
        )}

        {!isLoading && inputValue.length >= 2 && !hasResults && (
          <CommandEmpty>
            No se encontraron resultados para "{inputValue}"
          </CommandEmpty>
        )}

        {/* Quick Actions - shown when no search query */}
        {showQuickActions && (
          <CommandGroup heading="Navegación rápida">
            {quickActions.map((action) => (
              <CommandItem
                key={action.url}
                value={`${action.name} ${action.keywords.join(' ')}`}
                onSelect={() => handleSelect(action.url)}
                className="gap-2"
              >
                <action.icon className="h-4 w-4 text-muted-foreground" />
                <span>{action.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Search Results */}
        {hasResults && (
          <>
            {Object.entries(groupedResults).map(([type, results], index) => (
              <React.Fragment key={type}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={getTypeLabel(type as SearchResult['type'])}>
                  {results.map((result) => {
                    const Icon = getIconComponent(result);
                    return (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={`${result.title} ${result.subtitle || ''}`}
                        onSelect={() => handleSelect(result.url)}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
