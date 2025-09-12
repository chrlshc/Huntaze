'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Zap } from 'lucide-react'

interface PricingTier {
  name: string
  badge?: string
  price: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$0',
    description: 'Perfect for testing the waters',
    features: [
      'Up to 100 active fans',
      'Basic AI conversations',
      'Simple analytics dashboard',
      'Email support',
      '14-day free trial'
    ],
    cta: 'Start free'
  },
  {
    name: 'Pro',
    badge: 'MOST POPULAR',
    price: '7%',
    description: 'For serious creators ready to scale',
    features: [
      'Unlimited fans',
      'Advanced AI with your voice',
      'PPV revenue optimization',
      'Priority support',
      'All integrations',
      'Custom workflows'
    ],
    cta: 'Get started',
    popular: true
  },
  {
    name: 'Scale',
    price: '2-5%',
    description: 'Volume discounts for top creators',
    features: [
      'Everything in Pro',
      'Dedicated success manager',
      'Custom AI training',
      'API access',
      'White-label options',
      'Quarterly business reviews'
    ],
    cta: 'Contact sales'
  }
]

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'performance'>('performance')

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Pay only when you earn
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            No monthly fees. Just a small percentage of the revenue we help you generate.
          </p>

          {/* Performance Fee Explainer */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-900 dark:text-purple-100 font-medium">
              Performance-based pricing: We only win when you win
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative bg-white dark:bg-gray-800 rounded-2xl p-8 
                ${tier.popular ? 'ring-2 ring-purple-600 shadow-xl' : 'shadow-lg'}
              `}
            >
              {/* Popular Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Tier Name */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {tier.price}
                </span>
                {tier.price !== '$0' && (
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    of revenue
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {tier.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`
                  w-full py-3 rounded-lg font-semibold transition-colors
                  ${tier.popular
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                  }
                `}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Revenue Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              See how much you'll save
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Compare our fees to traditional agencies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                20-40%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Typical agency fees
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                2-7%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Huntaze performance fee
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                +33%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                More profit in your pocket
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Making over $1M/year? Let's discuss custom pricing.
          </p>
          <a
            href="/contact-sales"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            Talk to enterprise sales
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}