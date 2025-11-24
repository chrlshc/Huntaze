import React from 'react';
import dynamic from 'next/dynamic';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { SimpleHeroSection as HeroSection } from '@/components/landing/SimpleHeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Zap, Users, TrendingUp, Shield, Sparkles, BarChart3 } from 'lucide-react';

// Use dynamic rendering to avoid build-time errors
// The page will be rendered on-demand for each request
export const dynamicParams = true;
export const revalidate = 0;

// Dynamic imports for below-the-fold sections with skeleton loaders
// These components are loaded on the client side to reduce initial bundle size
import {
  FeaturesShowcaseSkeleton,
  SocialProofSkeleton,
  PricingSectionSkeleton,
  FAQSectionSkeleton,
  FinalCTASkeleton,
} from '@/components/landing/skeletons';

const FeaturesShowcase = dynamic(
  () => import('@/components/landing/SimpleFeaturesShowcase').then((mod) => ({ default: mod.SimpleFeaturesShowcase })),
  {
    loading: () => <FeaturesShowcaseSkeleton />,
    ssr: false,
  }
);

const SocialProof = dynamic(
  () => import('@/components/landing/SimpleSocialProof').then((mod) => ({ default: mod.SimpleSocialProof })),
  {
    loading: () => <SocialProofSkeleton />,
    ssr: false,
  }
);

const PricingSection = dynamic(
  () => import('@/components/landing/SimplePricingSection').then((mod) => ({ default: mod.SimplePricingSection })),
  {
    loading: () => <PricingSectionSkeleton />,
    ssr: false,
  }
);

const FAQSection = dynamic(
  () => import('@/components/landing/SimpleFAQSection').then((mod) => ({ default: mod.SimpleFAQSection })),
  {
    loading: () => <FAQSectionSkeleton />,
    ssr: false,
  }
);

const FinalCTA = dynamic(
  () => import('@/components/landing/SimpleFinalCTA').then((mod) => ({ default: mod.SimpleFinalCTA })),
  {
    loading: () => <FinalCTASkeleton />,
    ssr: false,
  }
);

// Server Component - No 'use client' directive
// All interactive components are marked with 'use client' in their own files
export default function HomePage() {
  const features = [
    {
      icon: <Zap className="w-full h-full" />,
      title: 'Lightning Fast',
      description: 'Get started in minutes with our intuitive platform designed for creators.',
    },
    {
      icon: <Users className="w-full h-full" />,
      title: 'Grow Your Audience',
      description: 'Connect with your fans across multiple platforms and grow your reach.',
    },
    {
      icon: <TrendingUp className="w-full h-full" />,
      title: 'Increase Revenue',
      description: 'Monetize your content effectively with powerful tools and analytics.',
    },
    {
      icon: <Shield className="w-full h-full" />,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and encryption.',
    },
    {
      icon: <Sparkles className="w-full h-full" />,
      title: 'AI-Powered',
      description: 'Leverage AI to create engaging content and optimize your strategy.',
    },
    {
      icon: <BarChart3 className="w-full h-full" />,
      title: 'Advanced Analytics',
      description: 'Track your performance with detailed insights and actionable metrics.',
    },
  ];

  const showcaseFeatures = [
    {
      title: 'Multi-Platform Content Management',
      description: 'Manage all your social media accounts from one unified dashboard. Schedule posts, track engagement, and grow your presence across Instagram, TikTok, Twitter, and more.',
      benefits: [
        { text: 'Connect unlimited social accounts' },
        { text: 'Schedule posts across all platforms' },
        { text: 'Unified analytics and reporting' },
      ],
      image: '/images/features/dashboard.svg',
      imageAlt: 'Multi-platform dashboard interface',
    },
    {
      title: 'AI-Powered Content Creation',
      description: 'Let AI help you create engaging content that resonates with your audience. Get suggestions, optimize captions, and generate ideas in seconds.',
      benefits: [
        { text: 'AI-generated content suggestions' },
        { text: 'Smart caption optimization' },
        { text: 'Hashtag recommendations' },
      ],
      image: '/images/features/ai-content.svg',
      imageAlt: 'AI content creation interface',
    },
    {
      title: 'Advanced Analytics & Insights',
      description: 'Make data-driven decisions with comprehensive analytics. Track your growth, understand your audience, and optimize your content strategy.',
      benefits: [
        { text: 'Real-time performance metrics' },
        { text: 'Audience demographics and behavior' },
        { text: 'Competitor analysis tools' },
      ],
      image: '/images/features/analytics.svg',
      imageAlt: 'Analytics dashboard with charts',
    },
  ];

  const stats = [
    { value: 10000, label: 'Active Creators', suffix: '+' },
    { value: 1000000, label: 'Posts Published', suffix: '+' },
    { value: 50, label: 'Countries', suffix: '+' },
    { value: 98, label: 'Satisfaction Rate', suffix: '%' },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Content Creator',
      content: 'This platform has completely transformed how I manage my content. The AI suggestions are spot-on and save me hours every week!',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Influencer',
      content: 'The analytics are incredible. I finally understand what content works and why. My engagement has doubled in just 3 months.',
      rating: 5,
    },
    {
      name: 'Emma Davis',
      role: 'Digital Marketer',
      content: 'Best investment for my business. The multi-platform scheduling alone is worth it, but the AI features are game-changing.',
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 19,
      period: 'month',
      description: 'Perfect for new creators',
      features: [
        { text: 'Up to 3 social accounts', included: true },
        { text: '50 scheduled posts/month', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'AI content suggestions', included: true },
        { text: 'Priority support', included: false },
        { text: 'Advanced analytics', included: false },
      ],
      ctaText: 'Start Free Trial',
      ctaHref: '/auth/register?plan=starter',
    },
    {
      name: 'Pro',
      price: 49,
      period: 'month',
      description: 'For growing creators',
      popular: true,
      features: [
        { text: 'Up to 10 social accounts', included: true },
        { text: 'Unlimited scheduled posts', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'AI content suggestions', included: true },
        { text: 'Priority support', included: true },
        { text: 'Team collaboration', included: true },
      ],
      ctaText: 'Start Free Trial',
      ctaHref: '/auth/register?plan=pro',
    },
    {
      name: 'Enterprise',
      price: 149,
      period: 'month',
      description: 'For teams and agencies',
      features: [
        { text: 'Unlimited social accounts', included: true },
        { text: 'Unlimited scheduled posts', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'AI content suggestions', included: true },
        { text: 'Priority support', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Dedicated account manager', included: true },
      ],
      ctaText: 'Contact Sales',
      ctaHref: '/contact',
    },
  ];

  const faqs = [
    {
      question: 'How does the free trial work?',
      answer: 'You get full access to all features for 14 days, no credit card required. After the trial, you can choose a plan that fits your needs or continue with our free tier.',
    },
    {
      question: 'Can I change my plan later?',
      answer: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.',
    },
    {
      question: 'Which social platforms do you support?',
      answer: 'We support all major platforms including Instagram, TikTok, Twitter, Facebook, LinkedIn, YouTube, and more. We\'re constantly adding new integrations.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use enterprise-grade encryption and security measures. Your data is stored securely and we never share it with third parties.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund, no questions asked.',
    },
    {
      question: 'Can I use this for my team?',
      answer: 'Yes! Our Pro and Enterprise plans include team collaboration features. You can invite team members and manage permissions easily.',
    },
  ];

  return (
    <main className="min-h-screen">
      <LandingHeader />
      
      {/* Beta Badge */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-primary/10 border border-primary/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-sm font-medium text-primary">BETA</span>
        </div>
      </div>
      
      <HeroSection
        title="Grow Your Creator Business"
        subtitle="The all-in-one platform for content creators to manage, grow, and monetize their audience across all platforms."
        ctaText="Get Started Free"
        ctaHref="/auth/register"
      />
      
      <FeaturesGrid features={features} />
      
      <FeaturesShowcase features={showcaseFeatures} />
      
      <SocialProof stats={stats} testimonials={testimonials} />
      
      <PricingSection plans={pricingPlans} />
      
      <FAQSection faqs={faqs} />
      
      <FinalCTA
        title="Ready to Grow Your Creator Business?"
        subtitle="Join thousands of creators who are already using our platform to scale their content and reach."
        primaryCTA={{ text: 'Start Free Trial', href: '/auth/register' }}
        secondaryCTA={{ text: 'Schedule Demo', href: '/contact' }}
      />
      
      <LandingFooter />
    </main>
  );
}
