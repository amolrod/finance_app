import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-border/60 bg-background px-3 py-2',
            'text-[14px] placeholder:text-muted-foreground/60',
            'transition-colors duration-150',
            'focus:outline-none focus:border-foreground/30',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary/30',
            'file:border-0 file:bg-transparent file:text-[13px] file:font-medium',
            error && 'border-foreground/40 focus:border-foreground/40',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[12px] text-muted-foreground">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
