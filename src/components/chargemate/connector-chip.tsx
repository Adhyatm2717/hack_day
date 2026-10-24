import * as React from "react";
import { Zap, Plug, Cable, Bolt } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConnectorType = "type2" | "16a" | "ccs2" | "ather" | "bharat-ac" | "bharat-dc";

interface ConnectorChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: ConnectorType;
  power?: string;
}

const CONNECTOR_META: Record<
  ConnectorType,
  { label: string; Icon: React.ElementType }
> = {
  type2:     { label: "Type 2 AC",    Icon: Plug },
  "16a":     { label: "16A Socket",   Icon: Zap },
  ccs2:      { label: "CCS 2 DC",     Icon: Cable },
  ather:     { label: "Ather Grid",   Icon: Bolt },
  "bharat-ac": { label: "Bharat AC",  Icon: Zap },
  "bharat-dc": { label: "Bharat DC",  Icon: Cable },
};

export function ConnectorChip({ type, power, className, ...props }: ConnectorChipProps) {
  const meta = CONNECTOR_META[type] ?? { label: type, Icon: Plug };
  const Icon = meta.Icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5",
        "bg-recessed border border-border rounded-lg",
        "font-heading text-label-md text-foreground",
        "select-none",
        className
      )}
      {...props}
    >
      <Icon className="size-3.5 text-charge shrink-0" aria-hidden />
      <span>{meta.label}</span>
      {power && (
        <>
          <span className="text-border mx-0.5">·</span>
          <span className="text-muted-foreground">{power}</span>
        </>
      )}
    </span>
  );
}
