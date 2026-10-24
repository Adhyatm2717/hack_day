"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Battery, Car, CheckCircle, Clock, Inbox, MapPin, Play, RefreshCw, User, Zap } from "lucide-react";
import { Button } from "@/components/chargemate/button";
import { Badge } from "@/components/chargemate/badge";
import { getIncomingRequests, acceptBooking, declineBooking, startSession, getSessionProgress, getVehicle, type Booking, type SessionProgress } from "@/lib/data";

const RIDERS: Record<string, string> = { "rider-pooja-001": "Pooja Hegde", "rider-aarav-002": "Aarav Sharma", "rider-kavya-003": "Kavya R.", "rider-deepak-004": "Deepak M.", "rider-sarita-005": "Sarita G." };
const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const estimate = (batteryPct: number, capacity = 24) => Math.round((100 - batteryPct) / 100 * capacity * 12 * 0.874);
const eta = (batteryPct: number, capacity = 24) => Math.max(1, Math.round(((100 - batteryPct) / 100 * capacity / 7.2) * 60));

function RequestCard({ booking, onAccept, onDecline }: { booking: Booking; onAccept: (id: string) => Promise<void>; onDecline: (id: string) => Promise<void> }) {
  const [vehicle, setVehicle] = useState<{ make: string; model: string; battery_kwh: number } | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { getVehicle(booking.vehicle_id).then(setVehicle).catch(() => setVehicle(null)); }, [booking.vehicle_id]);
  const carName = vehicle ? `${vehicle.make} ${vehicle.model}` : "Electric vehicle";
  const capacity = vehicle?.battery_kwh ?? 24;
  async function act(type: "accept" | "decline") { setBusy(type); setMessage(""); try { await (type === "accept" ? onAccept(booking.id) : onDecline(booking.id)); } catch (e) { setMessage(e instanceof Error ? e.message : "Could not update this request."); } finally { setBusy(""); } }
  return <article className="bg-card rounded-xl shadow-sm overflow-hidden"><div className="h-1.5 bg-charge"/><div className="p-md lg:p-lg flex flex-col gap-md">
    <div className="flex flex-wrap items-center justify-between gap-sm"><div className="flex items-center gap-sm"><div className="size-11 rounded-full bg-host-fixed flex items-center justify-center text-forest"><User className="size-5"/></div><div><h2 className="font-heading text-headline-sm">{RIDERS[booking.rider_id] ?? "EV Driver"}</h2><p className="text-body-sm text-muted-foreground">{carName}</p></div></div><span className="inline-flex items-center gap-1.5 rounded-full bg-charge-fixed px-sm py-xs text-label-md text-charge"><Zap className="size-3.5"/>Charge request</span></div>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-sm text-center bg-recessed p-sm rounded-lg">
      <Metric icon={Battery} label="Battery" value={`${booking.start_battery_pct}%`}/><Metric icon={Clock} label="ETA" value={`${eta(booking.start_battery_pct, capacity)} min`}/><Metric icon={MapPin} label="Distance" value="0.9 km"/><Metric icon={Car} label="Vehicle" value={carName}/><Metric icon={Zap} label="Est. payout" value={rupees(estimate(booking.start_battery_pct, capacity))}/>
    </div>
    <div className="flex flex-col sm:flex-row gap-sm"><Button variant="host" className="flex-1" disabled={Boolean(busy)} onClick={() => void act("accept")}><CheckCircle className="size-4"/>{busy === "accept" ? "Accepting…" : "Accept"}</Button><button className="min-h-11 px-md rounded-xl bg-recessed text-muted-foreground font-heading text-label-md hover:bg-surface-high disabled:opacity-50" disabled={Boolean(busy)} onClick={() => void act("decline")}>{busy === "decline" ? "Declining…" : "Decline"}</button></div>
    {message && <p role="alert" className="rounded-lg bg-charge-fixed text-charge px-md py-sm text-body-sm">{message.toLowerCase().includes("15") || message.toLowerCase().includes("gap") ? `This booking is blocked by the 15-minute gap rule. ${message}` : message}</p>}
  </div></article>;
}
function Metric({ icon: Icon, label, value }: { icon: typeof Battery; label: string; value: string }) { return <div className="min-w-0 flex flex-col items-center gap-xs"><span className="text-label-sm uppercase text-muted-foreground">{label}</span><span className="font-heading text-label-md sm:text-headline-sm text-forest flex items-center gap-1"><Icon className="size-4 shrink-0 text-charge"/>{value}</span></div>; }

export function RequestsClient() {
  const [requests, setRequests] = useState<Booking[]>([]);
  const [accepted, setAccepted] = useState<Booking | null>(null);
  const [session, setSession] = useState<SessionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [starting, setStarting] = useState(false);
  const load = useCallback(async (initial = false) => { try { setError(""); setRequests(await getIncomingRequests()); } catch (e) { setError(e instanceof Error ? e.message : "Could not load requests."); } finally { if (initial) setLoading(false); } }, []);
  useEffect(() => { void load(true); const id = window.setInterval(() => void load(), 5000); return () => window.clearInterval(id); }, [load]);
  useEffect(() => { if (accepted?.status !== "charging") return; let alive = true; const refresh = async () => { try { const p = await getSessionProgress(accepted.id); if (alive) setSession(p); } catch { /* a transient poll failure is recovered on next interval */ } }; void refresh(); const id = window.setInterval(() => void refresh(), 3000); return () => { alive = false; window.clearInterval(id); }; }, [accepted]);
  async function onAccept(id: string) { setActionError(""); const booking = await acceptBooking(id); setAccepted(booking); setRequests(items => items.filter(item => item.id !== id)); }
  async function onDecline(id: string) { await declineBooking(id); setRequests(items => items.filter(item => item.id !== id)); }
  async function beginSession() { if (!accepted) return; setStarting(true); setActionError(""); try { setAccepted(await startSession(accepted.id)); } catch (e) { const message = e instanceof Error ? e.message : "Could not start the session."; setActionError(message.toLowerCase().includes("15") || message.toLowerCase().includes("gap") ? `The 15-minute gap rule is blocking this booking. ${message}` : message); } finally { setStarting(false); } }
  if (loading) return <div className="p-gutter lg:p-margin max-w-screen-xl mx-auto space-y-md" aria-busy="true"><div className="h-14 w-64 bg-recessed animate-pulse rounded-lg"/><div className="h-64 bg-recessed animate-pulse rounded-xl"/></div>;
  if (error) return <div className="p-gutter lg:p-margin min-h-[40vh] flex flex-col items-center justify-center gap-md text-center"><AlertTriangle className="size-9 text-destructive"/><p className="font-heading text-headline-sm">{error}</p><Button variant="outline" onClick={() => void load(true)}>Retry</Button></div>;
  return <div className="p-gutter lg:p-margin max-w-screen-xl mx-auto flex flex-col gap-lg">
    <header className="flex flex-wrap justify-between items-end gap-md"><div><span className="font-heading text-label-sm uppercase tracking-widest text-ochre">Host operations</span><h1 className="font-heading text-headline-lg text-forest mt-xs">Live Requests</h1><p className="text-body-md text-muted-foreground mt-xs">Incoming charging requests and active sessions</p></div><button className="inline-flex items-center gap-xs text-label-md text-muted-foreground hover:text-forest" onClick={() => void load()}><RefreshCw className="size-4"/>Refreshes every 5 seconds</button></header>
    {accepted && <section className="bg-forest text-forest-foreground rounded-xl p-md lg:p-lg flex flex-col gap-md"><div className="flex items-center gap-sm"><CheckCircle className="size-5 text-host-fixed"/><h2 className="font-heading text-headline-sm">Booking accepted</h2><Badge variant={accepted.status === "charging" ? "charge" : "success"} size="sm">{accepted.status === "charging" ? "Session live" : "Awaiting arrival"}</Badge></div>{accepted.status !== "charging" ? <><p className="text-body-sm text-forest-foreground/80">Share this gate PIN with {RIDERS[accepted.rider_id] ?? "the rider"} when they arrive.</p><div className="font-mono tracking-[0.35em] text-headline-lg font-bold">{accepted.gate_pin ?? "----"}</div><Button variant="host" disabled={starting} onClick={() => void beginSession()}><Play className="size-4"/>{starting ? "Starting…" : "Start session"}</Button>{actionError && <p role="alert" className="bg-charge-fixed text-charge rounded-lg p-sm text-body-sm">{actionError}</p>}</> : <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">{[["Battery", `${session?.batteryPct ?? accepted.start_battery_pct}%`],["Energy", `${session?.kwhUsed ?? 0} kWh`],["Elapsed", session ? `${Math.floor(session.elapsedSec/60)} min` : "Starting…"],["Current total", rupees(session?.costInr ?? 0)]].map(([label,value]) => <div key={label}><p className="text-label-sm text-forest-foreground/65">{label}</p><p className="font-heading text-headline-sm">{value}</p></div>)}</div>}</section>}
    <section className="flex flex-col gap-md"><div className="flex items-center justify-between"><h2 className="font-heading text-headline-sm text-forest">Incoming requests</h2><span className="px-sm py-xs rounded-full bg-charge-fixed text-charge font-heading text-label-md">{requests.length} pending</span></div>{requests.length ? requests.map(booking => <RequestCard key={booking.id} booking={booking} onAccept={onAccept} onDecline={onDecline}/>) : <div className="bg-card rounded-xl shadow-sm py-14 flex flex-col items-center gap-sm text-center"><div className="size-14 rounded-full bg-host-fixed flex items-center justify-center"><Inbox className="size-7 text-forest"/></div><h3 className="font-heading text-headline-sm">No pending requests</h3><p className="text-body-sm text-muted-foreground">New charge requests will appear here automatically.</p><span className="inline-flex items-center gap-xs text-label-sm text-forest"><span className="size-2 rounded-full bg-forest animate-pulse"/>Listening for requests</span></div>}</section>
    <p className="text-body-sm text-muted-foreground border-t border-border pt-md flex items-center gap-xs"><Clock className="size-4 shrink-0"/>A 15-minute gap is required between consecutive charging sessions. Requests that fall inside this window cannot be started.</p>
  </div>;
}
