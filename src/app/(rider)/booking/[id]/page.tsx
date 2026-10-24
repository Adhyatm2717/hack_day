import type { Metadata } from "next";
import BookingClient from "./booking-client";

export const metadata: Metadata = {
  title: "Booking — ChargeMate",
  description: "Track your charging booking request status.",
};

export default function BookingPage({ params }: { params: { id: string } }) {
  return <BookingClient params={params} />;
}
