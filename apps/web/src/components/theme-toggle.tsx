'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    const doc = document as ViewTransitionDocument;

    if (!buttonRef.current || !doc.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    doc
      .startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme);
        });
      })
      .ready.then(() => {
        const { top, left, width, height } = buttonRef.current!.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const maxRadius = Math.hypot(
          Math.max(left, window.innerWidth - left),
          Math.max(top, window.innerHeight - top)
        );

        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`]
          },
          {
            duration: 450,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });
  }, [resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Cambiar tema">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4 text-yellow-500" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
