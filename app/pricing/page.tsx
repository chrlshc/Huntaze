import type { Metadata } from 'next';
import PricingClient from './pricing-client';

export const metadata: Metadata = {
  title: 'Pricing - Huntaze',
  description:
    'Revolutionary pricing for OF creators. Keep 85-98% of your revenue with our transparent commission caps. First month free if you make less than $1.5k/month.',
};

// Huntaze Pricing Plans
const plans = [
  {
    name: 'STARTER',
    price: '$0/mo',
    description: 'Perfect for creators just starting out',
    color: 'green',
    features: [
      'First month FREE if <$1.5k/mo',
      '20% → 5% commission (scales down)',
      '90 days: 0% on first $500/mo',
      'All core automation features',
      'Email support'
    ],
    cta: 'Start free trial'
  },
  {
    name: 'PRO',
    price: '$69/mo',
    description: 'For established creators ready to scale',
    color: 'purple',
    badge: 'MOST POPULAR',
    features: [
      'Commission capped at $699/mo',
      'Perfect for $4k-20k/mo creators',
      'Advanced analytics & insights',
      'Priority support',
      'Custom AI training'
    ],
    cta: 'Start free trial'
  },
  {
    name: 'SCALE',
    price: '$99/mo',
    description: 'Maximum growth with minimal fees',
    color: 'blue',
    features: [
      'Commission capped at $1,999/mo',
      'Best for $20k-50k/mo creators',
      'Multi-platform management',
      'Dedicated success manager',
      'API access'
    ],
    cta: 'Start free trial'
  },
  {
    name: 'ENTERPRISE',
    price: '$499/mo',
    description: 'For top creators and agencies',
    color: 'gold',
    isPremium: true,
    features: [
      'Only 2% flat commission',
      'For $50k+/mo creators',
      'White-label options',
      'Custom integrations',
      '24/7 phone support'
    ],
    cta: 'Start free trial'
  }
];

export default function PricingPage() {
  return <PricingClient plans={plans} />;
}