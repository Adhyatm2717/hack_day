import type { Metadata } from "next";
import { SpotClient } from "./spot-client";

export const metadata: Metadata = {
  title: "My Charger & Spot",
  description: "Edit your EV charging spot details, pricing, availability and safety verification.",
};

export default function MySpotPage() {
  return <SpotClient />;
}
