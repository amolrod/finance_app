'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 px-6 py-14 text-center',
      className
    )}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/80 mb-5">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-[13px] text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}

// Skeleton loader for cards
interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-2/3 bg-muted rounded" />
              <div className="h-3 w-1/3 bg-muted rounded" />
            </div>
          </div>
          <div className="h-8 w-1/2 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// List skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-muted rounded" />
            <div className="h-3 w-1/4 bg-muted rounded" />
          </div>
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// Stats skeleton
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-5 w-5 rounded bg-muted" />
          </div>
          <div className="h-8 w-24 bg-muted rounded mb-2" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// Page header component
interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, icon, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-end md:justify-between', className)}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/70 text-muted-foreground">
            {icon}
          </div>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            typeof description === 'string' ? (
              <p className="text-[13px] text-muted-foreground">{description}</p>
            ) : (
              <div className="text-[13px] text-muted-foreground">{description}</div>
            )
          ) : null}
        </div>
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

// Section header
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
