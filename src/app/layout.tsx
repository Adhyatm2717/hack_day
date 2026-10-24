import type { Metadata } from "next";
import "./globals.css";
import { heading, body } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ModeProvider } from "@/lib/mode-context";

export const metadata: Metadata = {
  title: {
    default: "ChargeMate — Peer-to-Peer EV Charging in India",
    template: "%s | ChargeMate",
  },
  description:
    "Find, book and host EV chargers near you. ChargeMate connects EV riders with home charger hosts across India.",
  keywords: ["EV charging", "electric vehicle", "peer-to-peer charging", "India", "home charger"],
  openGraph: {
    title: "ChargeMate — Peer-to-Peer EV Charging in India",
    description: "Find, book and host EV chargers near you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(heading.variable, body.variable)}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <body className={cn("bg-background text-foreground antialiased font-body min-h-screen")}>
        <ModeProvider defaultMode="charge">
          {children}
        </ModeProvider>
      </body>
    </html>
  );
}
