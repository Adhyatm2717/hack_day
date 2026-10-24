// app/(landing)/page.tsx
// Public landing page — assembled from landing components.
// Server Component: FeaturedHostSection fetches from lib/data directly.
import { Suspense } from "react";
import { LandingNav }          from "@/components/landing/LandingNav";
import { HeroSection }         from "@/components/landing/HeroSection";
import { HowItWorksSection }   from "@/components/landing/HowItWorksSection";
import { FeaturedHostSection } from "@/components/landing/FeaturedHostSection";
import { TestimonialSection }  from "@/components/landing/TestimonialSection";
import { LandingFooter }       from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <>
      <LandingNav />

      {/* pt-16 = nav height */}
      <div className="pt-16">
        <HeroSection />

        <HowItWorksSection />

        <Suspense
          fallback={
            <div className="bg-recessed py-20 text-center font-body text-muted-foreground">
              Loading featured spots…
            </div>
          }
        >
          <FeaturedHostSection />
        </Suspense>

        <TestimonialSection />

        <LandingFooter />
      </div>
    </>
  );
}
