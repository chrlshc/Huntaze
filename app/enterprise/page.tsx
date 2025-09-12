import EnterpriseNav from '@/src/components/enterprise-nav'
import EnterpriseHero from '@/components/sections/EnterpriseHero'
import EnterpriseTrustBar from '@/components/sections/EnterpriseTrustBar'
import PlatformCapabilities from '@/components/sections/PlatformCapabilities'
import ProofByNumbers from '@/components/sections/ProofByNumbers'
import EnterpriseReady from '@/components/sections/EnterpriseReady'
import EnterpriseFinalCTA from '@/components/sections/EnterpriseFinalCTA'
import EnterpriseFooter from '@/components/sections/EnterpriseFooter'

export default function EnterprisePage() {
  return (
    <>
      {/* Enterprise Navigation */}
      <EnterpriseNav />
      
      {/* Hero Section */}
      <EnterpriseHero />
      
      {/* Trust Bar */}
      <EnterpriseTrustBar />
      
      {/* Platform Capabilities */}
      <PlatformCapabilities />
      
      {/* Social Proof by Numbers */}
      <ProofByNumbers />
      
      {/* Enterprise Features */}
      <EnterpriseReady />
      
      {/* Final CTA */}
      <EnterpriseFinalCTA />
      
      {/* Footer */}
      <EnterpriseFooter />
    </>
  )
}