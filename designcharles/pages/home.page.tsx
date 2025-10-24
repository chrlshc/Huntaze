// Snapshot of app/page.tsx
import MarketingHero from '@/components/sections/marketing/HeroSection';
import BetaBenefits from '@/components/sections/beta/BetaBenefits';
import BetaFeatures from '@/components/sections/beta/BetaFeatures';
import BetaSocialProof from '@/components/sections/beta/BetaSocialProof';
import BetaHowItWorks from '@/components/sections/beta/BetaHowItWorks';
import BetaFAQ from '@/components/sections/beta/BetaFAQ';
import BetaFinalCTA from '@/components/sections/beta/BetaFinalCTA';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <section><MarketingHero /></section>
      <BetaBenefits />
      <BetaFeatures />
      <BetaSocialProof />
      <BetaHowItWorks />
      <BetaFAQ />
      <BetaFinalCTA />
    </div>
  );
}

