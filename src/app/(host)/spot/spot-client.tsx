"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, AlertTriangle, CheckCircle, Upload, X, Shield,
  Zap, Clock, IndianRupee, MapPin, FileText,
} from "lucide-react";
import { Button } from "@/components/chargemate/button";
import { Badge } from "@/components/chargemate/badge";
import { ConnectorChip } from "@/components/chargemate/connector-chip";
import { VerifiedStamp } from "@/components/chargemate/verified-stamp";
import { cn } from "@/lib/utils";
import { getMySpot, updateMySpot, type ChargingSpot, type ConnectorType } from "@/lib/data";

// ── Zod validation schema ─────────────────────────────────────────────────────
const spotSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(80, "Title too long (max 80 chars)"),
  price_per_kwh: z
    .number()
    .min(9, "Minimum rate is ₹9/kWh")
    .max(20, "Maximum rate is ₹20/kWh"),
  available_from: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Enter time as HH:MM"),
  available_to: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Enter time as HH:MM"),
  connector: z.enum(["CCS2", "Type2", "16A_socket", "3pin"] as const),
  power_kw: z
    .number()
    .min(1.5, "Minimum 1.5 kW")
    .max(22, "Maximum 22 kW"),
  rules: z.string().max(400, "Rules too long (max 400 chars)").optional(),
});

type SpotFormValues = z.infer<typeof spotSchema>;

const CONNECTOR_OPTIONS: { value: ConnectorType; label: string }[] = [
  { value: "Type2",      label: "Type 2 AC" },
  { value: "CCS2",       label: "CCS 2 DC" },
  { value: "16A_socket", label: "16A Socket" },
  { value: "3pin",       label: "3-Pin Socket" },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-recessed rounded-lg ${className}`} />;
}

// ── Form field wrapper ────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-heading text-label-md text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && !error && <p className="font-body text-body-sm text-muted-foreground">{hint}</p>}
      {error && (
        <p className="font-body text-body-sm text-destructive flex items-center gap-1">
          <AlertTriangle className="size-3.5 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

const INPUT_BASE =
  "w-full bg-recessed border border-border rounded-lg px-md py-sm font-body text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors";

// ── Photo upload (mock) ───────────────────────────────────────────────────────
interface PhotoUploadProps {
  photos: string[];
  onChange: (urls: string[]) => void;
}

function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    // Mock: create object URLs for preview
    const newUrls = Array.from(files).map((f) => URL.createObjectURL(f));
    onChange([...photos, ...newUrls].slice(0, 5));
  }

  function remove(idx: number) {
    onChange(photos.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-sm">
      <div className="grid grid-cols-3 gap-sm">
        {photos.map((url, i) => (
          <div key={i} className="relative group rounded-xl overflow-hidden h-28 bg-recessed">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove photo"
            >
              <X className="size-3.5" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white font-heading text-label-sm px-2 py-1">
              Photo {i + 1}
            </div>
          </div>
        ))}

        {photos.length < 5 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-28 rounded-xl border-2 border-dashed border-border bg-recessed hover:bg-surface-high transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
          >
            <Upload className="size-5" />
            <span className="font-heading text-label-sm">Add photo</span>
          </button>
        )}
      </div>
      <p className="font-body text-body-sm text-muted-foreground">
        Upload up to 5 photos · Gate, carport, charger rig recommended.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ── Safety checklist ──────────────────────────────────────────────────────────
interface SafetyItem {
  icon: React.ElementType;
  title: string;
  description: string;
  badge: string;
  iconColor: string;
}

const SAFETY_ITEMS: SafetyItem[] = [
  {
    icon:        CheckCircle,
    title:       "BESCOM Sanctioned EV Load",
    description: "10 kW approved commercial/domestic hybrid load meter. Prevents local transformer tripping.",
    badge:       "Sanctioned",
    iconColor:   "text-forest",
  },
  {
    icon:        Shield,
    title:       "Dedicated Earthing Pit",
    description: "Chemical copper grounding measured at 1.84 Ω (< 2.2 Ω threshold). Physical audit passed Oct 2026.",
    badge:       "1.84 Ω Tested",
    iconColor:   "text-forest",
  },
  {
    icon:        Shield,
    title:       "₹10 Lakh Damage Cover",
    description: "Surge protection & property liability underwritten by ICICI Lombard. Zero homeowner liability.",
    badge:       "Active Policy",
    iconColor:   "text-ochre",
  },
  {
    icon:        CheckCircle,
    title:       "Host KYC & Title Verification",
    description: "Aadhaar card and October 2026 electricity bill match homeowner identity for Ramesh Verma.",
    badge:       "Verified",
    iconColor:   "text-forest",
  },
];

// ── Main client component ─────────────────────────────────────────────────────
export function SpotClient() {
  const [spot, setSpot]         = useState<ChargingSpot | null>(null);
  const [photos, setPhotos]     = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SpotFormValues>({ resolver: zodResolver(spotSchema) });

  useEffect(() => {
    async function load() {
      try {
        const s = await getMySpot();
        setSpot(s);
        setPhotos(s.photos);
        reset({
          title:          s.title,
          price_per_kwh:  s.price_per_kwh,
          available_from: s.available_from,
          available_to:   s.available_to,
          connector:      s.connector,
          power_kw:       s.power_kw,
          rules:          s.rules ?? "",
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load spot");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reset]);

  async function onSubmit(values: SpotFormValues) {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateMySpot({ ...values, photos });
      setSpot(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const watchedRate = watch("price_per_kwh") ?? 0;
  const netRate     = watchedRate * (1 - 0.126); // 12% platform + GST

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-margin pt-lg pb-xl flex flex-col gap-lg max-w-screen-xl mx-auto" aria-busy>
        <Skeleton className="h-20 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <div className="lg:col-span-7 flex flex-col gap-lg">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !spot) {
    return (
      <div className="px-margin pt-lg pb-xl flex flex-col items-center justify-center min-h-[50vh] gap-md text-center">
        <AlertTriangle className="size-10 text-destructive" />
        <p className="font-heading text-headline-sm">{error ?? "Spot not found"}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="px-margin pt-lg pb-xl flex flex-col w-full max-w-screen-xl mx-auto">

        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-md pb-lg">
          <div className="flex flex-col gap-xs">
            <div className="flex items-center gap-sm">
              <span className="font-heading text-label-sm uppercase tracking-widest text-ochre bg-recessed px-sm py-0.5 rounded">
                Spot Configuration & Telemetry
              </span>
              <span className="inline-flex items-center gap-1 text-forest font-heading text-label-sm">
                <span className="size-2 rounded-full bg-forest animate-pulse-subtle" />
                BESCOM Live: Stable (238V)
              </span>
            </div>
            <h1 className="font-heading text-headline-lg text-forest tracking-tight">{spot.title}</h1>
            <p className="font-body text-body-md text-muted-foreground flex items-center gap-1">
              <MapPin className="size-4 text-charge shrink-0" />
              {spot.address}
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <span className="font-heading text-label-md text-muted-foreground">Last inspected: October 2026</span>
            <div className="bg-surface-high px-md py-xs rounded-xl flex items-center gap-xs">
              <Shield className="size-4 text-forest" />
              <span className="font-heading text-label-sm text-forest uppercase tracking-wider font-bold">
                Tier 1 Verified Hub
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">

          {/* ── LEFT: forms (7 cols) ── */}
          <div className="lg:col-span-7 flex flex-col gap-lg">

            {/* Pricing card */}
            <section className="bg-card rounded-xl p-lg shadow-sm flex flex-col gap-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-lg bg-recessed flex items-center justify-center text-forest">
                    <IndianRupee className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-headline-sm text-foreground">Spot Pricing & Net Take-home</h2>
                    <p className="font-body text-body-sm text-muted-foreground">Dynamic tariff based on local demand</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">Active Tariff</Badge>
              </div>

              <div className="bg-recessed rounded-xl p-md flex flex-col gap-md">
                <Field label="Per kWh Rate (₹9 – ₹20)" error={errors.price_per_kwh?.message}>
                  <div className="flex items-baseline gap-sm">
                    <span className="font-heading text-data-display text-forest leading-none">
                      ₹{(watchedRate || 0).toFixed(2)}
                    </span>
                    <span className="font-heading text-label-sm text-muted-foreground font-bold">/ kWh</span>
                  </div>
                  <input
                    type="range"
                    min={9}
                    max={20}
                    step={0.5}
                    className="w-full accent-charge h-2 bg-border rounded-lg cursor-pointer"
                    {...register("price_per_kwh", { valueAsNumber: true })}
                  />
                  <div className="flex justify-between font-heading text-label-sm text-muted-foreground">
                    <span>₹9.00 (Min)</span>
                    <span className="text-charge font-bold">Neighbourhood avg ₹13/kWh</span>
                    <span>₹20.00 (Peak)</span>
                  </div>
                </Field>

                {/* Net cut */}
                <div className="bg-recessed rounded-lg p-md flex items-center justify-between gap-md">
                  <div className="flex items-center gap-sm">
                    <div className="size-8 rounded-full bg-host-fixed flex items-center justify-center text-forest">
                      <IndianRupee className="size-4" />
                    </div>
                    <div>
                      <span className="font-heading text-label-sm uppercase tracking-wider text-muted-foreground">Host Net Cut (Est.)</span>
                      <p className="font-heading text-headline-sm text-forest font-bold">
                        ₹{netRate.toFixed(2)} / kWh
                      </p>
                    </div>
                  </div>
                  <p className="font-body text-body-sm text-muted-foreground text-right">
                    Includes 12% platform fee & GST.<br />Payout to HDFC Bank daily.
                  </p>
                </div>
              </div>

              {/* Availability grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="bg-recessed rounded-xl p-md flex flex-col gap-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-label-sm uppercase tracking-wider text-muted-foreground">Operating Window</span>
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-sm">
                    <Field label="From" error={errors.available_from?.message}>
                      <input
                        type="time"
                        className={cn(INPUT_BASE, "w-full")}
                        {...register("available_from")}
                      />
                    </Field>
                    <span className="mt-5 text-muted-foreground">–</span>
                    <Field label="To" error={errors.available_to?.message}>
                      <input
                        type="time"
                        className={cn(INPUT_BASE, "w-full")}
                        {...register("available_to")}
                      />
                    </Field>
                  </div>
                </div>

                <div className="bg-recessed rounded-xl p-md flex flex-col gap-sm">
                  <span className="font-heading text-label-sm uppercase tracking-wider text-muted-foreground">Title</span>
                  <Field label="" error={errors.title?.message}>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh's Shaded Driveway"
                      className={INPUT_BASE}
                      {...register("title")}
                    />
                  </Field>
                </div>
              </div>

              {/* Connector + power */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <Field label="Connector Type" error={errors.connector?.message}>
                  <select className={INPUT_BASE} {...register("connector")}>
                    {CONNECTOR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Power Output (kW)" error={errors.power_kw?.message}
                  hint="Max your MCB/wallbox is rated for">
                  <input
                    type="number"
                    step="0.1"
                    className={INPUT_BASE}
                    {...register("power_kw", { valueAsNumber: true })}
                  />
                </Field>
              </div>
            </section>

            {/* Photos + access instructions */}
            <section className="bg-card rounded-xl p-lg shadow-sm flex flex-col gap-md">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-lg bg-recessed flex items-center justify-center text-forest">
                  <Upload className="size-5" />
                </div>
                <div>
                  <h2 className="font-heading text-headline-sm text-foreground">Driveway Photos & Entry Protocol</h2>
                  <p className="font-body text-body-sm text-muted-foreground">Helps EV drivers locate the socket</p>
                </div>
              </div>

              <PhotoUpload photos={photos} onChange={setPhotos} />

              {/* Rules textarea */}
              <Field label="Rider Gate Instructions / House Rules" error={errors.rules?.message}
                hint="Riders see this after booking is accepted">
                <div className="flex items-start gap-sm bg-recessed border border-border rounded-lg p-sm focus-within:ring-2 focus-within:ring-ring transition-colors">
                  <FileText className="size-4 text-muted-foreground mt-1 shrink-0" />
                  <textarea
                    rows={3}
                    placeholder="e.g. Ring bell on arrival. Park close to the left wall..."
                    className="flex-1 bg-transparent font-body text-body-md text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                    {...register("rules")}
                  />
                </div>
              </Field>
            </section>
          </div>

          {/* ── RIGHT: safety checklist (5 cols) ── */}
          <div className="lg:col-span-5 flex flex-col gap-lg">

            {/* Safety governance */}
            <section className="bg-card rounded-xl p-lg shadow-sm flex flex-col gap-lg">
              <div className="flex flex-col gap-sm">
                <div className="flex items-start justify-between">
                  <span className="font-heading text-label-sm uppercase tracking-wider text-muted-foreground">Safety Governance</span>
                  <VerifiedStamp label={`CM VERIFIED #BLR-${spot.id.slice(-4).toUpperCase()}`} />
                </div>
                <h2 className="font-heading text-headline-sm text-forest">Indian Electrical Safety Mandate</h2>
                <p className="font-body text-body-sm text-muted-foreground">
                  All ChargeMate residential stations require a mandatory physical audit of Indian power line earthing & DISCOM sanction.
                </p>
              </div>

              {/* Checklist */}
              <div className="flex flex-col gap-sm">
                {SAFETY_ITEMS.map(({ icon: Icon, title, description, badge, iconColor }) => (
                  <div key={title} className="bg-recessed rounded-xl p-md flex items-start gap-md">
                    <div className="size-8 rounded-full bg-host-fixed flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className={cn("size-4", iconColor)} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-heading text-label-md text-foreground font-bold">{title}</span>
                        <Badge variant="success" size="sm">{badge}</Badge>
                      </div>
                      <p className="font-body text-body-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* BESCOM certificate row */}
              <div className="bg-recessed rounded-xl p-md flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <FileText className="size-5 text-forest" />
                  <div>
                    <p className="font-heading text-label-md text-foreground font-bold">BESCOM NOC Certificate</p>
                    <p className="font-body text-body-sm text-muted-foreground">PDF · Signed by AEE Indiranagar</p>
                  </div>
                </div>
                <button
                  type="button"
                  title="Download Audit Certificate"
                  className="p-xs rounded-lg hover:bg-border text-forest transition-colors"
                >
                  ↓
                </button>
              </div>
            </section>

            {/* Current connector preview */}
            <div className="bg-card rounded-xl p-md shadow-sm flex flex-col gap-sm">
              <span className="font-heading text-label-md text-muted-foreground uppercase tracking-wider">Live Connector Preview</span>
              <ConnectorChip
                type={(watch("connector") as "type2") ?? "type2"}
                power={`${watch("power_kw") ?? 7.2} kW`}
              />
              <p className="font-body text-body-sm text-muted-foreground">
                This is how your charger appears to riders on the map.
              </p>
            </div>

            {/* Save button */}
            <div className="bg-card rounded-xl p-md shadow-sm flex flex-col gap-sm sticky bottom-4">
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="w-full min-h-[52px] bg-host-fixed text-forest font-heading text-label-lg rounded-xl flex items-center justify-center gap-sm"
                  >
                    <CheckCircle className="size-5" />
                    Configuration Saved!
                  </motion.div>
                ) : (
                  <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                      variant="host"
                      size="lg"
                      type="submit"
                      id="save-spot-btn"
                      className="w-full"
                      disabled={saving || !isDirty}
                    >
                      {saving ? (
                        <span className="animate-spin">⟳</span>
                      ) : (
                        <Save className="size-5" />
                      )}
                      {saving ? "Updating Network..." : "Save Spot Configuration"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {saveError && (
                <p className="font-body text-body-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="size-3.5" />{saveError}
                </p>
              )}
              <p className="font-body text-body-sm text-center text-muted-foreground">
                Changes reflect live on rider map in ~45 seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
