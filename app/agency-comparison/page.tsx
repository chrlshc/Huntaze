'use client'

import React from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import PremiumButton from '@/components/premium-button';

export default function AgencyComparisonPage() {
  const comparisonPoints = [
    {
      feature: 'Revenue share',
      agency: '50-60% to agency',
      huntaze: '3-7% platform fee',
      savings: 'Keep 43-57% more'
    },
    {
      feature: 'Control',
      agency: 'Agency manages everything',
      huntaze: 'You control everything',
      savings: 'Full ownership'
    },
    {
      feature: 'AI Chat',
      agency: 'Chatters pretending to be you',
      huntaze: 'AI suggestions, you approve',
      savings: 'Authentic & scalable'
    },
    {
      feature: 'Contracts',
      agency: '6-12 month lock-in',
      huntaze: 'Cancel anytime',
      savings: 'No commitment'
    },
    {
      feature: 'Transparency',
      agency: 'Hidden fees & costs',
      huntaze: 'Clear pricing',
      savings: '100% transparent'
    },
    {
      feature: 'Data & Analytics',
      agency: 'Limited reporting',
      huntaze: 'Full analytics dashboard',
      savings: 'Data-driven growth'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Huntaze vs. Traditional Agencies
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            See why creators are switching from expensive agencies to Huntaze's transparent platform.
          </p>
        </div>
      </section>

      {/* Main Comparison Table */}
      <section className="pb-16 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Traditional Agency</th>
                  <th className="text-center py-4 px-4 font-semibold text-purple-600 dark:text-purple-400">Huntaze</th>
                  <th className="text-center py-4 px-4 font-semibold text-green-600 dark:text-green-400">Your Benefit</th>
                </tr>
              </thead>
              <tbody>
                {comparisonPoints.map((point, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-900">
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{point.feature}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-2 text-red-600 dark:text-red-400">
                        <X className="w-4 h-4" />
                        {point.agency}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        {point.huntaze}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-purple-600 dark:text-purple-400">
                      {point.savings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How Huntaze Really Works */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How Huntaze Really Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border dark:border-gray-800">
              <div className="text-purple-600 dark:text-purple-400 font-bold mb-2">1. Connect</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Link your platforms</h3>
              <p className="text-gray-700 dark:text-gray-400">
                Connect OnlyFans, Fansly, and social accounts. Your data stays private and secure.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border dark:border-gray-800">
              <div className="text-purple-600 dark:text-purple-400 font-bold mb-2">2. Automate</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">AI learns your style</h3>
              <p className="text-gray-700 dark:text-gray-400">
                Our AI suggests replies in your voice. You review and approve before sending.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border dark:border-gray-800">
              <div className="text-purple-600 dark:text-purple-400 font-bold mb-2">3. Grow</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Scale with insights</h3>
              <p className="text-gray-700 dark:text-gray-400">
                Track what works, optimize pricing, and keep 93-98.5% of your revenue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Numbers */}
      <section className="py-16 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            The Real Cost Difference
          </h2>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/15 dark:to-pink-900/15 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  With a Traditional Agency
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-400">Your monthly revenue:</span>
                    <span className="font-medium text-gray-900 dark:text-white">$10,000</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-400">Agency takes (50%):</span>
                    <span className="font-medium text-red-600 dark:text-red-400">-$5,000</span>
                  </li>
                  <li className="flex justify-between border-t pt-3">
                    <span className="font-semibold text-gray-900 dark:text-white">You keep:</span>
                    <span className="font-bold text-xl text-gray-900 dark:text-white">$5,000</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  With Huntaze
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-400">Your monthly revenue:</span>
                    <span className="font-medium text-gray-900 dark:text-white">$10,000</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-400">Huntaze fee (3% + $79):</span>
                    <span className="font-medium text-green-600 dark:text-green-400">-$379</span>
                  </li>
                  <li className="flex justify-between border-t pt-3">
                    <span className="font-semibold text-gray-900 dark:text-white">You keep:</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-400">$9,621</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                That's $4,621 more in your pocket every month!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16 px-6 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to keep more of your revenue?
          </h2>
          <p className="text-lg text-purple-100 mb-8">
            Join creators who've already made the switch.
          </p>
          <Link href="/auth">
            <PremiumButton 
              variant="secondary"
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Start free trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </PremiumButton>
          </Link>
          <p className="text-purple-100 mt-4 text-sm">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
