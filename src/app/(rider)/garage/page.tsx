import type { Metadata } from "next";
import GarageClient from "./garage-client";

export const metadata: Metadata = {
  title: "My Garage — ChargeMate",
  description: "Manage your electric vehicles, connector presets, and battery specs.",
};

export default function GaragePage() {
  return (
    <div className="max-w-5xl mx-auto px-gutter py-8 space-y-6">
      <GarageClient />
    </div>
  );
}
