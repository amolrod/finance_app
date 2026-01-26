import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border border-foreground/10 bg-foreground/5 text-foreground",
        secondary:
          "border border-border/60 bg-secondary/80 text-secondary-foreground",
        destructive:
          "bg-destructive/10 text-destructive",
        success:
          "bg-success/10 text-success",
        warning:
          "bg-warning/10 text-warning",
        outline: "border border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
