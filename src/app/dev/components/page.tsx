"use client";

import {
  Zap, Home, Star, IndianRupee, Battery, TrendingUp,
  Plug, CheckCircle, AlertTriangle, Info,
} from "lucide-react";
import {
  Button,
  Badge,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  ConnectorChip,
  VerifiedStamp,
  StatCard,
  ModeSwitcher,
  TelemetryCard,
} from "@/components/chargemate";
import { mockSession, mockHostStats, mockConnectors } from "@/mock/data";
import { ModeProvider } from "@/lib/mode-context";

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-10 border-b border-border last:border-b-0">
      <h2 className="font-heading text-headline-md text-foreground mb-6">{title}</h2>
      {children}
    </section>
  );
}

// ── Colour swatch ─────────────────────────────────────────────────────────────
function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-16 h-16 rounded-xl border border-border ${className}`} />
      <span className="font-body text-body-sm text-muted-foreground text-center">{label}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DevComponentsPage() {
  return (
    <ModeProvider defaultMode="charge">
      <div className="min-h-screen bg-background">
        {/* Page header */}
        <header className="bg-forest px-gutter py-6 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-heading text-headline-sm text-forest-foreground">
                ChargeMate — Component Showcase
              </h1>
              <p className="font-body text-body-sm text-forest-foreground/60 mt-0.5">
                Design system · /dev/components
              </p>
            </div>
            <ModeSwitcher />
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-gutter pb-20">

          {/* ── 1. Colours ── */}
          <Section id="colours" title="Colour Palette">
            <div className="flex flex-wrap gap-6">
              <Swatch label="Background #F4F1EA" className="bg-background" />
              <Swatch label="Recessed #EAE6DC"   className="bg-recessed" />
              <Swatch label="Card #FFFFFF"        className="bg-card" />
              <Swatch label="Forest #143122"      className="bg-forest" />
              <Swatch label="Charge #F25A0E"      className="bg-charge" />
              <Swatch label="Host #1A4D3E"        className="bg-host" />
              <Swatch label="Ochre #D49018"       className="bg-ochre" />
              <Swatch label="Border #D5D0C5"      className="bg-border" />
              <Swatch label="Charge tint"         className="bg-charge-fixed" />
              <Swatch label="Host tint"           className="bg-host-fixed" />
              <Swatch label="Ochre tint"          className="bg-ochre-fixed" />
            </div>
          </Section>

          {/* ── 2. Typography ── */}
          <Section id="typography" title="Typography">
            <div className="space-y-3">
              {[
                ["font-heading text-display-lg",        "Display LG — Space Grotesk 48/700"],
                ["font-heading text-headline-lg",       "Headline LG — Space Grotesk 32/600"],
                ["font-heading text-headline-md",       "Headline MD — Space Grotesk 22/600"],
                ["font-heading text-headline-sm",       "Headline SM — Space Grotesk 18/600"],
                ["font-heading text-data-display",      "Data Display — 28px/700 ₹9,240"],
                ["font-body text-body-lg",              "Body LG — Plus Jakarta Sans 18/400"],
                ["font-body text-body-md",              "Body MD — Plus Jakarta Sans 15/400"],
                ["font-body text-body-sm text-muted-foreground", "Body SM muted — 13/400"],
                ["font-heading text-label-lg",          "LABEL LG — 14PX/700 TRACKING"],
                ["font-heading text-label-md",          "LABEL MD — 12PX/600 TRACKING"],
                ["font-heading text-label-sm uppercase tracking-widest", "LABEL SM — 10PX/700"],
              ].map(([cls, sample]) => (
                <p key={cls} className={cls as string}>{sample}</p>
              ))}
            </div>
          </Section>

          {/* ── 3. Buttons ── */}
          <Section id="buttons" title="Button">
            <div className="space-y-4">
              {/* All variants, default size */}
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="charge" id="btn-charge">Charge (Rider)</Button>
                <Button variant="host"   id="btn-host">Host</Button>
                <Button variant="outline" id="btn-outline">Outline</Button>
                <Button variant="ghost"   id="btn-ghost">Ghost</Button>
                <Button variant="ochre"   id="btn-ochre">Ochre</Button>
                <Button variant="destructive" id="btn-destructive">Destructive</Button>
              </div>
              {/* With icons */}
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="charge" id="btn-charge-icon"><Zap className="size-4"/>Start Charging</Button>
                <Button variant="host"   id="btn-host-icon"><Home className="size-4"/>Host Mode</Button>
                <Button variant="outline" id="btn-icon-only" size="icon"><Plug /></Button>
              </div>
              {/* Sizes */}
              <div className="flex flex-wrap gap-3 items-end">
                <Button variant="charge" size="sm"      id="btn-sm">Small</Button>
                <Button variant="charge" size="default" id="btn-default">Default</Button>
                <Button variant="charge" size="lg"      id="btn-lg">Large</Button>
              </div>
              {/* Disabled */}
              <div className="flex gap-3">
                <Button variant="charge" disabled id="btn-disabled">Disabled</Button>
                <Button variant="host"   disabled id="btn-host-disabled">Disabled Host</Button>
              </div>
            </div>
          </Section>

          {/* ── 4. Badges ── */}
          <Section id="badges" title="Badge">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge variant="charge"  id="badge-charge">Charge</Badge>
              <Badge variant="host"    id="badge-host">Host</Badge>
              <Badge variant="outline" id="badge-outline">Outline</Badge>
              <Badge variant="success" id="badge-success">Verified</Badge>
              <Badge variant="warning" id="badge-warning">Pending</Badge>
              <Badge variant="error"   id="badge-error">Failed</Badge>
              <Badge variant="muted"   id="badge-muted">Muted</Badge>
              <Badge variant="ochre"   id="badge-ochre">Ochre</Badge>
              <Badge variant="success" size="lg" id="badge-lg">Large Success</Badge>
            </div>
          </Section>

          {/* ── 5. Card ── */}
          <Section id="cards" title="Card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card id="card-basic">
                <CardHeader>
                  <CardTitle>Suresh&apos;s Shaded Driveway</CardTitle>
                  <CardDescription>14B, Koramangala 4th Block, Bengaluru</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-body text-body-md text-muted-foreground">
                    Covered parking with 7.2 kW Type 2 AC charger. EV-friendly host since 2023.
                  </p>
                </CardContent>
                <CardFooter>
                  <span className="font-body text-body-sm text-muted-foreground">₹9/kWh</span>
                  <span className="ml-auto font-heading text-label-md text-forest">Available now</span>
                </CardFooter>
              </Card>
              <Card recessed id="card-recessed">
                <CardHeader>
                  <CardTitle>Recessed Variant</CardTitle>
                  <CardDescription>Used for nested / inner cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-body text-body-md text-muted-foreground">
                    The recessed surface (#EAE6DC) is used for secondary areas inside a white card.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* ── 6. ConnectorChip ── */}
          <Section id="connector-chips" title="ConnectorChip">
            <div className="flex flex-wrap gap-3">
              {mockConnectors.map((c) => (
                <ConnectorChip key={c.type} type={c.type} power={c.power} id={`chip-${c.type}`} />
              ))}
              <ConnectorChip type="type2" id="chip-nopow" />
            </div>
          </Section>

          {/* ── 7. VerifiedStamp ── */}
          <Section id="verified-stamp" title="VerifiedStamp">
            <div className="flex flex-wrap gap-8 items-start">
              <VerifiedStamp id="stamp-forest" />
              <VerifiedStamp
                id="stamp-charge"
                variant="charge"
                label="Charger Tested"
                sublabel="by ChargeMate team"
              />
              <VerifiedStamp
                id="stamp-ochre"
                variant="ochre"
                label="Safety Certified"
                sublabel="CEA Compliant"
              />
            </div>
          </Section>

          {/* ── 8. StatCard ── */}
          <Section id="stat-cards" title="StatCard">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {mockHostStats.map((stat, i) => (
                <StatCard
                  key={i}
                  id={`stat-${i}`}
                  label={stat.label}
                  value={stat.value}
                  unit={stat.unit}
                  subtitle={stat.subtitle}
                  icon={[IndianRupee, TrendingUp, Battery, Star][i]}
                  footerLeft={stat.footerLeft}
                  footerRight={stat.footerRight}
                  accentColor={stat.accentColor}
                />
              ))}
            </div>
          </Section>

          {/* ── 9. ModeSwitcher ── */}
          <Section id="mode-switcher" title="ModeSwitcher">
            <div className="flex flex-col gap-6">
              <div>
                <p className="font-body text-body-sm text-muted-foreground mb-3">
                  Horizontal (default) — click to see animated pill transition
                </p>
                <ModeSwitcher id="mode-switcher-h" />
              </div>
              <div>
                <p className="font-body text-body-sm text-muted-foreground mb-3">
                  Icons only
                </p>
                <ModeSwitcher showLabels={false} id="mode-switcher-icons" />
              </div>
            </div>
          </Section>

          {/* ── 10. TelemetryCard ── */}
          <Section id="telemetry" title="TelemetryCard">
            <div className="max-w-sm">
              <TelemetryCard
                id="telemetry-card"
                voltage={mockSession.voltage}
                currentLabel={mockSession.currentLabel}
                batteryPercent={mockSession.batteryPercent}
                startPercent={mockSession.startPercent}
                targetPercent={mockSession.targetPercent}
                metrics={mockSession.metrics}
              />
            </div>
          </Section>

        </main>
      </div>
    </ModeProvider>
  );
}
