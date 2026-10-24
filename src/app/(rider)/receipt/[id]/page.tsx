import type { Metadata } from "next";
import ReceiptClient from "./receipt-client";

export const metadata: Metadata = {
  title: "Receipt — ChargeMate",
  description: "Your charging session receipt with energy, cost, and duration details.",
};

export default function ReceiptPage({ params }: { params: { id: string } }) {
  return <ReceiptClient params={params} />;
}
