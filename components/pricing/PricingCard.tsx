'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';

export interface PricingTier {
  id: string;
  name: string;
  price: number | 'custom';
  period: 'month' | 'year';
  description: string;
  features: string[];
  cta: {
    text: string;
    href: string;
  };
  highlighted?: boolean;
  isBeta?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  const { name, price, period, description, features, cta, highlighted, isBeta } = tier;

  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        highlighted
          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-lg'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-purple-600 px-4 py-1 text-xs font-semibold text-white">
            Recommended
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      <div className="mb-6">
        {price === 'custom' ? (
          <div className="text-4xl font-bold text-gray-900 dark:text-white">Custom</div>
        ) : (
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {isBeta ? '€0' : `€${price}`}
            </span>
            {!isBeta && <span className="ml-2 text-gray-600 dark:text-gray-400">/{period}</span>}
          </div>
        )}
        {isBeta && (
          <p className="mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
            Free during beta
          </p>
        )}
      </div>

      <Link
        href={cta.href}
        className={`block w-full rounded-lg px-6 py-3 text-center text-sm font-semibold transition-colors ${
          highlighted
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
        }`}
      >
        {isBeta ? 'Request Access' : cta.text}
      </Link>

      <ul className="mt-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="mr-3 h-5 w-5 flex-shrink-0 text-purple-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
