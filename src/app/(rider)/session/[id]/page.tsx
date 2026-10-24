import type { Metadata } from "next";
import SessionClient from "./session-client";

export const metadata: Metadata = {
  title: "Active Session — ChargeMate",
  description: "Live charging session telemetry — battery, kWh, cost, elapsed time.",
};

export default function SessionPage({ params }: { params: { id: string } }) {
  return <SessionClient params={params} />;
}
