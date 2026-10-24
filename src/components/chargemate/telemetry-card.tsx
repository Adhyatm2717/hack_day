"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Battery Gauge SVG sub-component ────────────────────────────────────────
interface BatteryGaugeProps {
  startPercent: number;
  currentPercent: number;
  targetPercent: number;
  className?: string;
}

function BatteryGauge({ startPercent, currentPercent, targetPercent, className }: BatteryGaugeProps) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = 52;
  const strokeWidth = 10;
  const gap = 30; // degrees of gap at bottom

  // Arc helper: converts percent of [gap..360-gap] range to SVG arc
  const degToRad = (d: number) => (d * Math.PI) / 180;
  const startAngle = 90 + gap / 2;
  const totalArc   = 360 - gap;

  const arcPath = (fromPct: number, toPct: number) => {
    const from = startAngle + (fromPct / 100) * totalArc;
    const to   = startAngle + (toPct   / 100) * totalArc;
    const x1 = cx + r * Math.cos(degToRad(from));
    const y1 = cy + r * Math.sin(degToRad(from));
    const x2 = cx + r * Math.cos(degToRad(to));
    const y2 = cy + r * Math.sin(degToRad(to));
    const large = (toPct - fromPct) > 50 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("w-36 h-36", className)}
      aria-label={`Battery: ${currentPercent}% charged, target ${targetPercent}%`}
    >
      {/* Track */}
      <path
        d={arcPath(0, 100)}
        fill="none"
        stroke="hsl(var(--recessed))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Charged segment (start → current) */}
      {currentPercent > startPercent && (
        <path
          d={arcPath(startPercent, currentPercent)}
          fill="none"
          stroke="hsl(var(--charge))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
      {/* Target range overlay */}
      {targetPercent > currentPercent && (
        <path
          d={arcPath(currentPercent, targetPercent)}
          fill="none"
          stroke="hsl(var(--charge) / 0.25)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
      )}
      {/* Center text */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        className="font-heading"
        style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}
        fontSize="22"
        fill="hsl(var(--foreground))"
      >
        {currentPercent}%
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        style={{ fontFamily: "var(--font-body)" }}
        fontSize="9"
        fill="hsl(var(--muted-foreground))"
        letterSpacing="1"
      >
        BATTERY
      </text>
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        style={{ fontFamily: "var(--font-body)" }}
        fontSize="9"
        fill="hsl(var(--muted-foreground))"
        letterSpacing="0.5"
      >
        → {targetPercent}% target
      </text>
    </svg>
  );
}

// ── Metric Cell ─────────────────────────────────────────────────────────────
interface MetricCell {
  label: string;
  value: string;
  unit: string;
  subtitle?: string;
}

// ── TelemetryCard ───────────────────────────────────────────────────────────
interface TelemetryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  voltage?: string;
  currentLabel?: string;
  batteryPercent: number;
  startPercent?: number;
  targetPercent?: number;
  metrics: MetricCell[];
}

export function TelemetryCard({
  voltage = "232V",
  currentLabel = "30A Stabilized",
  batteryPercent,
  startPercent = 15,
  targetPercent = 80,
  metrics,
  className,
  ...props
}: TelemetryCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-card overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Header bar */}
      <div className="bg-recessed border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-heading text-label-lg text-foreground">Live Power Telemetry</p>
          <p className="font-body text-body-sm text-muted-foreground mt-0.5">
            {voltage} · {currentLabel}
          </p>
        </div>
        {/* Live indicator */}
        <span className="flex items-center gap-1.5 font-heading text-label-sm text-charge uppercase tracking-widest">
          <span className="size-2 rounded-full bg-charge animate-pulse-subtle" aria-hidden />
          Live
        </span>
      </div>

      {/* Gauge */}
      <div className="flex justify-center py-4 bg-card">
        <BatteryGauge
          startPercent={startPercent}
          currentPercent={batteryPercent}
          targetPercent={targetPercent}
        />
      </div>

      {/* Metrics 2×n grid */}
      <div className="grid grid-cols-2 border-t border-border">
        {metrics.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col gap-0.5 p-4",
              i % 2 === 0 && i < metrics.length - 1 && "border-r border-border",
              i < metrics.length - 2 && "border-b border-border"
            )}
          >
            <span className="font-heading text-label-md text-muted-foreground uppercase tracking-widest">
              {m.label}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-data-display text-foreground leading-none">
                {m.value}
              </span>
              <span className="font-heading text-label-md text-muted-foreground">{m.unit}</span>
            </div>
            {m.subtitle && (
              <span className="font-body text-body-sm text-muted-foreground">{m.subtitle}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
