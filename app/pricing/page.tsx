import type { Metadata } from 'next';
import PricingClient from './pricing-client';

export const metadata: Metadata = {
  title: 'Pricing - Huntaze',
  description:
    'Simple, transparent pricing for creators. Free trial available. Cancel anytime.',
};

// Huntaze Pricing Plans
const plans = [
  {
    name: 'STARTER',
    price: '$19/mo',
    description: 'Perfect for emerging creators',
    color: 'green',
    commission: '7%',
    revenueCap: '$2,500/month',
    features: [
      '✓ 1,000 AI messages/month',
      '✓ 1 platform integration',
      '✓ Basic analytics',
      '✓ Mobile app access',
      '✓ Standard email support',
      '✓ 7% platform fee — You keep 93%',
      '✓ Revenue cap: $2,500/month'
    ],
    cta: 'Start free trial',
    priceId: 'starter'
  },
  {
    name: 'PRO',
    price: '$39/mo',
    description: 'For growing creators up to $5k/month',
    color: 'purple',
    badge: 'MOST POPULAR',
    commission: '5%',
    revenueCap: '$5,000/month',
    features: [
      '✓ 5,000 AI messages/month',
      '✓ 3 platform integrations',
      '✓ Advanced analytics',
      '✓ Priority support',
      '✓ Real‑time automation',
      '✓ 5% platform fee — You keep 95%',
      '✓ Revenue cap: $5,000/month'
    ],
    cta: 'Start free trial',
    priceId: 'pro'
  },
  {
    name: 'SCALE',
    price: '$79/mo',
    description: 'For established creators up to $15k/month',
    color: 'blue',
    badge: 'BEST VALUE',
    commission: '3%',
    revenueCap: '$15,000/month',
    features: [
      '✓ 25,000 AI messages/month', 
      '✓ 10 platform integrations',
      '✓ Advanced analytics & API',
      '✓ Team collaboration (3 users)',
      '✓ Custom AI training',
      '✓ 3% platform fee — You keep 97%',
      '✓ Revenue cap: $15,000/month'
    ],
    cta: 'Start free trial',
    priceId: 'scale'
  },
  {
    name: 'ENTERPRISE',
    price: '$199/mo',
    description: 'For top creators and agencies',
    color: 'gold',
    isPremium: true,
    commission: '1.5%',
    revenueCap: 'Unlimited',
    features: [
      '✓ Unlimited AI messages',
      '✓ Unlimited integrations',
      '✓ Custom reporting',
      '✓ No revenue cap',
      '✓ 1.5% platform fee — You keep 98.5%',
      '✓ White‑label options',
      '✓ Dedicated account manager'
    ],
    cta: 'Contact sales',
    priceId: 'enterprise'
  }
];

export default function PricingPage() {
  return <PricingClient plans={plans} />;
}
