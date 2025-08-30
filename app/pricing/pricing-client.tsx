'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Zap, Shield, Users, Calculator, TrendingUp } from 'lucide-react'

interface Plan {
  name: string
  price: string
  description: string
  color?: string
  features: string[]
  badge?: string
  cta: string
  isPremium?: boolean
}

interface PricingClientProps {
  plans: Plan[]
}

export default function PricingClient({ plans }: PricingClientProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 opacity-70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-gray-900 dark:text-white mb-3"
            >
              Simple, fair pricing
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
            >
              Keep more of what you earn. No long contracts, no surprises.
            </motion.p>
            
            {/* Billing Toggle */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-12"
            >
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Yearly
                <span className="ml-1 text-green-600 text-xs">-20%</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Keep More of Your Revenue</h3>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              Stop giving away 50-60% to agencies. Our transparent pricing helps you keep more of what you earn.
            </p>
            <Link href="#breakdown" className="text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block">
              See pricing breakdown →
            </Link>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AI Automation</h3>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              Respond faster and scale conversations with an AI assistant tuned to your style.
            </p>
            <Link href="#demo" className="text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block">
              Watch it in action →
            </Link>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Privacy</h3>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              Strong encryption and GDPR‑aligned practices. We only use official platform APIs.
            </p>
            <Link href="#security" className="text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block">
              Learn about security →
            </Link>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => {
            const isPro = plan.name === 'PRO'
            const monthlyPrice = plan.price.replace('$', '').replace('/mo', '')
            const yearlyPrice = monthlyPrice === '0' ? '0' : Math.round(parseInt(monthlyPrice) * 0.8)
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-8 min-h-[32rem] flex flex-col ${
                  isPro
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl scale-105'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    isPro ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    isPro ? 'text-purple-100' : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className={`text-5xl font-bold ${
                      isPro ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      ${billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice}
                    </span>
                    <span className={`ml-2 ${
                      isPro ? 'text-purple-100' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      /mo
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && monthlyPrice !== '0' && (
                    <p className={`text-sm mt-2 ${
                      isPro ? 'text-purple-100' : 'text-green-600'
                    }`}>
                      Save ${parseInt(monthlyPrice) * 2.4}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        isPro ? 'text-purple-200' : 'text-green-500'
                      }`} />
                      <span className={`text-sm ${
                        isPro ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth"
                  className={`block w-full py-4 px-6 rounded-lg font-semibold transition-all text-center ${
                    isPro
                      ? 'bg-white text-purple-600 hover:bg-gray-100 hover:scale-105 transform shadow-lg'
                      : plan.isPremium
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600 hover:scale-105 transform'
                      : 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 transform'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Section removed to reduce page density */}

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-10">All plans include</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">AI Automation</h3>
              <p className="text-sm text-gray-600">
                Never miss a message or opportunity
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">100% Control</h3>
              <p className="text-sm text-gray-600">
                You own everything, always
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Platform</h3>
              <p className="text-sm text-gray-600">
                Works with supported platforms (OnlyFans, Fansly beta)
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">No Contracts</h3>
              <p className="text-sm text-gray-600">
                Cancel anytime, no penalties
              </p>
            </div>
            <div className="text-center mt-10">
              <Link href="/roadmap" className="text-purple-600 hover:text-purple-700 font-semibold">
                Learn about weekly feature voting →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison removed to keep page focused */}

      {/* Real Savings Examples */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            See How Much You&apos;ll Save
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Creator making $10k/month</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">With Agency (50%):</span>
                  <span className="text-red-600 font-bold">-$5,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">With Huntaze PRO:</span>
                  <span className="text-green-600 font-bold">-$768</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold">You save:</span>
                    <span className="text-green-600 font-bold text-lg">$4,232/month</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-500">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Creator making $30k/month</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">With Agency (50%):</span>
                  <span className="text-red-600 font-bold">-$15,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">With Huntaze SCALE:</span>
                  <span className="text-green-600 font-bold">-$2,098</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold">You save:</span>
                    <span className="text-green-600 font-bold text-lg">$12,902/month</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-yellow-500">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Creator making $100k/month</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">With Agency (50%):</span>
                  <span className="text-red-600 font-bold">-$50,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">With Huntaze ENTERPRISE:</span>
                  <span className="text-green-600 font-bold">-$2,499</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold">You save:</span>
                    <span className="text-green-600 font-bold text-lg">$47,501/month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials removed for brevity */}

      {/* CTA removed to keep focus on plans */}
    </div>
  );
}
