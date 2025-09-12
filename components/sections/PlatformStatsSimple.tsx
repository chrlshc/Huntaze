'use client';

import { TrendingUp, Users, Clock } from 'lucide-react';

const stats = [
  {
    label: 'Active creators',
    value: '15,000+',
    icon: Users,
    description: 'Growing monthly'
  },
  {
    label: 'Average revenue increase',
    value: '3.2x',
    icon: TrendingUp,
    description: 'In first 90 days'
  },
  {
    label: 'Hours saved weekly',
    value: '23',
    icon: Clock,
    description: 'Per creator on average'
  }
];

export default function PlatformStatsSimple() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by thousands of creators
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Real results from real creators using Huntaze to grow their business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Icon className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-medium text-gray-300 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-400">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Source disclaimer */}
        <div className="text-center mt-12">
          <p className="text-xs text-gray-400">
            * Based on internal data from Q3 2024. Revenue increase measured vs. pre-Huntaze baseline.
          </p>
        </div>
      </div>
    </section>
  );
}