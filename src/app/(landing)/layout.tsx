// app/(landing)/layout.tsx
// Public shell for the marketing landing page — no mode-switcher, no bottom nav.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChargeMate — Peer-to-Peer EV Charging in India",
  description:
    "Find a home charger nearby in 60 seconds, or earn money from yours. India's first peer-to-peer EV charging grid.",
  openGraph: {
    title: "ChargeMate — Peer-to-Peer EV Charging in India",
    description: "Find, book and host EV chargers near you.",
    type: "website",
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
