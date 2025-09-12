import EnterpriseNav from '@/src/components/enterprise-nav';
import EnterpriseHero from '@/components/sections/EnterpriseHero';
import EnterpriseTrustBar from '@/components/sections/EnterpriseTrustBar';
import PlatformCapabilities from '@/components/sections/PlatformCapabilities';
import ProofByNumbers from '@/components/sections/ProofByNumbers';
import CreatorPainPoints from '@/components/sections/CreatorPainPoints';
import EnterpriseReady from '@/components/sections/EnterpriseReady';
import ROICalculator from '@/components/sections/ROICalculator';
import EnterpriseFinalCTA from '@/components/sections/EnterpriseFinalCTA';
import EnterpriseFooter from '@/components/sections/EnterpriseFooter';

export default function HomePage() {
  return (
    <>
      <div className="enterprise-page enterprise-neutral bg-white min-h-screen">
        {/* Enterprise Navigation - Replaces standard header */}
        <EnterpriseNav />
        
        {/* Hero Section with Authority Positioning */}
        <EnterpriseHero />
        
        {/* Trust Bar with Anonymous Metrics */}
        <EnterpriseTrustBar />
        
        {/* Platform Capabilities with Progressive Disclosure */}
        <PlatformCapabilities />
        
        {/* Social Proof by Numbers (No Testimonials) */}
        <ProofByNumbers />
        
        {/* Creator Pain Points - Anti-Agency */}
        <CreatorPainPoints />
        
        {/* Enterprise Features & Compliance */}
        <EnterpriseReady />
        
        {/* ROI Calculator */}
        <ROICalculator />
        
        {/* Final CTA with Consultative Approach */}
        <EnterpriseFinalCTA />
        
        {/* Enterprise Footer */}
        <EnterpriseFooter />
      </div>
    </>
  );
}