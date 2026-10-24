// ConnectorBadge.tsx — small shared badge used in FeaturedHostSection
import { cn } from "@/lib/utils";
import type { ConnectorType } from "@/types/db";

const CONNECTOR_META: Record<ConnectorType, { label: string; color: string }> = {
  CCS2:        { label: "CCS2",     color: "bg-host-fixed text-host" },
  Type2:       { label: "Type 2",   color: "bg-charge-fixed text-charge" },
  "16A_socket":{ label: "16A",      color: "bg-ochre-fixed text-ochre" },
  "3pin":      { label: "3-Pin",    color: "bg-recessed text-muted-foreground" },
};

export function ConnectorBadge({ connector }: { connector: ConnectorType }) {
  const { label, color } = CONNECTOR_META[connector] ?? {
    label: connector,
    color: "bg-recessed text-muted-foreground",
  };
  return (
    <span className={cn("inline-block rounded-full px-2 py-0.5 font-heading text-label-sm uppercase tracking-wider", color)}>
      {label}
    </span>
  );
}
