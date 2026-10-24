import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  // In a real app you'd fetch the spot here; mock just uses the id
  return {
    title: `Charging Spot — ChargeMate`,
    description: "View charging spot details, specs, rules, reviews and book a session.",
    openGraph: {
      type: "website",
      title: "Charging Spot — ChargeMate",
      description: "Community EV charging on your street.",
    },
  };
}

export default function SpotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
