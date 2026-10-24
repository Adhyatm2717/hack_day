// app/(host)/layout.tsx — Host mode shell
// Person 3 owns this file.

import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ModeProvider } from "@/lib/mode-context";
import { HostSidebar } from "@/components/layout/host-sidebar";

export const metadata: Metadata = {
  title: { default: "Host Dashboard — ChargeMate", template: "%s | Host · ChargeMate" },
};

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModeProvider defaultMode="host">
      <div className="min-h-screen bg-background">
        <HostSidebar />

        {/* Content area — offset by sidebar width */}
        <div className="pl-64">
          {/* Sticky top bar */}
          <header
            id="host-header"
            className="sticky top-0 z-40 h-16 bg-background/95 backdrop-blur-md border-b border-border px-gutter flex items-center justify-between"
          >
            <div className="flex items-center gap-sm">
              <span className="font-heading text-label-md text-foreground">
                12th Main, HAL 2nd Stage, Indiranagar
              </span>
              <span className="px-xs py-0.5 rounded bg-host-fixed text-forest font-heading text-label-sm uppercase">
                Socket Online
              </span>
            </div>
            <div className="flex items-center gap-md">
              <button
                aria-label="Notifications"
                className="relative p-sm rounded-full bg-recessed text-muted-foreground hover:text-foreground transition-colors"
                type="button"
              >
                <Bell className="size-5" />
                <span className="absolute top-1 right-1 size-2.5 rounded-full bg-charge ring-2 ring-background" />
              </button>
            </div>
          </header>

          <main id="host-main">{children}</main>
        </div>
      </div>
    </ModeProvider>
  );
}
