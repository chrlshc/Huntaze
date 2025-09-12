import EnterpriseNav from '@/src/components/enterprise-nav';
import EnterpriseHero from '@/components/sections/EnterpriseHero';
import EnterpriseTrustBar from '@/components/sections/EnterpriseTrustBar';
import ValuePropositions from '@/components/sections/ValuePropositions';
import PlatformCapabilities from '@/components/sections/PlatformCapabilities';
import PricingSection from '@/components/sections/PricingSection';
import ProofByNumbers from '@/components/sections/ProofByNumbers';
import CreatorPainPoints from '@/components/sections/CreatorPainPoints';
import EnterpriseReady from '@/components/sections/EnterpriseReady';
import ROICalculator from '@/components/sections/ROICalculator';
import FAQSection from '@/components/sections/FAQSection';
import EnterpriseFinalCTA from '@/components/sections/EnterpriseFinalCTA';
import EnterpriseFooter from '@/components/sections/EnterpriseFooter';

export default function HomePage() {
  return (
    <>
      <div className="enterprise-page min-h-screen">
        {/* Enterprise Navigation - Replaces standard header */}
        <EnterpriseNav />
        
        {/* Hero Section with Authority Positioning */}
        <section className="hero-section">
          <EnterpriseHero />
        </section>
        
        {/* Trust Bar with Anonymous Metrics */}
        <section className="trust-bar">
          <EnterpriseTrustBar />
        </section>
        
        {/* Value Propositions - 3 Pillars */}
        <section className="value-propositions">
          <ValuePropositions />
        </section>
        
        {/* Platform Capabilities with Progressive Disclosure */}
        <section className="platform-capabilities">
          <PlatformCapabilities />
        </section>
        
        {/* Pricing Section */}
        <section className="pricing-section">
          <PricingSection />
        </section>
        
        {/* Social Proof by Numbers (No Testimonials) */}
        <section className="proof-numbers">
          <ProofByNumbers />
        </section>
        
        {/* Creator Pain Points - Anti-Agency */}
        <section className="creator-pain-points">
          <CreatorPainPoints />
        </section>
        
        {/* Enterprise Features & Compliance */}
        <section className="enterprise-ready">
          <EnterpriseReady />
        </section>
        
        {/* ROI Calculator with Revenue Share */}
        <section className="roi-section interactive-section">
          <ROICalculator />
        </section>
        
        {/* FAQ Section */}
        <section className="faq-section">
          <FAQSection />
        </section>
        
        {/* Final CTA with Consultative Approach */}
        <section className="final-cta-section">
          <EnterpriseFinalCTA />
        </section>
        
        {/* Enterprise Footer */}
        <section className="footer-section">
          <EnterpriseFooter />
        </section>
      </div>
    </>
  );
}