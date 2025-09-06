import type { Metadata } from 'next';
import PricingClient from './pricing-client';

export const metadata: Metadata = {
  title: 'Tarifs - Huntaze',
  description:
    'Tarifs simples et transparents pour créatrices. Essai gratuit disponible. Annulez à tout moment.',
};

// Huntaze Pricing Plans
const plans = [
  {
    name: 'STARTER',
    price: '$19/mo',
    freeTrialDays: 7,
    description: 'Parfait pour créatrices débutantes',
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
    cta: 'Essai gratuit',
    priceId: 'starter'
  },
  {
    name: 'PRO',
    price: '$39/mo',
    freeTrialDays: 7,
    description: 'Pour créatrices en croissance (jusquà 5k€/mois)',
    color: 'purple',
    badge: 'PLUS POPULAIRE',
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
    cta: 'Essai gratuit',
    priceId: 'pro'
  },
  {
    name: 'SCALE',
    price: '$79/mo',
    freeTrialDays: 7,
    description: 'Pour créatrices établies (jusqu\'à 15k€/mois)',
    color: 'blue',
    badge: 'MEILLEUR RAPPORT',
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
    cta: 'Essai gratuit',
    priceId: 'scale'
  },
  {
    name: 'ENTERPRISE',
    price: '$199/mo',
    freeTrialDays: 7,
    description: 'Pour top créatrices et agences',
    color: 'gold',
    isPremium: true,
    commission: '1.5%',
    revenueCap: 'Illimité',
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
    cta: 'Contacter l\'équipe',
    priceId: 'enterprise'
  }
];

export default function PricingPage() {
  return <PricingClient plans={plans} />;
}
