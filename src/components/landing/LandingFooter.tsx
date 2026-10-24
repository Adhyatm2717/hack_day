import Link from "next/link";
import { Zap, ExternalLink } from "lucide-react";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Find a spot",  href: "/explore" },
  { label: "Become a host", href: "/login?mode=host" },
  { label: "Safety",       href: "#" },
  { label: "Privacy",      href: "#" },
  { label: "Terms",        href: "#" },
];

export function LandingFooter() {
  return (
    <footer
      id="landing-footer"
      aria-label="Site footer"
      className="bg-foreground text-background py-12 md:py-16"
    >
      <div className="max-w-screen-xl mx-auto px-gutter-mobile md:px-gutter">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-charge flex items-center justify-center">
                <Zap className="size-4 text-white" aria-hidden />
              </div>
              <span className="font-heading text-headline-sm text-background">ChargeMate</span>
            </div>
            <p className="font-body text-body-sm text-background/60 max-w-xs leading-relaxed">
              India&apos;s first peer-to-peer EV charging grid. Connecting riders with home charger hosts across the country.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="GitHub" className="text-background/40 hover:text-background transition-colors">
                <ExternalLink className="size-5" />
              </a>
              <a href="#" aria-label="Twitter / X" className="text-background/40 hover:text-background transition-colors">
                <ExternalLink className="size-5" />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <nav aria-label="Product links">
            <h3 className="font-heading text-label-lg text-background uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.slice(0, 3).map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-body text-body-sm text-background/60 hover:text-background transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Links 2 */}
          <nav aria-label="Legal links">
            <h3 className="font-heading text-label-lg text-background uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.slice(3).map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-body text-body-sm text-background/60 hover:text-background transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* CTA block */}
          <div>
            <h3 className="font-heading text-label-lg text-background uppercase tracking-wider mb-4">Get started</h3>
            <div className="flex flex-col gap-3">
              <Link
                href="/login?mode=charge"
                className="flex items-center justify-center gap-2 h-10 rounded-lg bg-charge text-white font-heading text-label-lg font-semibold hover:brightness-105 transition-all"
              >
                <Zap className="size-3.5" aria-hidden />
                Find a charger
              </Link>
              <Link
                href="/login?mode=host"
                className="flex items-center justify-center gap-2 h-10 rounded-lg border border-background/20 text-background/80 font-heading text-label-lg hover:bg-background/5 transition-all"
              >
                List your charger
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-body-sm text-background/40">
            © 2026 ChargeMate Technologies Inc. All rights reserved.
          </p>
          <p className="font-body text-label-sm text-background/30 uppercase tracking-wider">
            Made with ⚡ in Bengaluru
          </p>
        </div>
      </div>
    </footer>
  );
}
