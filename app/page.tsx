import MarketingHero from '@/components/sections/marketing/HeroSection';
import BetaBenefits from '@/components/sections/beta/BetaBenefits';
import BetaFeatures from '@/components/sections/beta/BetaFeatures';
import BetaSocialProof from '@/components/sections/beta/BetaSocialProof';
import BetaHowItWorks from '@/components/sections/beta/BetaHowItWorks';
import BetaFAQ from '@/components/sections/beta/BetaFAQ';
import BetaFinalCTA from '@/components/sections/beta/BetaFinalCTA';
import PlatformStrip from '@/components/sections/huntaze/PlatformStrip';
import HuntazeFeatures from '@/components/sections/huntaze/HuntazeFeatures';
import HuntazeFlow from '@/components/sections/huntaze/HuntazeFlow';

export default function HomePage() {
  return (
    <>
      <div className="min-h-screen">
        {/* JSON-LD (SoftwareApplication + FAQ) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Huntaze',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: 'All‑in‑one platform for creators & agencies: unified inbox, PPV campaigns & AI—for OnlyFans, Instagram & TikTok.',
          offers: {
            '@type': 'Offer',
            price: 0,
            priceCurrency: 'USD',
            category: 'Beta'
          }
        }) }} />
        {/* Hero with Beta mention */}
        <section>
          <MarketingHero />
        </section>
        {/* Platform compatibility strip */}
        <PlatformStrip />
        {/* Huntaze product pillars */}
        <HuntazeFeatures />
        {/* 3-step value storyline */}
        <HuntazeFlow />
        {/* Beta content sections */}
        <BetaBenefits />
        <BetaFeatures />
        <BetaSocialProof />
        <BetaHowItWorks />
        <BetaFAQ />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'What platforms do you support?', acceptedAnswer: { '@type': 'Answer', text: 'OnlyFans, Instagram, and TikTok. Reddit and others are on the roadmap.' }},
            { '@type': 'Question', name: 'Is the beta free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — access is free during beta. No credit card.' }},
            { '@type': 'Question', name: 'How long does it take to get started?', acceptedAnswer: { '@type': 'Answer', text: 'Most creators set up in under 5 minutes.' }}
          ]
        }) }} />
        <BetaFinalCTA />
      </div>
    </>
  );
}
