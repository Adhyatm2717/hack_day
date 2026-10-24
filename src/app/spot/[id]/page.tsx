/**
 * /spot/[id] — server entry point
 * Provides SEO metadata; delegates rendering to client component.
 */
import type { Metadata } from "next";
import SpotClient from "./spot-client";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Charging Spot — ChargeMate`,
    description:
      "View charging spot details, specs, house rules, reviews and book a session.",
    openGraph: {
      type: "website",
      title: "Charging Spot — ChargeMate",
      description: "Community EV charging on your street.",
    },
  };
}

export default function SpotDetailPage({ params }: { params: { id: string } }) {
  return <SpotClient params={params} />;
}
