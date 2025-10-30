import React from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Zap, Users, TrendingUp, Shield, Sparkles, BarChart3 } from 'lucide-react';

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

  return (
    <main>
      <LandingHeader />
      
      <HeroSection
        title="Grow Your Creator Business"
        subtitle="The all-in-one platform for content creators to manage, grow, and monetize their audience across all platforms."
        ctaText="Get Started Free"
        ctaHref="/auth/register"
      />
      
      <FeaturesGrid features={features} />
      
      <LandingFooter />
    </main>
  );
}
