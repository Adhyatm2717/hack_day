import type { Metadata } from "next";
import BookingsClient from "./bookings-client";

export const metadata: Metadata = {
  title: "Bookings & Receipts — ChargeMate",
  description: "Your charging session history, receipts, and ChargeMate wallet balance.",
};

export default function BookingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-gutter py-8 space-y-6">
      <BookingsClient />
    </div>
  );
}
