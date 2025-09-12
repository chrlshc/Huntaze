'use client';

import { useState } from 'react';
import { Check, X, Zap, TrendingUp, Globe, Users, Brain, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const GmvCalculator = dynamic(() => import('./components/GmvCalculator'), { ssr: false });

export default function PricingV2() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'STARTER',
      price: billingPeriod === 'monthly' ? 19 : 16,
      yearlyPrice: 192,
      color: 'green',
      icon: <Zap className="w-6 h-6" />,
      targetRevenue: '$500-2,500/mo',
      commission: '9%',
      revenueCap: '$2,000',
      features: {
        core: [
          '1,000 AI messages/month',
          'GPT-4 powered responses',
          'Basic fan segmentation',
          'Welcome messages',
          'PPV campaigns',
          'Revenue dashboard',
          '30-day analytics',
          'Eligible up to $2,000 GMV/mo'
        ],
        advanced: [],
        notIncluded: [
          'Multi-language support',
          'Marketing AI',
          'Predictive analytics',
          'Multiple accounts'
        ]
      }
    },
    {
      name: 'PRO',
      price: billingPeriod === 'monthly' ? 49 : 41,
      yearlyPrice: 492,
      color: 'purple',
      badge: 'MOST POPULAR',
      icon: <TrendingUp className="w-6 h-6" />,
      targetRevenue: '$2,500-7,500/mo',
      commission: '7%',
      revenueCap: '$7,500',
      features: {
        core: [
          '5,000 AI messages/month',
          'GPT-4-Turbo + Claude AI',
          'Advanced segmentation',
          'Smart relances',
          'Multi-language (10 languages)',
          'Behavioral insights',
          '90-day analytics'
        ],
        advanced: [
          'Instagram/Twitter/TikTok AI',
          'Trending hashtags & captions',
          'Content scheduling',
          'Link tracking & funnels'
        ],
        notIncluded: [
          'Predictive AI',
          'Multiple accounts',
          'Team collaboration'
        ]
      }
    },
    {
      name: 'SCALE',
      price: billingPeriod === 'monthly' ? 79 : 66,
      yearlyPrice: 792,
      color: 'blue',
      icon: <Users className="w-6 h-6" />,
      targetRevenue: '$7,500-25,000/mo',
      commission: '5%',
      revenueCap: '$25,000',
      features: {
        core: [
          '25,000 AI messages/month',
          'Predictive AI (GPT-4-Turbo + Claude)',
          'Hyper-segmentation',
          'Multi-language (100+ languages)',
          'A/B testing messages',
          'Churn prevention alerts',
          'Full analytics + API'
        ],
        advanced: [
          'All platform marketing',
          'Viral content AI',
          'Manage 3 OF accounts',
          'Team collaboration (3 seats)',
          'Competitor analysis',
          'Revenue predictions'
        ],
        notIncluded: [
          'Custom AI training',
          'White label',
          'Unlimited accounts'
        ]
      }
    },
    {
      name: 'ENTERPRISE',
      price: 399,
      yearlyPrice: 4788,
      color: 'yellow',
      icon: <Brain className="w-6 h-6" />,
      targetRevenue: '$25,000+/mo',
      commission: '2% (annual commitment)',
      revenueCap: '—',
      requiresQualification: true,
      features: {
        core: [
          'Unlimited AI messages',
          'GPT-4o + Claude Opus (best AI)',
          'Perfect fan mimicry',
          'All languages + dialects',
          'Custom AI personality',
          'White glove onboarding',
          'Dedicated success manager'
        ],
        advanced: [
          'Unlimited accounts',
          'Full marketing suite',
          'Custom automations',
          'White label option',
          'Priority support',
          'Quarterly strategy sessions'
        ],
        notIncluded: []
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Pricing That Scales With Your Success
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Every plan includes full OnlyFans automation. The difference? 
            AI power, message volume, and advanced features that match your growth stage.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 max-w-3xl mx-auto">
            No hidden fees. Payment processing (Stripe) not included (≈ 2.9% + $0.30/txn). Overage (plan policy): Starter $3/1k • Pro $15/1k • Scale $30/1k • Enterprise contractual.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-background-elevated rounded-2xl shadow-xl border hover-lift-soft ${
                plan.badge ? 'border-primary scale-105' : 'border-border'
              } hover:border-primary/40 transition-all`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  {plan.badge}
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-xl bg-${plan.color}-100 dark:bg-${plan.color}-900/30 mb-4`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  {plan.name === 'ENTERPRISE' ? (
                    <>
                      <div className="text-4xl font-black text-gray-900 dark:text-white">
                        ${plan.price}
                        <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mo</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Billed annually (${plan.yearlyPrice}/year)
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl font-black text-gray-900 dark:text-white">
                        ${plan.price}
                        <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mo</span>
                      </div>
                      {billingPeriod === 'yearly' && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          ${plan.yearlyPrice}/year
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Target & Commission */}
                <div className="space-y-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">For creators earning:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{plan.targetRevenue}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Platform fee:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{plan.commission}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Revenue cap:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{plan.revenueCap}</span>
                  </div>
                  {plan.name === 'ENTERPRISE' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Billing:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">Annual only</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-6 mb-8">
                  {/* Core Features */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                      Core Features
                    </p>
                    <ul className="space-y-2">
                      {plan.features.core.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Advanced Features */}
                  {plan.features.advanced.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                        Advanced Features
                      </p>
                      <ul className="space-y-2">
                        {plan.features.advanced.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Not Included */}
                  {plan.features.notIncluded.length > 0 && index < 3 && (
                    <div className="opacity-60">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Not Included
                      </p>
                      <ul className="space-y-2">
                        {plan.features.notIncluded.slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-500 line-through">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Notes (upgrade thresholds, caps, eligibility) */}
                {plan.name === 'STARTER' && (
                  <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 text-xs text-gray-600 dark:text-gray-400">
                    <p>• Cheaper than Pro below ~$1k GMV; Pro is cheaper above $1k.</p>
                    <p>• Eligible up to $2,000 GMV/mo. Fees capped at $180/mo.</p>
                  </div>
                )}
                {plan.name === 'PRO' && (
                  <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 text-xs text-gray-600 dark:text-gray-400">
                    <p>• Cheaper than Starter above $1k GMV.</p>
                    <p>• Platform fees capped at $525/mo.</p>
                  </div>
                )}
                {plan.name === 'SCALE' && (
                  <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 text-xs text-gray-600 dark:text-gray-400">
                    <p>• Platform fees capped at $1,250/mo.</p>
                  </div>
                )}
                {plan.name === 'ENTERPRISE' && (
                  <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 text-xs text-gray-600 dark:text-gray-400">
                    <p>• 2% platform fee with annual commitment.</p>
                    <p>• Annual commitment. Minimum $399/mo.</p>
                  </div>
                )}

                {/* CTA Button */}
                <Link href={plan.requiresQualification ? '/apply' : '/join'}>
                  <button className={`w-full py-3 rounded-xl font-semibold transition-all hover-lift-soft ${
                    plan.badge 
                      ? 'bg-primary text-primary-foreground hover:opacity-90' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                    {plan.requiresQualification ? 'Apply Now' : 'Start Free Trial'}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* GMV Calculator */}
        <div id="calculator">
          <GmvCalculator />
        </div>

        {/* Key Differentiators */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-xl mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            What Makes Huntaze Different
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mb-4">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                Multi-Model AI
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We use GPT-4, Claude, and more. Each plan gets different AI power, 
                not just different message limits.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                True Multi-Language
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI that speaks 100+ languages while keeping your personality. 
                Reach fans globally without barriers.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-green-100 dark:bg-green-900/30 mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                Smart Segmentation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI learns each fan\'s behavior and spending patterns. 
                Send the right message at the right time.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Still Have Questions?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            See how we compare to agencies and other AI tools
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/compare">
              <button className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:border-purple-500 transition-colors">
                Compare vs Agencies
              </button>
            </Link>
            <Link href="/roi-calculator">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 hover-lift-soft transition-colors flex items-center gap-2">
                Calculate Your ROI
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
