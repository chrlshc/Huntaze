import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import { PricingTier } from '@/components/pricing/PricingCard';

// Dynamic imports for heavy components
const PricingTiers = dynamic(() => import('@/components/pricing/PricingTiers').then(mod => ({ default: mod.PricingTiers })), {
  loading: () => (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-6 p-8 border rounded-2xl animate-pulse">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-12 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                ))}
              </div>
              <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
  ssr: true,
});

const PricingFAQ = dynamic(() => import('@/components/pricing/PricingFAQ').then(mod => ({ default: mod.PricingFAQ })), {
  loading: () => (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    </section>
  ),
  ssr: true,
});

export const metadata: Metadata = {
  title: 'Pricing - Huntaze',
  description: 'Choose the right plan for your needs. Start free during our beta phase and upgrade when you\'re ready.',
  openGraph: {
    title: 'Pricing - Huntaze',
    description: 'Choose the right plan for your needs. Start free during our beta phase and upgrade when you\'re ready.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - Huntaze',
    description: 'Choose the right plan for your needs. Start free during our beta phase and upgrade when you\'re ready.',
  },
};

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'month',
    description: 'Perfect for individuals and small creators getting started',
    features: [
      'Up to 3 social media accounts',
      'Basic automation features',
      'Content scheduling',
      'Analytics dashboard',
      'Email support',
      'Community access',
    ],
    cta: {
      text: 'Get Started',
      href: '/auth/login',
    },
    isBeta: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    period: 'month',
    description: 'For growing creators and small teams',
    features: [
      'Up to 10 social media accounts',
      'Advanced automation',
      'AI-powered content suggestions',
      'Priority support',
      'Team collaboration (up to 3 members)',
      'Advanced analytics',
      'Custom integrations',
      'API access',
    ],
    cta: {
      text: 'Get Started',
      href: '/auth/login',
    },
    highlighted: true,
    isBeta: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'custom',
    period: 'month',
    description: 'For large teams and agencies with custom needs',
    features: [
      'Unlimited social media accounts',
      'Full automation suite',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
      'Advanced security features',
      'Custom training',
      'Priority feature requests',
    ],
    cta: {
      text: 'Contact Sales',
      href: '/contact',
    },
    isBeta: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-4 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 mb-6">
            🎉 Beta Launch - All Features Free
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
            Join our beta and get full access to all features for free. When we launch, choose the plan that fits your needs.
          </p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <PricingTiers tiers={pricingTiers} />

      {/* FAQ Section */}
      <PricingFAQ />

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Join our beta today and experience the full platform for free.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-8 py-3 text-base font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              Request Access
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-3 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
