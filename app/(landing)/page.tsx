'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SocialProof as SocialProofSection } from '@/components/landing/SocialProof';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTA as FinalCTASection } from '@/components/landing/FinalCTA';
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
      <SocialProofSection 
        stats={[
          { value: 10000, label: 'Active Creators', suffix: '+' },
          { value: 1000000, label: 'Content Published', suffix: '+' },
          { value: 98, label: 'Satisfaction Rate', suffix: '%' }
        ]}
        testimonials={[
          {
            name: 'Sarah Johnson',
            role: 'Content Creator',
            content: 'This platform has transformed how I manage my content across multiple platforms.',
            rating: 5
          },
          {
            name: 'Mike Chen',
            role: 'Influencer',
            content: 'The analytics and scheduling features save me hours every week.',
            rating: 5
          }
        ]}
      />
      <PricingSection 
        plans={[
          {
            name: 'Starter',
            price: 0,
            period: 'month',
            description: 'Perfect for getting started',
            features: [
              { text: 'Up to 3 platforms', included: true },
              { text: 'Basic analytics', included: true },
              { text: 'Content scheduling', included: true },
              { text: 'Email support', included: true },
              { text: 'Advanced AI features', included: false }
            ],
            ctaText: 'Get Started',
            ctaHref: '/auth/register'
          },
          {
            name: 'Pro',
            price: 29,
            period: 'month',
            description: 'For serious creators',
            features: [
              { text: 'Unlimited platforms', included: true },
              { text: 'Advanced analytics', included: true },
              { text: 'AI content suggestions', included: true },
              { text: 'Priority support', included: true },
              { text: 'Team collaboration', included: true }
            ],
            popular: true,
            ctaText: 'Start Free Trial',
            ctaHref: '/auth/register'
          }
        ]}
      />
      <FAQSection 
        faqs={[
          {
            question: 'How does the platform work?',
            answer: 'Our platform connects to your social media accounts and provides tools for content management, scheduling, and analytics all in one place.'
          },
          {
            question: 'Is there a free trial?',
            answer: 'Yes! We offer a 14-day free trial with full access to all Pro features.'
          },
          {
            question: 'Can I cancel anytime?',
            answer: 'Absolutely. You can cancel your subscription at any time with no penalties or fees.'
          },
          {
            question: 'What platforms do you support?',
            answer: 'We support Instagram, TikTok, Reddit, and more platforms are being added regularly.'
          }
        ]}
      />
      <FinalCTASection 
        title="Ready to Grow Your Creator Business?"
        subtitle="Join thousands of creators who are already using our platform to manage and grow their audience."
        primaryCTA={{
          text: 'Start Free Trial',
          href: '/auth/register'
        }}
        secondaryCTA={{
          text: 'View Pricing',
          href: '#pricing'
        }}
      />
      <LandingFooter />
    </div>
  );
}
