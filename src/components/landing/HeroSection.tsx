"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Home, Battery, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const BATTERY_LEVELS = [4, 11, 20, 35, 52, 68, 80];

export function HeroSection() {
  const [batteryPct, setBatteryPct] = useState(4);

  const urgency =
    batteryPct <= 15
      ? "critical"
      : batteryPct <= 35
      ? "low"
      : "ok";

  const urgencyColor =
    urgency === "critical"
      ? "text-destructive"
      : urgency === "low"
      ? "text-ochre"
      : "text-success";

  const batteryBg =
    urgency === "critical"
      ? "bg-destructive"
      : urgency === "low"
      ? "bg-ochre"
      : "bg-success";

  return (
    <section
      id="hero"
      aria-label="Hero — find EV charging near you"
      className="relative overflow-hidden bg-background min-h-[92vh] flex flex-col"
    >
      {/* Warm ambient top-right glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-charge/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -left-24 w-64 h-64 rounded-full bg-host/6 blur-[80px]"
      />

      <div className="relative z-10 flex-1 max-w-screen-xl mx-auto w-full px-gutter-mobile md:px-gutter pt-12 md:pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* ── Left copy ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-charge-fixed border border-charge/20"
          >
            <span className="w-2 h-2 rounded-full bg-charge animate-pulse" aria-hidden />
            <span className="font-heading text-label-sm text-charge uppercase tracking-widest">
              Live grid · 47 spots online
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="font-heading text-display-lg-mobile md:text-display-lg text-foreground leading-tight tracking-tight">
              Your neighbour&apos;s{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-charge">charger,</span>
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 w-full h-2 bg-charge/20 rounded-full"
                />
              </span>
              <br />
              your next charge.
            </h1>
            <p className="mt-4 font-body text-body-lg text-muted-foreground max-w-md">
              India&apos;s first peer-to-peer EV charging grid. Find a home charger nearby in 60 seconds, or earn money from yours.
            </p>
          </motion.div>

          {/* ── Battery slider ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card rounded-2xl p-5 border border-border shadow-card"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading text-label-lg text-foreground">
                My battery today
              </span>
              <div className="flex items-center gap-1.5">
                <Battery
                  className={cn("size-5", urgencyColor)}
                  aria-hidden
                />
                <span className={cn("font-heading text-headline-sm font-bold", urgencyColor)}>
                  {batteryPct}%
                </span>
              </div>
            </div>

            {/* Visual battery bar */}
            <div className="h-3 bg-recessed rounded-full mb-4 overflow-hidden" role="img" aria-label={`Battery at ${batteryPct}%`}>
              <motion.div
                className={cn("h-full rounded-full transition-colors", batteryBg)}
                animate={{ width: `${batteryPct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>

            {/* Slider ticks */}
            <div className="flex gap-2 mb-4">
              {BATTERY_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setBatteryPct(level)}
                  aria-label={`Set battery to ${level}%`}
                  className={cn(
                    "flex-1 h-8 rounded-lg font-heading text-label-sm transition-all",
                    batteryPct === level
                      ? "bg-charge text-white shadow-md"
                      : "bg-recessed text-muted-foreground hover:bg-surface-high"
                  )}
                >
                  {level}%
                </button>
              ))}
            </div>

            {/* Urgency message */}
            {urgency !== "ok" && (
              <p className={cn("font-body text-body-sm mb-4", urgencyColor)}>
                {urgency === "critical"
                  ? "⚡ Critical! Find a socket before you strand."
                  : "🔋 Getting low — book a spot now."}
              </p>
            )}

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/login?mode=charge"
                id="hero-cta-charge"
                className={cn(
                  "flex items-center justify-center gap-2 h-12 rounded-xl",
                  "font-heading text-label-lg font-semibold",
                  "bg-charge text-white shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
                )}
              >
                <Zap className="size-4" aria-hidden />
                I need a charge
              </Link>
              <Link
                href="/login?mode=host"
                id="hero-cta-host"
                className={cn(
                  "flex items-center justify-center gap-2 h-12 rounded-xl",
                  "font-heading text-label-lg font-semibold",
                  "bg-forest text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                )}
              >
                <Home className="size-4" aria-hidden />
                I have a charger
              </Link>
            </div>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 text-body-sm text-muted-foreground font-body"
          >
            {[
              { icon: "🔒", text: "Phone-verified hosts" },
              { icon: "⚡", text: "Live telemetry" },
              { icon: "₹", text: "UPI payouts same day" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <span aria-hidden>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right imagery ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative hidden lg:flex items-center justify-center"
        >
          {/* Main SUV hero image */}
          <div className="relative w-full max-w-lg">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.14)]">
              <Image
                src="/images/hero-suv.jpg"
                alt="Electric SUV plugged in at a home charger"
                width={600}
                height={420}
                className="w-full object-cover"
                priority
              />
              {/* Overlay stats card */}
              <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl p-3 border border-border flex items-center justify-between shadow-card">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-charge" aria-hidden />
                  <div>
                    <p className="font-heading text-label-md text-foreground">Indiranagar, Bengaluru</p>
                    <p className="font-body text-label-sm text-muted-foreground">0.4 km away · 7.2 kW</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading text-headline-sm text-charge font-bold">₹12/kWh</p>
                  <p className="font-body text-label-sm text-muted-foreground">Type 2</p>
                </div>
              </div>
            </div>

            {/* Floating charging-plug chip */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-card rounded-2xl p-2 shadow-card-hover border border-border"
            >
              <Image
                src="/images/charging-plug.jpg"
                alt="CCS2 charging plug"
                width={80}
                height={80}
                className="rounded-xl object-cover"
              />
            </motion.div>

            {/* Floating map-pin chip */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-4 -left-8 bg-card rounded-2xl p-2 shadow-card-hover border border-border flex items-center gap-2"
            >
              <Image
                src="/images/map-pin.jpg"
                alt="Map showing nearby chargers"
                width={56}
                height={56}
                className="rounded-lg object-cover"
              />
              <div className="pr-2">
                <p className="font-heading text-label-sm text-foreground">47 online</p>
                <p className="font-body text-label-sm text-muted-foreground">near you</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom wave divider */}
      <div aria-hidden className="absolute bottom-0 left-0 right-0 h-8 bg-background" style={{
        clipPath: "ellipse(55% 100% at 50% 100%)"
      }} />
    </section>
  );
}
