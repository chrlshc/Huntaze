'use client';

import React from 'react';
import { ScrollReveal } from '@/components/animations/SimpleScrollReveal';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeaturesGridProps {
  features: Feature[];
}

const detailedFeatures = [
  {
    title: 'Content Management',
    description: 'Create, schedule, and publish content across all your platforms from one unified dashboard.',
    benefits: [
      'Multi-platform scheduling',
      'AI-powered content suggestions',
      'Bulk operations and templates',
    ],
    imagePosition: 'left' as const,
  },
  {
    title: 'Advanced Analytics',
    description: 'Track performance, understand your audience, and make data-driven decisions with powerful insights.',
    benefits: [
      'Real-time performance metrics',
      'Audience demographics',
      'Revenue tracking and forecasting',
    ],
    imagePosition: 'right' as const,
  },
  {
    title: 'Fan Engagement',
    description: 'Build stronger relationships with your fans through intelligent CRM and automated messaging.',
    benefits: [
      'Smart fan segmentation',
      'Automated responses',
      'Conversation management',
    ],
    imagePosition: 'left' as const,
  },
];

export function FeaturesGrid({ features }: FeaturesGridProps) {
  return (
    <>
      {/* Features Grid */}
      <section id="features" className="py-24 px-4 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Everything You Need
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Powerful tools designed to help creators succeed
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-14 h-14 mb-5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features with Screenshots */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto space-y-32">
          {detailedFeatures.map((feature, index) => (
            <ScrollReveal key={index} direction={feature.imagePosition === 'left' ? 'left' : 'right'}>
              <div className={`grid md:grid-cols-2 gap-12 items-center ${feature.imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`}>
                {/* Content */}
                <div className={feature.imagePosition === 'right' ? 'md:order-2' : ''}>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Screenshot Placeholder */}
                <div className={feature.imagePosition === 'right' ? 'md:order-1' : ''}>
                  <div className="aspect-video rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl border-4 border-[var(--border-default)] dark:border-[var(--border-default)] overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
                      Screenshot: {feature.title}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </>
  );
}
