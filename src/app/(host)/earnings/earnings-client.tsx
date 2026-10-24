"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee, TrendingUp, Star, Download,
  AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownLeft,
  Wallet, CreditCard, Edit, Save, X, Calendar,
} from "lucide-react";
import { StatCard } from "@/components/chargemate/stat-card";
import { RevenueChart } from "@/components/chargemate/revenue-chart";
import { Badge } from "@/components/chargemate/badge";
import { Button } from "@/components/chargemate/button";
import { cn } from "@/lib/utils";
import {
  getEarningsSummary,
  getMonthlyRevenue,
  getLedger,
  getPayoutSettings,
  setUpiId,
  getReviewsForHost,
  replyToReview,
  MOCK_HOST_ID,
  type EarningsSummary,
  type MonthlyRevenue,
  type LedgerEntry,
  type PayoutSettings,
  type Review,
} from "@/lib/data";

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-recessed rounded-lg ${className}`} />;
}

// ── Ledger row ────────────────────────────────────────────────────────────────
function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const date = new Date(entry.date);
  const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const isCredit = entry.type === "credit";

  return (
    <div className="flex items-center justify-between p-sm hover:bg-recessed rounded-lg transition-colors gap-md">
      <div className="flex items-center gap-md">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          isCredit ? "bg-host-fixed" : "bg-charge-fixed"
        )}>
          {isCredit ? (
            <ArrowDownLeft className="size-4 text-forest" />
          ) : (
            <ArrowUpRight className="size-4 text-charge" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-label-md text-foreground">{entry.label}</span>
          <span className="font-body text-body-sm text-muted-foreground">
            {dateStr} · {timeStr}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-sm shrink-0">
        <span className={cn(
          "font-heading text-headline-sm",
          isCredit ? "text-forest" : "text-charge"
        )}>
          {isCredit ? "+" : "−"}₹{entry.amountInr.toLocaleString("en-IN")}
        </span>
        <Badge variant={entry.status === "paid" ? "success" : "muted"} size="sm">
          {entry.status === "paid" ? "Paid" : "Pending"}
        </Badge>
      </div>
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, onReply }: { review: Review; onReply: (id: string, text: string) => Promise<void> }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.reply ?? "");
  const [saving, setSaving] = useState(false);
  const date = new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  async function handleSaveReply() {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      await onReply(review.id, replyText.trim());
      setReplying(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card rounded-xl p-md shadow-sm flex flex-col gap-sm">
      {/* Rating + date header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn("size-4", i < review.rating ? "text-ochre fill-ochre" : "text-border")}
            />
          ))}
          <span className="font-heading text-label-sm text-muted-foreground ml-1">{review.rating}/5</span>
        </div>
        <span className="font-body text-body-sm text-muted-foreground">{date}</span>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="font-body text-body-md text-foreground leading-relaxed">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}

      {/* Existing reply */}
      {review.reply && !replying && (
        <div className="bg-host-fixed rounded-lg p-sm flex items-start gap-sm">
          <span className="font-heading text-label-sm text-forest shrink-0 mt-0.5">Your reply:</span>
          <p className="font-body text-body-sm text-foreground">{review.reply}</p>
        </div>
      )}

      {/* Reply editor */}
      {replying ? (
        <div className="flex flex-col gap-sm">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a thoughtful reply…"
            className="w-full bg-recessed border border-border rounded-lg px-md py-sm font-body text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center gap-sm justify-end">
            <button
              type="button"
              onClick={() => { setReplying(false); setReplyText(review.reply ?? ""); }}
              className="px-md py-xs rounded-lg font-heading text-label-md text-muted-foreground hover:bg-recessed transition-colors"
            >
              Cancel
            </button>
            <Button variant="host" size="sm" disabled={saving || !replyText.trim()} onClick={handleSaveReply}>
              {saving ? <span className="animate-spin">⟳</span> : <Save className="size-3.5" />}
              {saving ? "Saving…" : "Post Reply"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setReplying(true)}
          className="self-start font-heading text-label-md text-forest hover:underline flex items-center gap-1"
        >
          <Edit className="size-3.5" />
          {review.reply ? "Edit Reply" : "Reply to Review"}
        </button>
      )}
    </div>
  );
}

// ── Payout settings card ──────────────────────────────────────────────────────
function PayoutCard({ settings, onSave }: { settings: PayoutSettings; onSave: (upi: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [upi, setUpi] = useState(settings.upiId ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(upi ?? "");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-forest text-forest-foreground rounded-xl p-md shadow-md flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-host-fixed" />
          <span className="font-heading text-label-lg uppercase tracking-wider text-host-fixed font-bold">
            UPI Payout Settings
          </span>
        </div>
        <span className="font-heading text-label-sm text-forest-foreground/60 bg-forest-foreground/10 px-2 py-0.5 rounded">
          {settings.bankName}
        </span>
      </div>

      {editing ? (
        <div className="flex flex-col gap-sm">
          <label className="font-heading text-label-sm text-forest-foreground/70 uppercase">UPI ID</label>
          <input
            type="text"
            value={upi ?? ""}
            onChange={(e) => setUpi(e.target.value)}
            className="w-full bg-forest-foreground/10 border border-forest-foreground/20 rounded-lg px-md py-sm font-mono text-body-md text-forest-foreground focus:outline-none focus:ring-2 focus:ring-host-fixed"
          />
          <div className="flex items-center gap-sm justify-end">
            <button
              type="button"
              onClick={() => { setEditing(false); setUpi(settings.upiId ?? ""); }}
              className="px-md py-xs rounded-lg font-heading text-label-md text-forest-foreground/70 hover:text-forest-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-md py-xs bg-host-fixed text-forest rounded-lg font-heading text-label-md font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving…" : "Update UPI"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-heading text-label-sm text-forest-foreground/60">Active UPI</span>
              <span className="font-mono text-headline-sm text-forest-foreground">{settings.upiId}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-sm py-xs rounded-lg bg-forest-foreground/10 text-forest-foreground/80 hover:text-forest-foreground font-heading text-label-sm transition-colors flex items-center gap-1"
            >
              <Edit className="size-3.5" /> Edit
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-forest-foreground/20 pt-sm font-body text-body-sm text-forest-foreground/60">
            <span>Account: ****{settings.accountLast4}</span>
            <span>Settlement: Daily 11:59 PM</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export function EarningsClient() {
  const [summary, setSummary]   = useState<EarningsSummary | null>(null);
  const [revenue, setRevenue]   = useState<MonthlyRevenue[]>([]);
  const [ledger, setLedger]     = useState<LedgerEntry[]>([]);
  const [payout, setPayout]     = useState<PayoutSettings | null>(null);
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, rev, led, pay, rvw] = await Promise.all([
        getEarningsSummary(),
        getMonthlyRevenue(6),
        getLedger(),
        getPayoutSettings(),
        getReviewsForHost(MOCK_HOST_ID),
      ]);
      setSummary(s);
      setRevenue(rev);
      setLedger(led);
      setPayout(pay);
      setReviews(rvw);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpdateUpi(upi: string) {
    const updated = await setUpiId(upi);
    setPayout(updated);
  }

  async function handleReply(id: string, text: string) {
    const updated = await replyToReview(id, text);
    setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-gutter lg:p-margin flex flex-col gap-lg max-w-screen-xl mx-auto" aria-busy>
        <Skeleton className="h-16 w-80" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-gutter lg:p-margin flex flex-col items-center justify-center min-h-[40vh] gap-md text-center">
        <AlertTriangle className="size-10 text-destructive" />
        <p className="font-heading text-headline-sm">{error}</p>
        <Button variant="outline" onClick={load}>Retry</Button>
      </div>
    );
  }

  const totalEarnings = revenue.reduce((sum, m) => sum + m.revenue, 0);
  const totalSessions = revenue.reduce((sum, m) => sum + m.sessions, 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  return (
    <div className="p-gutter lg:p-margin flex flex-col gap-lg max-w-screen-xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-xs">
        <div className="flex items-center gap-sm">
          <span className="font-heading text-label-sm uppercase tracking-widest text-ochre bg-ochre-fixed px-2 py-0.5 rounded">
            Financial Overview
          </span>
          <span className="font-heading text-label-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3.5" /> FY 2026–27
          </span>
        </div>
        <h1 className="font-heading text-headline-lg text-forest tracking-tight">Earnings & Payouts</h1>
        <p className="font-body text-body-md text-muted-foreground">
          Revenue analytics, transaction ledger and rider reviews
        </p>
      </div>

      {/* Stat cards */}
      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md" aria-label="Revenue stats">
          <StatCard
            id="stat-total"
            label="6-Month Revenue"
            value={`₹${totalEarnings.toLocaleString("en-IN")}`}
            subtitle={`${totalSessions} sessions`}
            icon={IndianRupee}
            accentColor="forest"
            footerLeft="Since May 2026"
            footerRight="+120%"
          />
          <StatCard
            id="stat-thismonth"
            label="October 2026"
            value={`₹${summary.thisMonth.toLocaleString("en-IN")}`}
            subtitle="+22% vs September"
            icon={TrendingUp}
            accentColor="charge"
            footerLeft={`${summary.sessionCount} sessions`}
            footerRight="Peak month"
          />
          <StatCard
            id="stat-today-earn"
            label="Today"
            value={`₹${summary.today.toLocaleString("en-IN")}`}
            subtitle={`${summary.sessionCount} sessions so far`}
            icon={IndianRupee}
            accentColor="ochre"
            footerLeft="UPI instant"
            footerRight="Settled"
          />
          <StatCard
            id="stat-reviews"
            label="Avg Rating"
            value={avgRating}
            unit="★"
            subtitle={`${reviews.length} reviews`}
            icon={Star}
            accentColor="forest"
            footerLeft="Indiranagar Hub"
            footerRight="Top 5%"
          />
        </section>
      )}

      {/* Main grid: chart + ledger | payout + reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">

        {/* Left (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-lg">

          {/* 6-Month revenue chart */}
          <section className="bg-card rounded-xl p-md lg:p-lg shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between flex-wrap gap-sm">
              <div>
                <h2 className="font-heading text-headline-sm text-forest">6-Month Revenue Trend</h2>
                <p className="font-body text-body-sm text-muted-foreground">May → October 2026</p>
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 px-sm py-xs bg-recessed rounded-lg font-heading text-label-md text-forest hover:bg-surface-high transition-colors"
              >
                <Download className="size-4" />
                Export CSV
              </button>
            </div>
            <RevenueChart data={revenue} />
          </section>

          {/* Transaction ledger */}
          <section className="bg-card rounded-xl p-md lg:p-lg shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-headline-sm text-forest">Transaction Ledger</h2>
                <p className="font-body text-body-sm text-muted-foreground">All credits and payouts</p>
              </div>
              <Badge variant="muted" size="sm">{ledger.length} entries</Badge>
            </div>

            <div className="flex flex-col divide-y divide-border">
              {ledger.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </div>

            {ledger.length === 0 && (
              <div className="py-12 text-center text-muted-foreground font-body text-body-md">
                No transactions yet.
              </div>
            )}
          </section>
        </div>

        {/* Right (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-lg">

          {/* Payout settings */}
          {payout && <PayoutCard settings={payout} onSave={handleUpdateUpi} />}

          {/* Reviews section */}
          <section className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-headline-sm text-forest">Rider Reviews</h2>
                <p className="font-body text-body-sm text-muted-foreground">{reviews.length} reviews · avg {avgRating}★</p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="py-12 text-center bg-card rounded-xl shadow-sm">
                <Star className="size-10 text-border mx-auto mb-2" />
                <p className="font-body text-body-md text-muted-foreground">No reviews yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-sm">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} onReply={handleReply} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-md border-t border-border flex flex-col sm:flex-row items-center justify-between text-muted-foreground font-body text-body-sm gap-2">
        <p>© 2026 ChargeMate · All rights reserved</p>
        <p>GST: 29AXXPV1234R1ZX · Registered under Karnataka Electricity Act</p>
      </footer>
    </div>
  );
}
