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
    price: 'Free trial',
    description: 'Perfect to get started and evaluate',
    color: 'green',
    features: [
      'Try core features with no commitment',
      'All core automation features',
      'Email support within 1 business day',
      '1 new feature/week (community vote)'
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
      'Advanced analytics & insights',
      'Higher limits and throughput',
      'Advanced analytics & insights',
      'Priority email support',
      'Custom AI tuning (beta)',
      '2 new features/week (priority vote)'
    ],
    cta: 'Start free trial'
  },
  {
    name: 'SCALE',
    price: '$99/mo',
    description: 'Maximum growth with minimal fees',
    color: 'blue',
    features: [
      'Multi-platform management',
      'Higher API limits',
      'Dedicated onboarding assistance',
      'API access (beta)',
      '3 new features/week + fast track'
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
      'Custom integrations',
      'SLA and security reviews',
      'Managed onboarding',
      'Dedicated support channel'
    ],
    cta: 'Start free trial'
  }
];

export default function PricingPage() {
  return <PricingClient plans={plans} />;
}
