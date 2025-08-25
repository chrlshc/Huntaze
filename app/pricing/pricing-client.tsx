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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 opacity-70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-gray-900 mb-4"
            >
              Keep 85-98% of Your Revenue
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Unlike agencies that take 50-60% forever, Huntaze uses smart commission caps. 
              The more you grow, the less you pay.
            </motion.p>
            
            {/* Billing Toggle */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center p-1 bg-gray-100 rounded-lg mb-12"
            >
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Annuel
                <span className="ml-1 text-green-600 text-xs">-20%</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 -mt-8">
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
                className={`relative rounded-2xl p-8 ${
                  isPro
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl scale-105'
                    : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    isPro ? 'text-white' : 'text-gray-900'
                  }`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    isPro ? 'text-purple-100' : 'text-gray-600'
                  }`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className={`text-5xl font-bold ${
                      isPro ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice}
                    </span>
                    <span className={`ml-2 ${
                      isPro ? 'text-purple-100' : 'text-gray-600'
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
                        isPro ? 'text-white' : 'text-gray-700'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/join"
                  className={`block w-full py-3 px-6 rounded-lg font-medium transition-all text-center ${
                    isPro
                      ? 'bg-white text-purple-600 hover:bg-gray-100'
                      : plan.isPremium
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            What every plan includes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">24/7 AI Automation</h3>
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
                Works with all major platforms
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
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-b from-purple-50 via-pink-50 to-purple-50/30 rounded-2xl p-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-purple-700">
            Huntaze vs Traditional Agencies
          </h2>
          <div className="max-w-4xl mx-auto mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-red-600">❌ Traditional Agencies</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Take 50-60% of ALL revenue forever
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Control your account and decisions
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Limited hours (miss opportunities)
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Long contracts with penalties
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Human errors and inconsistency
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-600">✅ Huntaze Platform</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Capped commissions (save 85-98%)
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    You keep 100% control always
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    24/7 automation never sleeps
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Cancel anytime, no penalties
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    AI consistency at scale
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

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
      
      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Keep More of Your Money?</h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            Join hundreds of creators who switched from agencies to Huntaze and are now keeping 85-98% more revenue every month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/join"
              className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:from-pink-600 hover:to-purple-600 transition-colors"
            >
              Start Free (First Month)
            </Link>
            <Link
              href="/demo"
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors"
            >
              See Live Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}