"use client";

/**
 * /garage — My Garage
 *
 * 1. Vehicle list (getMyVehicles) with add / edit / delete
 * 2. Zod-validated add/edit form; connector options depend on vehicle type
 * 3. Loading, empty, error states
 */

import * as React from "react";
import { z } from "zod";
import {
  Plus, Pencil, Trash2, X, Car, Bike, AlertTriangle,
  Battery, Zap, ChevronDown, Check, Loader2,
} from "lucide-react";
import {
  getMyVehicles, addVehicle, updateVehicle, deleteVehicle,
} from "@/lib/data";
import type { Vehicle, VehicleType, ConnectorType } from "@/lib/data";
import { Button } from "@/components/chargemate/button";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/chargemate/card";
import { ConnectorChip } from "@/components/chargemate/connector-chip";

// ── Constants ────────────────────────────────────────────────────────────────

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: React.ReactNode }[] = [
  { value: "car",     label: "Car",        icon: <Car className="size-4" /> },
  { value: "scooter", label: "Scooter",     icon: <Bike className="size-4" /> },
  { value: "bike",    label: "E-Bike",      icon: <Bike className="size-4" /> },
  { value: "auto",    label: "E-Rickshaw",  icon: <Car className="size-4" /> },
];

/** Connector options depend on vehicle type */
function connectorsForType(type: VehicleType): { value: ConnectorType; label: string }[] {
  if (type === "scooter" || type === "bike") {
    return [
      { value: "16A_socket", label: "16A Socket" },
      { value: "3pin",       label: "3-Pin Plug" },
    ];
  }
  return [
    { value: "CCS2",        label: "CCS2 (DC Fast)" },
    { value: "Type2",       label: "Type 2 AC" },
    { value: "16A_socket",  label: "16A Socket" },
    { value: "3pin",        label: "3-Pin Plug" },
  ];
}

// ── Zod schema ───────────────────────────────────────────────────────────────

const vehicleSchema = z.object({
  type:        z.enum(["car", "scooter", "bike", "auto"]),
  make:        z.string().min(1, "Make is required").max(50),
  model:       z.string().min(1, "Model is required").max(80),
  connector:   z.enum(["CCS2", "Type2", "16A_socket", "3pin"]),
  battery_kwh: z.number()
                .positive("Must be positive")
                .max(200, "Max 200 kWh"),
}).refine(
  (d) => {
    const allowed = connectorsForType(d.type).map((c) => c.value);
    return allowed.includes(d.connector);
  },
  { message: "This connector is not available for the selected vehicle type", path: ["connector"] }
);

type VehicleFormData = z.infer<typeof vehicleSchema>;

// ── Vehicle card ─────────────────────────────────────────────────────────────

function VehicleCard({
  vehicle,
  isPrimary,
  onEdit,
  onDelete,
  deleting,
}: {
  vehicle: Vehicle;
  isPrimary: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const chipType = vehicle.connector === "CCS2" ? "ccs2" as const
    : vehicle.connector === "Type2" ? "type2" as const
    : "16a" as const;

  return (
    <Card className="overflow-hidden group hover:shadow-card-hover transition-shadow">
      {/* Header badge row */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isPrimary ? "bg-charge animate-pulse-subtle" : "bg-border"}`} />
          <span className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">
            {isPrimary ? "Primary Vehicle" : "Secondary"}
          </span>
        </div>
        <span className="font-heading text-label-sm uppercase tracking-wider text-forest bg-host-fixed px-2 py-0.5 rounded">
          {vehicle.type}
        </span>
      </div>

      <CardContent className="space-y-3">
        {/* Name */}
        <div>
          <h3 className="font-heading text-headline-md text-foreground">
            {vehicle.make} {vehicle.model}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <ConnectorChip type={chipType} power={`${vehicle.battery_kwh} kWh`} />
          </div>
        </div>

        {/* Specs row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-recessed rounded-lg p-3 space-y-0.5">
            <Battery className="size-4 text-charge" />
            <p className="font-heading text-headline-sm text-foreground">
              {vehicle.battery_kwh} <span className="text-label-lg text-muted-foreground font-normal">kWh</span>
            </p>
            <p className="text-body-sm text-muted-foreground">Battery pack</p>
          </div>
          <div className="bg-recessed rounded-lg p-3 space-y-0.5">
            <Zap className="size-4 text-forest" />
            <p className="font-heading text-headline-sm text-foreground">
              {Math.round(vehicle.battery_kwh * 6)} <span className="text-label-lg text-muted-foreground font-normal">km</span>
            </p>
            <p className="text-body-sm text-muted-foreground">Est. range</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <span className="text-body-sm text-muted-foreground">
          Added {new Date(vehicle.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-body-sm text-charge font-heading hover:underline"
            aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex items-center gap-1 text-body-sm text-destructive font-heading hover:underline disabled:opacity-50"
            aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            Delete
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}

// ── Vehicle form modal ───────────────────────────────────────────────────────

function VehicleFormModal({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle | null;           // null = add mode
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!vehicle;
  const [form, setForm] = React.useState<VehicleFormData>({
    type:        vehicle?.type ?? "car",
    make:        vehicle?.make ?? "",
    model:       vehicle?.model ?? "",
    connector:   vehicle?.connector ?? "CCS2",
    battery_kwh: vehicle?.battery_kwh ?? 24,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  // When type changes, reset connector if the current one is invalid
  React.useEffect(() => {
    const allowed = connectorsForType(form.type).map((c) => c.value);
    if (!allowed.includes(form.connector)) {
      setForm((f) => ({ ...f, connector: allowed[0] }));
    }
  }, [form.type, form.connector]);

  function handleChange(field: keyof VehicleFormData, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const result = vehicleSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      if (isEdit && vehicle) {
        await updateVehicle(vehicle.id, result.data);
      } else {
        await addVehicle(result.data);
      }
      onSaved();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const connectorOptions = connectorsForType(form.type);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[900]" onClick={onClose} aria-hidden />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal
        aria-label={isEdit ? "Edit vehicle" : "Add vehicle"}
        className="
          fixed bottom-0 left-0 right-0 z-[901]
          bg-card rounded-t-2xl shadow-2xl
          p-5 space-y-4
          animate-slide-in-up
          max-w-lg mx-auto
          md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:rounded-2xl md:right-auto md:w-full
          max-h-[90vh] overflow-y-auto
        "
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-headline-sm text-foreground flex items-center gap-2">
            {isEdit ? <Pencil className="size-5 text-charge" /> : <Plus className="size-5 text-charge" />}
            {isEdit ? "Edit Vehicle" : "Add New Vehicle"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-recessed text-muted-foreground" aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle type */}
          <fieldset className="space-y-1.5">
            <legend className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">Vehicle type</legend>
            <div className="grid grid-cols-4 gap-2">
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleChange("type", t.value)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl border text-body-sm font-heading
                    transition-all
                    ${form.type === t.value
                      ? "border-charge bg-charge-fixed text-charge"
                      : "border-border bg-recessed text-muted-foreground hover:border-foreground/30"}
                  `}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Make */}
          <div className="space-y-1">
            <label htmlFor="vehicle-make" className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">Make</label>
            <input
              id="vehicle-make"
              value={form.make}
              onChange={(e) => handleChange("make", e.target.value)}
              placeholder="e.g. Tata, Ather, MG"
              className={`w-full bg-recessed border rounded-lg px-3 py-2.5 text-body-md font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-charge/40 ${errors.make ? "border-destructive" : "border-border"}`}
            />
            {errors.make && <p className="text-body-sm text-destructive">{errors.make}</p>}
          </div>

          {/* Model */}
          <div className="space-y-1">
            <label htmlFor="vehicle-model" className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">Model</label>
            <input
              id="vehicle-model"
              value={form.model}
              onChange={(e) => handleChange("model", e.target.value)}
              placeholder="e.g. Tiago EV, 450X Gen 3"
              className={`w-full bg-recessed border rounded-lg px-3 py-2.5 text-body-md font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-charge/40 ${errors.model ? "border-destructive" : "border-border"}`}
            />
            {errors.model && <p className="text-body-sm text-destructive">{errors.model}</p>}
          </div>

          {/* Connector */}
          <div className="space-y-1">
            <label htmlFor="vehicle-connector" className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">Connector type</label>
            <div className="relative">
              <select
                id="vehicle-connector"
                value={form.connector}
                onChange={(e) => handleChange("connector", e.target.value)}
                className={`w-full appearance-none bg-recessed border rounded-lg px-3 py-2.5 pr-8 text-body-md font-body text-foreground focus:outline-none focus:ring-2 focus:ring-charge/40 ${errors.connector ? "border-destructive" : "border-border"}`}
              >
                {connectorOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.connector && <p className="text-body-sm text-destructive">{errors.connector}</p>}
          </div>

          {/* Battery kWh */}
          <div className="space-y-1">
            <label htmlFor="vehicle-battery" className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">Battery capacity (kWh)</label>
            <input
              id="vehicle-battery"
              type="number"
              step="0.1"
              min="0.1"
              max="200"
              value={form.battery_kwh}
              onChange={(e) => handleChange("battery_kwh", parseFloat(e.target.value) || 0)}
              className={`w-full bg-recessed border rounded-lg px-3 py-2.5 text-body-md font-body text-foreground focus:outline-none focus:ring-2 focus:ring-charge/40 ${errors.battery_kwh ? "border-destructive" : "border-border"}`}
            />
            {errors.battery_kwh && <p className="text-body-sm text-destructive">{errors.battery_kwh}</p>}
          </div>

          {apiError && (
            <p className="text-body-sm text-destructive flex items-center gap-1.5">
              <AlertTriangle className="size-4" />
              {apiError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>Cancel</Button>
            <button
              type="submit"
              disabled={saving}
              className="
                min-h-[52px] flex items-center justify-center gap-2
                bg-charge text-white font-heading text-label-lg
                rounded-xl shadow-md hover:brightness-105 active:scale-[0.98]
                transition-all disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-5" />}
              {saving ? "Saving…" : isEdit ? "Update" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function GarageClient() {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = React.useState<Vehicle | null | "add">(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function reload() {
    setLoading(true);
    setError(null);
    getMyVehicles()
      .then(setVehicles)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  React.useEffect(() => { reload(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this vehicle? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteVehicle(id);
      reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-1/3 rounded-lg bg-recessed" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-52 rounded-xl bg-recessed" />)}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="text-center py-10 space-y-3">
        <AlertTriangle className="size-10 text-destructive mx-auto" />
        <p className="font-heading text-headline-sm text-foreground">Failed to load vehicles</p>
        <p className="text-body-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={reload}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-heading text-data-display text-forest">01</span>
          <div>
            <h2 className="font-heading text-headline-md text-foreground">Registered EV Fleet</h2>
            <p className="text-body-sm text-muted-foreground">
              Active chargers communicate with saved vehicle connector presets
            </p>
          </div>
        </div>
        <Button
          id="add-vehicle-btn"
          variant="outline"
          onClick={() => setEditingVehicle("add")}
          className="self-start sm:self-auto"
        >
          <Plus className="size-4 text-charge" />
          Add New EV
        </Button>
      </div>

      {/* Empty state */}
      {vehicles.length === 0 && (
        <Card className="text-center py-10">
          <CardContent className="space-y-3">
            <Car className="size-12 text-muted-foreground mx-auto" />
            <p className="font-heading text-headline-sm text-foreground">No vehicles yet</p>
            <p className="text-body-sm text-muted-foreground max-w-xs mx-auto">
              Add your EV to start finding compatible charging spots nearby.
            </p>
            <Button variant="charge" onClick={() => setEditingVehicle("add")}>
              <Plus className="size-4" /> Add your first vehicle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Vehicle grid */}
      {vehicles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vehicles.map((v, i) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              isPrimary={i === 0}
              onEdit={() => setEditingVehicle(v)}
              onDelete={() => handleDelete(v.id)}
              deleting={deletingId === v.id}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {editingVehicle !== null && (
        <VehicleFormModal
          vehicle={editingVehicle === "add" ? null : editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSaved={() => { setEditingVehicle(null); reload(); }}
        />
      )}
    </>
  );
}
