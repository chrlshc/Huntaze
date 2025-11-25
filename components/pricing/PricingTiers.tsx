'use client';

import { PricingCard, PricingTier } from './PricingCard';

interface PricingTiersProps {
  tiers: PricingTier[];
}

export function PricingTiers({ tiers }: PricingTiersProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Choose the right plan for you
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Start free during our beta phase. Upgrade when you're ready.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
        {tiers.map((tier) => (
          <PricingCard key={tier.id} tier={tier} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All plans include a 30-day money-back guarantee. No questions asked.
        </p>
      </div>
    </div>
  );
}
