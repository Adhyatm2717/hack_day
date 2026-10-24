"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Zap, PlugZap, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeSwitcher } from "@/components/chargemate";

// Using lucide icons that closest match the design's Material Symbols
// LayoutDashboard → dashboard, Zap → sync/bolt, EvStation → ev_station, CreditCard → payments

const NAV_ITEMS = [
  { label: "Host Dashboard", href: "/host/dashboard",  icon: LayoutDashboard },
  { label: "Live Requests",  href: "/host/requests",   icon: Zap,             badge: true },
  { label: "My Charger & Spot", href: "/host/spot",    icon: PlugZap },
  { label: "Earnings & Payouts", href: "/host/earnings", icon: CreditCard },
];

export function HostSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-recessed border-r border-border z-50 flex flex-col justify-between py-lg">
      {/* Top: logo + mode switcher + nav */}
      <div className="px-md">
        {/* Logo */}
        <div className="flex items-center gap-sm mb-xl px-xs">
          <div className="flex flex-col">
            <span className="font-heading text-headline-sm text-forest leading-none">ChargeMate</span>
            <span className="font-heading text-label-sm uppercase tracking-wider text-ochre mt-xs">
              Host Mode
            </span>
          </div>
        </div>

        {/* Mode switcher */}
        <div className="mb-lg px-xs">
          <ModeSwitcher className="w-full" />
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-xs" aria-label="Host navigation">
          {NAV_ITEMS.map(({ label, href, icon: Icon, badge }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between px-md py-sm rounded-xl transition-all",
                  "font-heading text-label-md",
                  isActive
                    ? "bg-forest text-forest-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-recessed hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-sm">
                  <Icon className="size-[18px] shrink-0" aria-hidden />
                  {label}
                </div>
                {badge && !isActive && (
                  <span className="size-2 rounded-full bg-charge shrink-0" aria-label="New" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: profile chip */}
      <div className="px-md border-t border-border pt-md">
        <div className="p-sm rounded-xl bg-recessed flex items-center justify-between">
          <div className="flex items-center gap-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.pravatar.cc/150?u=ramesh-verma"
              alt="Ramesh Verma"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <span className="font-heading text-label-md text-foreground">Ramesh Verma</span>
              <span className="font-heading text-label-sm text-forest font-bold">Verified Host</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
