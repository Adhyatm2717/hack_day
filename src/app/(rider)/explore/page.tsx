/**
 * /explore — server entry point
 * Provides SEO metadata; delegates rendering to client component.
 */
import type { Metadata } from "next";
import ExploreClient from "./explore-client";

export const metadata: Metadata = {
  title: "Find a Socket — ChargeMate",
  description:
    "Explore nearby EV charging spots on the map. Filter by connector, battery level, and distance. SOS CHARGE instantly routes you to the nearest compatible host.",
  openGraph: {
    type: "website",
    title: "Find a Socket — ChargeMate",
    description: "Community EV charging on your street.",
  },
};

export default function ExplorePage() {
  return <ExploreClient />;
}
