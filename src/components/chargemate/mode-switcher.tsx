"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Zap, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMode, type Mode } from "@/lib/mode-context";

interface ModeSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  showLabels?: boolean;
}

interface TabOption {
  mode: Mode;
  label: string;
  Icon: React.ElementType;
  /** Active pill bg colour */
  activeBg: string;
  /** Active pill text + icon colour */
  activeFg: string;
  /** Icon colour when active (accent inside the pill) */
  activeIcon: string;
}

const TABS: TabOption[] = [
  {
    mode:       "charge",
    label:      "Charge",
    Icon:       Zap,
    activeBg:   "bg-charge",   // #F25A0E
    activeFg:   "text-white",
    activeIcon: "text-white",
  },
  {
    mode:       "host",
    label:      "Host",
    Icon:       Home,
    activeBg:   "bg-host",     // #1A4D3E
    activeFg:   "text-white",
    activeIcon: "text-white",
  },
];

export function ModeSwitcher({
  showLabels = true,
  className,
  ...props
}: ModeSwitcherProps) {
  const { mode, setMode } = useMode();

  return (
    <div
      role="tablist"
      aria-label="App mode switcher"
      className={cn(
        "relative inline-flex p-1 bg-recessed border border-border rounded-full gap-0.5",
        className
      )}
      {...props}
    >
      {TABS.map(({ mode: tabMode, label, Icon, activeBg, activeFg, activeIcon }) => {
        const isActive = mode === tabMode;
        return (
          <button
            key={tabMode}
            role="tab"
            aria-selected={isActive}
            id={`mode-tab-${tabMode}`}
            onClick={() => setMode(tabMode)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2 rounded-full z-10",
              "font-heading text-label-md transition-colors duration-150 cursor-pointer",
              "select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              // Inactive: dark text on transparent (recessed bg shows through)
              !isActive && "text-foreground hover:text-foreground/80",
              // Active text on top of the animated pill
              isActive && activeFg,
            )}
          >
            {/* Sliding active pill — animated with Framer Motion layoutId */}
            {isActive && (
              <motion.span
                layoutId="mode-pill"
                className={cn("absolute inset-0 rounded-full", activeBg)}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}
            <Icon
              className={cn(
                "size-3.5 shrink-0 transition-colors duration-150",
                isActive ? activeIcon : "text-muted-foreground",
              )}
              aria-hidden
            />
            {showLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
