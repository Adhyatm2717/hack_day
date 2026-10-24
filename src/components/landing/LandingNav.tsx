"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "How it works",  href: "/#how-it-works" },
  { label: "Find a spot",   href: "/explore" },
  { label: "Become a host", href: "/login?mode=host" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      id="landing-nav"
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-card/95 backdrop-blur-sm border-b border-border shadow-card"
          : "bg-transparent"
      )}
    >
      <div className="max-w-screen-xl mx-auto px-gutter-mobile md:px-gutter h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="ChargeMate home"
        >
          <div className="w-7 h-7 rounded-lg bg-charge flex items-center justify-center">
            <Zap className="size-3.5 text-white" aria-hidden />
          </div>
          <span className="font-heading text-headline-sm text-foreground tracking-tight">
            ChargeMate
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-body text-body-md text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="font-heading text-label-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login?mode=charge"
            id="nav-cta-charge"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-charge text-white font-heading text-label-lg font-semibold hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <Zap className="size-3.5" aria-hidden />
            Find a charger
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-foreground hover:bg-recessed transition-colors"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-card border-t border-border px-gutter-mobile py-4 flex flex-col gap-3"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="font-body text-body-md text-foreground py-2 border-b border-border last:border-0"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login?mode=charge"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 h-11 rounded-lg bg-charge text-white font-heading text-label-lg font-semibold mt-2"
          >
            <Zap className="size-4" aria-hidden />
            Get started
          </Link>
        </div>
      )}
    </header>
  );
}
