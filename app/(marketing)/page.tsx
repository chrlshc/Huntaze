import dynamic from 'next/dynamic';
import { Users, Sparkles, BarChart3 } from 'lucide-react';
import { type Benefit } from '@/components/home/ValueProposition';
import { Metadata } from 'next';

// Use dynamic rendering
export const dynamicParams = true;
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Huntaze - Run Your Creator Business on Autopilot',
  description: 'Focus on creating content. We handle the analytics, marketing, and growth. AI-powered automation for modern creators.',
  keywords: ['creator tools', 'content automation', 'AI assistant', 'creator analytics', 'social media management'],
  openGraph: {
    title: 'Huntaze - Run Your Creator Business on Autopilot',
    description: 'Focus on creating content. We handle the analytics, marketing, and growth. AI-powered automation for modern creators.',
    type: 'website',
    url: 'https://huntaze.com',
    siteName: 'Huntaze',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Huntaze - Creator Business Automation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Huntaze - Run Your Creator Business on Autopilot',
    description: 'Focus on creating content. We handle the analytics, marketing, and growth. AI-powered automation for modern creators.',
    images: ['/og-image.png'],
  },
};

// Dynamic imports for heavy components to reduce initial bundle size
const HeroSection = dynamic(() => import('@/components/home/HeroSection').then(mod => ({ default: mod.HeroSection })), {
  loading: () => (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="flex justify-center">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>
        <div className="space-y-4">
          <div className="h-16 w-3/4 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-16 w-2/3 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    </section>
  ),
  ssr: true,
});

const ValueProposition = dynamic(() => import('@/components/home/ValueProposition').then(mod => ({ default: mod.ValueProposition })), {
  loading: () => (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </section>
  ),
  ssr: true,
});

const HomeCTA = dynamic(() => import('@/components/home/HomeCTA').then(mod => ({ default: mod.HomeCTA })), {
  loading: () => (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-6 animate-pulse">
        <div className="h-12 w-2/3 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-12 w-48 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>
    </section>
  ),
  ssr: true,
});

// Define the 3 key benefits
const benefits: Benefit[] = [
  { 
    icon: BarChart3, 
    title: 'Clarity', 
    subtitle: 'See clearly',
    description: 'Track your revenue and growth across all platforms instantly. No more spreadsheets.' 
  },
  { 
    icon: Sparkles, 
    title: 'Freedom', 
    subtitle: 'Save time',
    description: 'Your AI assistant works 24/7. It handles messages and routine tasks so you can sleep.' 
  },
  { 
    icon: Users, 
    title: 'Connection', 
    subtitle: 'Know your fans',
    description: 'Identify your top supporters and build real relationships with the people who matter most.' 
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#EDEDEF]">
      {/* Hero Section */}
      <HeroSection
        badge="Closed Beta • Invite only"
        title={
          <>
            <span className="bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent">
              Run Your Creator Business
            </span>
            <br />
            <span className="bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
              on Autopilot.
            </span>
          </>
        }
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
