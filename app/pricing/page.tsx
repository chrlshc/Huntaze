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
    freeTrialDays: 7,
    description: 'Perfect for emerging creators',
    color: 'green',
    commission: '7%',
    revenueCap: '$2,500/month',
    features: [
      '✓ 1 000 suggestions IA/mois',
      '✓ 1 plateforme connectée',
      '✓ Analytics de base',
      '✓ Accès mobile',
      '✓ Support email standard',
      '✓ 7% commission — Vous gardez 93%',
      '✓ Plafond: 2 500$/mois',
      '⚠️ API IA non incluse (+10-20$/mois)'
    ],
    cta: 'Start free trial',
    priceId: 'starter'
  },
  {
    name: 'PRO',
    price: '$39/mo',
    freeTrialDays: 7,
    description: 'For growing creators up to $5k/month',
    color: 'purple',
    badge: 'MOST POPULAR',
    commission: '5%',
    revenueCap: '$5,000/month',
    features: [
      '✓ 5 000 suggestions IA/mois',
      '✓ 3 plateformes connectées',
      '✓ Analytics avancés',
      '✓ Support prioritaire',
      '✓ Templates personnalisables',
      '✓ 5% commission — Vous gardez 95%',
      '✓ Plafond: 5 000$/mois',
      '⚠️ API IA non incluse (+20-30$/mois)'
    ],
    cta: 'Start free trial',
    priceId: 'pro'
  },
  {
    name: 'SCALE',
    price: '$79/mo',
    freeTrialDays: 7,
    description: 'For established creators up to $15k/month',
    color: 'blue',
    badge: 'BEST VALUE',
    commission: '3%',
    revenueCap: '$15,000/month',
    features: [
      '✓ 25 000 suggestions IA/mois', 
      '✓ 10 plateformes connectées',
      '✓ Analytics & API avancés',
      '✓ Collaboration équipe (3 users)',
      '✓ Personnalisation IA avancée',
      '✓ 3% commission — Vous gardez 97%',
      '✓ Plafond: 15 000$/mois',
      '⚠️ API IA non incluse (+30-50$/mois)'
    ],
    cta: 'Start free trial',
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
      '✓ Suggestions IA illimitées',
      '✓ Intégrations illimitées',
      '✓ Rapports personnalisés',
      '✓ Aucun plafond de revenus',
      '✓ 1.5% commission — Vous gardez 98.5%',
      '✓ Options marque blanche',
      '✓ Account manager dédié',
      '⚠️ API IA à votre charge (+10-50$/mois)'
    ],
    cta: 'Contact sales',
    priceId: 'enterprise'
  }
];

export default function PricingPage() {
  return <PricingClient plans={plans} />;
}
