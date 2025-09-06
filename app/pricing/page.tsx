import type { Metadata } from 'next';
import PricingClient from './pricing-client';

export const metadata: Metadata = {
  title: 'Pricing - Huntaze',
  description:
    'Simple and transparent pricing for creators. Free trial available. Cancel anytime.',
};

// Huntaze Pricing Plans
const plans = [
  {
    name: 'STARTER',
    price: '$19/mo',
    freeTrialDays: 7,
    description: 'Perfect for new creators',
    color: 'green',
    commission: '7%',
    revenueCap: '$2,500/month',
    features: [
      '✓ 1,000 AI suggestions/month',
      '✓ 1 platform connected',
      '✓ Basic analytics',
      '✓ Mobile access',
      '✓ Standard email support',
      '✓ 7% commission — You keep 93%',
      '✓ Cap: $2,500/month',
      '⚠️ AI API not included (+$10-20/month)'
    ],
    cta: 'Start Free Trial',
    priceId: 'starter'
  },
  {
    name: 'PRO',
    price: '$39/mo',
    freeTrialDays: 7,
    description: 'For growing creators (up to $5k/month)',
    color: 'purple',
    badge: 'MOST POPULAR',
    commission: '5%',
    revenueCap: '$5,000/month',
    features: [
      '✓ 5,000 AI suggestions/month',
      '✓ 3 platforms connected',
      '✓ Advanced analytics',
      '✓ Priority support',
      '✓ Customizable templates',
      '✓ 5% commission — You keep 95%',
      '✓ Cap: $5,000/month',
      '⚠️ AI API not included (+$20-30/month)'
    ],
    cta: 'Start Free Trial',
    priceId: 'pro'
  },
  {
    name: 'SCALE',
    price: '$79/mo',
    freeTrialDays: 7,
    description: 'For established creators (up to $15k/month)',
    color: 'blue',
    badge: 'BEST VALUE',
    commission: '3%',
    revenueCap: '$15,000/month',
    features: [
      '✓ 25,000 AI suggestions/month', 
      '✓ 10 platforms connected',
      '✓ Advanced analytics & API',
      '✓ Team collaboration (3 users)',
      '✓ Advanced AI customization',
      '✓ 3% commission — You keep 97%',
      '✓ Cap: $15,000/month',
      '⚠️ AI API not included (+$30-50/month)'
    ],
    cta: 'Start Free Trial',
    priceId: 'scale'
  },
  {
    name: 'ENTERPRISE',
    price: '$199/mo',
    freeTrialDays: 7,
    description: 'For top creators and agencies',
    color: 'gold',
    isPremium: true,
    commission: '1.5%',
    revenueCap: 'Unlimited',
    features: [
      '✓ Unlimited AI suggestions',
      '✓ Unlimited integrations',
      '✓ Custom reports',
      '✓ No revenue cap',
      '✓ 1.5% commission — You keep 98.5%',
      '✓ White label options',
      '✓ Dedicated account manager',
      '⚠️ AI API at your expense (+$10-50/month)'
    ],
    cta: 'Contact Sales',
    priceId: 'enterprise'
  }
];

export default function PricingPage() {
  return <PricingClient plans={plans} />;
}
