'use client';

import { type Benefit } from '@/components/home/ValueProposition';
import { HeroSection } from '@/components/home/HeroSection';
import { ValueProposition } from '@/components/home/ValueProposition';
import { HomeCTA } from '@/components/home/HomeCTA';

// Define the 3 key benefits
const benefits: Benefit[] = [
  { 
    icon: 'BarChart3', 
    title: 'Clarity', 
    subtitle: 'See clearly',
    description: 'Track your revenue and growth across all platforms instantly. No more spreadsheets.' 
  },
  { 
    icon: 'Sparkles', 
    title: 'Freedom', 
    subtitle: 'Save time',
    description: 'Your AI assistant works 24/7. It handles messages and routine tasks so you can sleep.' 
  },
  { 
    icon: 'Users', 
    title: 'Connection', 
    subtitle: 'Know your fans',
    description: 'Identify your top supporters and build real relationships with the people who matter most.' 
  }
];

export function HomePageContent() {
  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#EDEDEF] w-full mx-auto">
      {/* Hero Section */}
      <HeroSection
        badge="Closed Beta • Invite only"
        title="Run Your Creator Business on Autopilot"
        subtitle="Focus on creating content. We handle the analytics, marketing, and growth."
        ctaText="Request Early Access"
        ctaHref="/auth/register"
      />

      {/* Value Proposition - 3 Benefits */}
      <ValueProposition benefits={benefits} />

      {/* Final CTA with Navigation Links */}
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
