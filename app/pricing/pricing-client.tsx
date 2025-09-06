'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  commission?: string
  revenueCap?: string
  priceId?: string
}

interface PricingClientProps {
  plans: Plan[]
}

export default function PricingClient({ plans }: PricingClientProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [detailsPlan, setDetailsPlan] = useState<string | null>(null)
  const router = useRouter()

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(planId)
      
      // Check if user is authenticated
      const authResponse = await fetch('/api/users/profile')
      if (!authResponse.ok) {
        // Not authenticated, redirect to auth with plan info
        router.push(`/auth?plan=${planId}`)
        return
      }

      // Create checkout session
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      const data = await response.json()
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoading(null)
    }
  }
  // Stripe-aligned marketing copy used in per-plan modal
  const detailsByPlan: Record<string, string[]> = {
    starter: [
      '1,000 AI messages/month',
      '1 platform integration',
      'Basic analytics',
      'Mobile app access',
      'Standard email support',
      '7% platform fee',
      'Revenue cap: $2,500/month',
    ],
    pro: [
      '5,000 AI messages/month',
      '3 platform integrations',
      'Advanced analytics',
      'Priority support',
      'Real-time automation',
      '5% platform fee - You keep 95%',
      'Revenue cap: $5,000/month',
    ],
    scale: [
      '25,000 AI messages/month',
      '10 platform integrations',
      'Advanced analytics & API',
      'Team collaboration (3 users)',
      'Custom AI training',
      '3% platform fee - You keep 97%',
      'Revenue cap: $15,000/month',
    ],
    enterprise: [
      'Unlimited AI messages',
      'Unlimited integrations',
      'Custom reporting',
      'No revenue cap',
      '1.5% platform fee - You keep 98.5%',
      'White-label options',
      'Dedicated account manager',
    ],
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section - Simplified */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose your plan
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Start free. Upgrade anytime. No hidden fees.
          </p>
            
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
                    : 'text-gray-500 dark:text-[var(--text-tertiary-dark)]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-[var(--text-tertiary-dark)]'
                }`}
              >
                Yearly
                <span className="ml-1 text-green-600 text-xs">-20%</span>
              </button>
            </motion.div>
        </div>
      </div>

      {/* Trust Indicators - Simplified */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700 dark:text-gray-200">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            Free trial on all plans
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            Cancel anytime
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            No setup fees
          </span>
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
                className={`relative rounded-2xl p-8 min-h-[32rem] flex flex-col elevated-card hover:shadow-md transition-shadow ${isPro ? 'ring-2 ring-purple-300 dark:ring-purple-700' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 text-gray-900 dark:text-white`}>
                    {plan.name}
                  </h3>
                  {/* Free Trial Badge */}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 mb-2">
                    7-day free trial
                  </span>
                  <p className={`text-sm mb-4 text-gray-700 dark:text-gray-400`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className={`text-5xl font-bold text-gray-900 dark:text-white`}>
                      ${billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice}
                    </span>
                    <span className={`ml-2 text-gray-700 dark:text-gray-400`}>
                      /mo
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && monthlyPrice !== '0' && (
                    <p className={`text-sm mt-2 text-green-600`}>
                      Save ${parseInt(monthlyPrice) * 2.4}/year
                    </p>
                  )}
                  {plan.commission && (
                    <div className="mt-4 pt-4 border-t border-opacity-20 border-current">
                      <p className={`text-lg font-semibold text-gray-900 dark:text-white`}>
                        {plan.commission} platform fee
                      </p>
                      <p className={`text-xs text-gray-600 dark:text-[var(--text-secondary-dark)]`}>
                        Revenue cap: {plan.revenueCap}
                      </p>
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        isPro ? 'text-purple-200' : 'text-green-500'
                      }`} />
                      <span className={`text-sm ${
                        isPro ? 'text-white' : 'text-gray-700 dark:text-gray-200'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.priceId || plan.name.toLowerCase())}
                  disabled={loading === (plan.priceId || plan.name.toLowerCase())}
                  className={`block w-full py-4 px-6 rounded-lg font-semibold transition-all text-center ${
                    plan.isPremium
                      ? 'bg-amber-400 text-gray-900 hover:bg-amber-500'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } ${loading === (plan.priceId || plan.name.toLowerCase()) ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {loading === (plan.priceId || plan.name.toLowerCase()) ? 'Loading...' : plan.cta}
                </button>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setDetailsPlan((plan.priceId || plan.name.toLowerCase()).toLowerCase())}
                    className={`text-sm underline ${
                      isPro ? 'text-purple-100 hover:text-white' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    View details
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Section removed to reduce page density */}

      {/* Features Section - Simplified */}
      <div className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Included in all plans</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <Zap className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">AI Chat Assistant</p>
            </div>
            <div>
              <Shield className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Secure & Private</p>
            </div>
            <div>
              <Users className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Multi-Platform</p>
            </div>
            <div>
              <Check className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">No Lock-in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison removed to keep page focused */}

      {/* Real Savings Examples */}
      <div className="bg-gray-50 dark:bg-gray-900 py-16 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            See How Much You&apos;ll Save
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="elevated-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Creator making $2k/month</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-[var(--text-secondary-dark)]">With Agency (50%):</span>
                  <span className="text-red-600 font-bold">-$1,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-[var(--text-secondary-dark)]">With Huntaze STARTER (7%):</span>
                  <span className="text-green-600 font-bold">-$159</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">You save:</span>
                    <span className="text-green-600 font-bold text-base md:text-lg">$841/mo</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="elevated-card rounded-xl p-6 border-2 border-purple-500">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Creator making $10k/month</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-[var(--text-secondary-dark)]">With Agency (50%):</span>
                  <span className="text-red-600 font-bold">-$5,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-[var(--text-secondary-dark)]">With Huntaze SCALE (3%):</span>
                  <span className="text-green-600 font-bold">-$379</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">You save:</span>
                    <span className="text-green-600 font-bold text-base md:text-lg">$4,621/mo</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="elevated-card rounded-xl p-6 border-2 border-yellow-500">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Creator making $50k/month</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-[var(--text-secondary-dark)]">With Agency (50%):</span>
                  <span className="text-red-600 font-bold">-$25,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-[var(--text-secondary-dark)]">With Huntaze ENTERPRISE (1.5%):</span>
                  <span className="text-green-600 font-bold">-$949</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">You save:</span>
                    <span className="text-green-600 font-bold text-base md:text-lg">$24,051/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link href="/agency-comparison" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            Prefer a full comparison? See Huntaze vs Agencies →
          </Link>
        </div>
      </div>
      
      {/* Compliance & Safety */}
      <div className="bg-white dark:bg-gray-900 py-12 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="elevated-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Compliance & Safety</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-[var(--text-secondary-dark)]">
              <li>L'IA fournit des suggestions de réponses. Vous approuvez avant envoi.</li>
              <li>Intégration OnlyFans en lecture seule (CSV uniquement pour l'instant).</li>
              <li>Respectez les conditions de chaque plateforme. Huntaze n'est affilié à aucune plateforme.</li>
              <li>Aucune garantie de zéro bannissement - nous aidons à réduire les risques.</li>
              <li>Les coûts d'API IA (OpenAI/Claude) sont facturés séparément.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testimonials removed for brevity */}

      {/* CTA removed to keep focus on plans */}

      {/* Per‑plan Details Modal */}
      {detailsPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDetailsPlan(null)} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative elevated-card max-w-lg w-[92%] rounded-xl p-6 bg-white dark:bg-gray-900"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                {detailsPlan} plan — details
              </h3>
              <button onClick={() => setDetailsPlan(null)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">✕</button>
            </div>
            <p className="text-sm text-gray-700 dark:text-[var(--text-secondary-dark)] mb-4">Marketing feature list</p>
            <ul className="space-y-2 list-disc pl-5 text-gray-800 dark:text-[var(--text-secondary-dark)]">
              {(detailsByPlan[detailsPlan] || []).map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
            <div className="mt-6 text-right">
              <button
                onClick={() => setDetailsPlan(null)}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
