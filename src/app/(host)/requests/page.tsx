import type { Metadata } from "next";
import { RequestsClient } from "./requests-client";

export const metadata: Metadata = {
  title: "Live Requests",
  description: "View and respond to incoming EV charging requests from riders.",
};

export default function LiveRequestsPage() {
  return <RequestsClient />;
}
