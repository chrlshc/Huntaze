import { ClientsSection } from "@/components/ClientsSection";
import { HeroSection } from "@/components/HeroSection";
import { LandingFooter } from "@/components/LandingFooter";
import { LandingHeader } from "@/components/LandingHeader";
import { PricingSection } from "@/components/PricingSection";
import { ProductSection } from "@/components/ProductSection";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <LandingHeader />
      <main className="mx-auto max-w-7xl px-6">
        <HeroSection />
        <ProductSection />
        <PricingSection />
        <ClientsSection />
      </main>
      <LandingFooter />
    </div>
  );
}
