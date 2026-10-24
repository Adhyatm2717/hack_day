import type { EarningsSummary, LedgerEntry, MonthlyRevenue, PayoutSettings } from "@/types/db";

// ── Seed data ─────────────────────────────────────────────────────────────────

const MOCK_LEDGER: LedgerEntry[] = [
  {
    id:        "ledger-001",
    date:      "2026-10-24T12:32:00.000Z",
    label:     "Kavya R. · Nexon EV Max",
    amountInr: 216,
    type:      "credit",
    status:    "paid",
  },
  {
    id:        "ledger-002",
    date:      "2026-10-24T09:10:00.000Z",
    label:     "Deepak M. · Tata Punch EV",
    amountInr: 156,
    type:      "credit",
    status:    "paid",
  },
  {
    id:        "ledger-003",
    date:      "2026-10-24T06:45:00.000Z",
    label:     "Sarita G. · Nexon EV",
    amountInr: 114,
    type:      "credit",
    status:    "paid",
  },
  {
    id:        "ledger-004",
    date:      "2026-10-23T19:30:00.000Z",
    label:     "Aarav S. · MG Windsor EV",
    amountInr: 192,
    type:      "credit",
    status:    "paid",
  },
  {
    id:        "ledger-005",
    date:      "2026-10-23T15:00:00.000Z",
    label:     "Ritika P. · Tiago EV",
    amountInr: 120,
    type:      "credit",
    status:    "paid",
  },
  {
    id:        "ledger-006",
    date:      "2026-10-15T11:00:00.000Z",
    label:     "Platform payout (Oct 1–15)",
    amountInr: 3840,
    type:      "credit",
    status:    "paid",
  },
  {
    id:        "ledger-007",
    date:      "2026-09-30T11:00:00.000Z",
    label:     "Platform payout (Sep)",
    amountInr: 7850,
    type:      "credit",
    status:    "paid",
  },
];

const MOCK_MONTHLY: MonthlyRevenue[] = [
  { month: "May 26", revenue: 4200,  sessions: 28,  kwhTotal: 350  },
  { month: "Jun 26", revenue: 5600,  sessions: 37,  kwhTotal: 466  },
  { month: "Jul 26", revenue: 6100,  sessions: 41,  kwhTotal: 508  },
  { month: "Aug 26", revenue: 7200,  sessions: 48,  kwhTotal: 600  },
  { month: "Sep 26", revenue: 7850,  sessions: 52,  kwhTotal: 654  },
  { month: "Oct 26", revenue: 9240,  sessions: 62,  kwhTotal: 770  },
];

let MOCK_UPI = "ramesh.verma@upi";

// ── Public API ────────────────────────────────────────────────────────────────

/** Host: returns today's earnings, month total, energy dispensed, and avg rating. */
export async function getEarningsSummary(): Promise<EarningsSummary> {
  return {
    today:        486,
    thisMonth:    9240,
    energyKwh:    148,
    rating:       4.9,
    sessionCount: 62,
  };
}

/**
 * Host: returns monthly revenue for the last N months (default 6).
 * Array ordered oldest → newest.
 */
export async function getMonthlyRevenue(months: number = 6): Promise<MonthlyRevenue[]> {
  return MOCK_MONTHLY.slice(-months);
}

/** Host: returns the full transaction ledger, newest first. */
export async function getLedger(): Promise<LedgerEntry[]> {
  return [...MOCK_LEDGER].sort((a, b) => b.date.localeCompare(a.date));
}

/** Host: returns the current payout/bank settings. */
export async function getPayoutSettings(): Promise<PayoutSettings> {
  return {
    upiId:        MOCK_UPI,
    bankName:     "HDFC Bank",
    accountLast4: "4321",
  };
}

/** Host: update the UPI ID for payouts. */
export async function setUpiId(upi: string): Promise<PayoutSettings> {
  MOCK_UPI = upi;
  return getPayoutSettings();
}
