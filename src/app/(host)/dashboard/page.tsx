import type { Metadata } from "next";
import { HostDashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Host Dashboard",
  description: "View earnings, manage your EV charging spot and respond to booking requests.",
};

export default function HostDashboardPage() {
  return <HostDashboardClient />;
}
