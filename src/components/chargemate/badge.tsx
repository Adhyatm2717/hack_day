import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-heading font-semibold uppercase tracking-widest transition-colors",
  {
    variants: {
      variant: {
        charge:  "bg-charge text-charge-foreground",
        host:    "bg-forest text-forest-foreground",
        outline: "border border-border bg-transparent text-foreground",
        success: "bg-host-fixed text-forest",
        warning: "bg-ochre-fixed text-ochre",
        error:   "bg-destructive/10 text-destructive",
        muted:   "bg-recessed text-muted-foreground",
        ochre:   "bg-ochre text-ochre-foreground",
      },
      size: {
        sm:      "px-2 py-0.5 text-label-sm rounded-full",
        default: "px-2.5 py-1 text-label-sm rounded-full",
        lg:      "px-3 py-1.5 text-label-md rounded-full",
      },
    },
    defaultVariants: {
      variant: "muted",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
