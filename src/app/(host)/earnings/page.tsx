import type { Metadata } from "next";
import { EarningsClient } from "./earnings-client";

export const metadata: Metadata = {
  title: "Earnings & Payouts",
  description: "Track your EV charging revenue, transaction ledger and UPI payout settings.",
};

export default function EarningsPage() {
  return <EarningsClient />;
}
