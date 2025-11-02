'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';
import { Zap, Shield, TrendingUp, Users, BarChart, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <Zap className="w-full h-full" />,
      title: 'Lightning Fast',
      description: 'Optimized performance for instant loading and smooth interactions across all devices.',
    },
    {
      icon: <Shield className="w-full h-full" />,
      title: 'Secure by Default',
      description: 'Enterprise-grade security with end-to-end encryption to protect your data.',
    },
    {
      icon: <TrendingUp className="w-full h-full" />,
      title: 'Analytics Insights',
      description: 'Data-driven decisions with powerful analytics and real-time reporting.',
    },
    {
      icon: <Users className="w-full h-full" />,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with real-time updates and shared workspaces.',
    },
    {
      icon: <BarChart className="w-full h-full" />,
      title: 'Growth Tools',
      description: 'Scale your business with tools designed to help you grow faster.',
    },
    {
      icon: <Sparkles className="w-full h-full" />,
      title: 'AI-Powered',
      description: 'Leverage artificial intelligence to automate and optimize your workflow.',
    },
  ];

  return (
    <div className="min-h-screen">
      <LandingHeader />
      <HeroSection
        title="Grow Your Creator Business"
        subtitle="The all-in-one platform for content creators to manage, analyze, and monetize their audience."
        ctaText="Start Free Trial"
        ctaHref="/auth/register"
        showVideo={true}
      />
      <FeaturesGrid features={features} />
      <SocialProofSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
}
