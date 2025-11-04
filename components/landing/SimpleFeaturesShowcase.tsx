'use client';

import React from 'react';
import { Check } from 'lucide-react';
import Image from 'next/image';

interface Benefit {
  text: string;
}

interface Feature {
  title: string;
  description: string;
  benefits: Benefit[];
  image: string;
  imageAlt: string;
}

interface SimpleFeaturesShowcaseProps {
  features: Feature[];
}

export function SimpleFeaturesShowcase({ features }: SimpleFeaturesShowcaseProps) {
  return (
    <section className="py-24 bg-white dark:bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to help creators grow their business and engage with their audience.
          </p>
        </div>

        <div className="space-y-32">
          {features.map((feature, index) => {
            const isEven = index % 2 === 0;
            
            return (
              <div
                key={index}
                className={`flex flex-col ${
                  isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center gap-12 lg:gap-16`}
              >
                {/* Content */}
                <div className="flex-1 space-y-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>

                  {/* Benefits with checkmarks */}
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li
                        key={benefitIndex}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5">
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {benefit.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Image */}
                <div className="flex-1 w-full">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                    <Image
                      src={feature.image}
                      alt={feature.imageAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}