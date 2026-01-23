'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CommandPalette } from '@/components/command-palette';

interface KeyboardShortcutsContextValue {
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

const KeyboardShortcutsContext = React.createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcuts() {
  const context = React.useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Command/Ctrl + K - Open command palette
      if (modKey && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Escape - Close command palette (handled by dialog)
      
      // Only process shortcuts if no input is focused
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isInputFocused) return;

      // Global navigation shortcuts (g + key)
      if (e.key === 'g') {
        // Start listening for next key
        const handleSecondKey = (e2: KeyboardEvent) => {
          switch (e2.key) {
            case 'd':
              e2.preventDefault();
              router.push('/dashboard');
              break;
            case 't':
              e2.preventDefault();
              router.push('/dashboard/transactions');
              break;
            case 'a':
              e2.preventDefault();
              router.push('/dashboard/accounts');
              break;
            case 'b':
              e2.preventDefault();
              router.push('/dashboard/budgets');
              break;
            case 'c':
              e2.preventDefault();
              router.push('/dashboard/categories');
              break;
            case 'i':
              e2.preventDefault();
              router.push('/dashboard/investments');
              break;
            case 's':
              e2.preventDefault();
              router.push('/dashboard/settings');
              break;
          }
          document.removeEventListener('keydown', handleSecondKey);
        };

        // Listen for the second key for 500ms
        document.addEventListener('keydown', handleSecondKey);
        setTimeout(() => {
          document.removeEventListener('keydown', handleSecondKey);
        }, 500);
      }

      // Quick action shortcuts
      if (e.key === '/' || e.key === 's') {
        // Open search
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const contextValue = React.useMemo(
    () => ({
      openCommandPalette: () => setCommandPaletteOpen(true),
      closeCommandPalette: () => setCommandPaletteOpen(false),
    }),
    []
  );

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </KeyboardShortcutsContext.Provider>
  );
}
