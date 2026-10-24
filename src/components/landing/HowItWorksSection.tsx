"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Zap, MapPin, Shield, Home } from "lucide-react";

// ── Dashed SVG route line ────────────────────────────────────────────────────
function DashedRouteLine() {
  return (
    <svg
      viewBox="0 0 120 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-24 hidden md:block"
      aria-hidden
    >
      {/* Hand-drawn wobble path */}
      <path
        d="M60 20 C52 60, 72 100, 60 140 C48 180, 68 220, 60 260 C52 300, 68 340, 60 380"
        stroke="hsl(var(--border))"
        strokeWidth="2"
        strokeDasharray="8 6"
        strokeLinecap="round"
      />
      {/* Animated progress dot */}
      <circle r="5" fill="hsl(var(--charge))" opacity="0.7">
        <animateMotion
          dur="4s"
          repeatCount="indefinite"
          path="M60 20 C52 60, 72 100, 60 140 C48 180, 68 220, 60 260 C52 300, 68 340, 60 380"
        />
      </circle>
    </svg>
  );
}

// ── Step card ────────────────────────────────────────────────────────────────
interface StepProps {
  step:     number;
  icon:     React.ReactNode;
  title:    string;
  body:     string;
  align:    "left" | "right";
  accent:   "charge" | "host" | "ochre";
  delay?:   number;
}

const ACCENT_COLORS = {
  charge: {
    pill: "bg-charge-fixed text-charge",
    num:  "bg-charge text-white",
  },
  host: {
    pill: "bg-host-fixed text-host",
    num:  "bg-host text-white",
  },
  ochre: {
    pill: "bg-ochre-fixed text-ochre",
    num:  "bg-ochre text-white",
  },
} as const;

function StepCard({ step, icon, title, body, align, accent, delay = 0 }: StepProps) {
  const colors = ACCENT_COLORS[accent];

  return (
    <motion.div
      initial={{ opacity: 0, x: align === "left" ? -28 : 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay }}
      className={`flex ${align === "right" ? "flex-row-reverse" : "flex-row"} items-start gap-5 md:gap-8 md:w-[calc(50%-48px)] ${align === "right" ? "md:ml-auto" : ""}`}
    >
      {/* Step number bubble */}
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-heading text-label-lg font-bold shadow-md ${colors.num}`}>
        {step}
      </div>

      <div className="flex-1">
        {/* Icon pill */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 ${colors.pill}`}>
          {icon}
          <span className="font-heading text-label-md uppercase tracking-wider">{accent}</span>
        </div>
        <h3 className="font-heading text-headline-sm text-foreground mb-2">{title}</h3>
        <p className="font-body text-body-md text-muted-foreground">{body}</p>
      </div>
    </motion.div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────
export function HowItWorksSection() {
  const ref        = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY        = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section
      id="how-it-works"
      ref={ref}
      aria-labelledby="hiw-heading"
      className="relative bg-background py-20 md:py-28 overflow-hidden"
    >
      {/* Subtle parallax background stripe */}
      <motion.div
        style={{ y: bgY }}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[60%] bg-recessed/50 rounded-[40px] mx-4"
      />

      <div className="relative z-10 max-w-screen-xl mx-auto px-gutter-mobile md:px-gutter">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="font-heading text-label-md uppercase tracking-widest text-charge block mb-2">
            Zero friction
          </span>
          <h2
            id="hiw-heading"
            className="font-heading text-headline-lg-mobile md:text-headline-lg text-foreground tracking-tight"
          >
            From map to charged in minutes
          </h2>
        </motion.div>

        {/* Asymmetric steps layout */}
        <div className="relative flex flex-col gap-12 md:gap-16">
          {/* Dashed vertical route line — only desktop */}
          <DashedRouteLine />

          <StepCard
            step={1}
            icon={<MapPin className="size-3.5" aria-hidden />}
            title="Spot a charger nearby"
            body="Our live map shows home chargers within your radius with real-time availability, connector type, price, and earthing status."
            align="left"
            accent="charge"
            delay={0}
          />

          <StepCard
            step={2}
            icon={<Zap className="size-3.5" aria-hidden />}
            title="Book & get the gate PIN"
            body="Request a slot — the host accepts in seconds. You receive a 4-digit gate PIN and turn-by-turn directions straight to their driveway."
            align="right"
            accent="ochre"
            delay={0.1}
          />

          <StepCard
            step={3}
            icon={<Shield className="size-3.5" aria-hidden />}
            title="Plug in, track live, pay UPI"
            body="Live kWh telemetry shows your session progress. When you&apos;re done, one-tap UPI payment — and both sides get a nudge to leave a review."
            align="left"
            accent="charge"
            delay={0.2}
          />

          <StepCard
            step={4}
            icon={<Home className="size-3.5" aria-hidden />}
            title="Hosts earn while they sleep"
            body="List your 16A or Type 2 point in 5 minutes. Accept requests on your schedule, track kWh delivered, and get UPI payouts every morning."
            align="right"
            accent="host"
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}
