"use client";

import { cn } from "@/lib/utils";
import type { MonthlyRevenue } from "@/types/db";

interface RevenueChartProps {
  data: MonthlyRevenue[];
  className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  if (!data.length) return null;

  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  // Heights as % of max, minimum 8% so a bar always shows
  const heights = data.map((d) => Math.max(8, Math.round((d.revenue / maxRevenue) * 88)));
  const lastIdx  = data.length - 1;

  return (
    <div className={cn("flex flex-col gap-md", className)}>
      {/* Bars */}
      <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-6 px-2">
        {data.map((month, i) => {
          const isPeak = i === lastIdx;
          return (
            <div
              key={month.month}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
            >
              {/* Hover tooltip */}
              <span className="font-heading text-label-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                ₹{month.revenue.toLocaleString("en-IN")}
              </span>

              {/* Bar */}
              <div className="w-full relative" style={{ height: `${heights[i]}%` }}>
                {isPeak && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-forest text-forest-foreground font-heading text-label-sm font-bold whitespace-nowrap">
                    Peak
                  </span>
                )}
                <div
                  className={cn(
                    "w-full h-full rounded-t-md transition-colors relative overflow-hidden",
                    isPeak
                      ? "bg-forest"
                      : "bg-surface-high hover:bg-forest/40"
                  )}
                >
                  {/* Accent top stripe */}
                  <div className={cn(
                    "absolute inset-x-0 top-0 rounded-t-md",
                    isPeak ? "h-1.5 bg-charge" : "h-1 bg-forest/20"
                  )} />
                  {/* Dot texture on peak */}
                  {isPeak && (
                    <div className="w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
                  )}
                </div>
              </div>

              {/* Labels */}
              <div className="flex flex-col items-center text-center">
                <span className={cn(
                  "font-heading text-label-md",
                  isPeak ? "text-forest font-bold" : "text-foreground font-semibold"
                )}>
                  {month.month}
                </span>
                <span className={cn(
                  "font-heading text-label-sm",
                  isPeak ? "text-charge font-bold" : "text-muted-foreground"
                )}>
                  ₹{month.revenue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
