import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  accentColor?: "charge" | "host" | "ochre" | "forest";
}

const ACCENT_ICON_CLASS: Record<string, string> = {
  charge: "text-charge",
  host:   "text-host",
  ochre:  "text-ochre",
  forest: "text-forest",
};

export function StatCard({
  label,
  value,
  unit,
  subtitle,
  icon: Icon,
  footerLeft,
  footerRight,
  accentColor = "charge",
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-card flex flex-col overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="font-heading text-label-md text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        {Icon && (
          <Icon
            className={cn("size-4 shrink-0", ACCENT_ICON_CLASS[accentColor])}
            aria-hidden
          />
        )}
      </div>

      {/* Value */}
      <div className="px-4 pb-3 flex items-baseline gap-1.5">
        <span className="font-heading text-data-display text-foreground leading-none">
          {value}
        </span>
        {unit && (
          <span className="font-heading text-label-md text-muted-foreground">{unit}</span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="px-4 pb-3">
          <span className="font-body text-body-sm text-muted-foreground">{subtitle}</span>
        </div>
      )}

      {/* Footer strip */}
      {(footerLeft || footerRight) && (
        <div className="mt-auto flex items-center justify-between bg-recessed border-t border-border px-4 py-2.5">
          {footerLeft && (
            <span className="font-body text-body-sm text-muted-foreground">{footerLeft}</span>
          )}
          {footerRight && (
            <span className="font-heading text-label-md text-foreground">{footerRight}</span>
          )}
        </div>
      )}
    </div>
  );
}
