// app/(host)/layout.tsx
// Placeholder shell for all Host mode screens.
// Person 3 owns this file — replace the header internals as needed.
// Do NOT change the route group name or the ModeProvider import.

import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";
import { ModeProvider } from "@/lib/mode-context";
import { ModeSwitcher } from "@/components/chargemate";

export const metadata: Metadata = {
  title: {
    default: "Host Dashboard — ChargeMate",
    template: "%s | Host · ChargeMate",
  },
};

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModeProvider defaultMode="host">
      <div className="min-h-screen bg-background flex flex-col">

        {/* ── Header — Person 3: replace internals, keep outer shell ── */}
        <header
          id="host-header"
          className="sticky top-0 z-40 bg-forest border-b border-forest/80"
        >
          <div className="max-w-screen-md mx-auto px-gutter h-14 flex items-center justify-between gap-4">
            {/* Logo / wordmark */}
            <Link
              href="/host"
              className="flex items-center gap-2 font-heading text-headline-sm text-forest-foreground"
              aria-label="ChargeMate Host Dashboard"
            >
              <Home className="size-5 text-forest-foreground/80" aria-hidden />
              ChargeMate Host
            </Link>

            {/* Mode switcher — on dark bg, inherits the same component */}
            <ModeSwitcher className="border-forest-foreground/20" />
          </div>
        </header>

        {/* ── Page content ── */}
        <main id="host-main" className="flex-1">
          {children}
        </main>

        {/* ── Bottom navigation — Person 3: fill this in ── */}
        <nav
          id="host-bottom-nav"
          aria-label="Host navigation"
          className="sticky bottom-0 z-40 bg-card border-t border-border"
        >
          <div className="max-w-screen-md mx-auto px-gutter h-16 flex items-center justify-around gap-2">
            {/* TODO Person 3: Dashboard | Requests | Spot | Earnings | Profile tabs */}
            <span className="font-body text-body-sm text-muted-foreground italic">
              Nav — Person 3
            </span>
          </div>
        </nav>

      </div>
    </ModeProvider>
  );
}
