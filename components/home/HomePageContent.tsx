'use client';

import { BarChart3, Sparkles, Users } from 'lucide-react';
import { HeroSection } from '@/components/home/HeroSection';
import { InteractiveDashboardDemo } from '@/components/home/InteractiveDashboardDemo';
import { BenefitSection } from '@/components/home/BenefitSection';
import { HomeCTA } from '@/components/home/HomeCTA';

export function HomePageContent() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] w-full overflow-x-hidden">
      {/* Section 1: Hero */}
      <HeroSection
        badge="Closed Beta • Invite only"
        title="Run Your Creator Business on Autopilot"
        subtitle="Focus on creating content. We handle the analytics, marketing, and growth."
        ctaText="Request Early Access"
        ctaHref="/auth/register"
      />

      {/* Section 2: Interactive Dashboard Demo */}
      <InteractiveDashboardDemo />

      {/* Section 3: Clarity - Analytics & Tracking */}
      <BenefitSection
        id="clarity"
        icon={BarChart3}
        label="CLARITY"
        title="See clearly"
        description="Track your revenue and growth across all platforms instantly. No more spreadsheets. Get real-time insights into what's working and what's not, all in one beautiful dashboard."
        imagePosition="left"
        background="default"
      />

      {/* Section 4: Freedom - Automation */}
      <BenefitSection
        id="freedom"
        icon={Sparkles}
        label="FREEDOM"
        title="Save time"
        description="Your AI assistant works 24/7. It handles messages and routine tasks so you can sleep. Automate the boring stuff and focus on what you love: creating content."
        imagePosition="right"
        background="alternate"
      />

      {/* Section 5: Connection - Relationships */}
      <BenefitSection
        id="connection"
        icon={Users}
        label="CONNECTION"
        title="Know your fans"
        description="Identify your top supporters and build real relationships with the people who matter most. See who engages, who buys, and who truly supports your work."
        imagePosition="left"
        background="default"
      />

      {/* Section 6: Final CTA */}
      <HomeCTA
        title="Ready to upgrade your workflow?"
        ctaText="Request Access"
        ctaHref="/auth/register"
        featuresLink="/features"
        pricingLink="/pricing"
        aboutLink="/about"
      />
    </div>
  );
}
