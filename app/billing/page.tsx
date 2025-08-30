'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Check, 
  CreditCard, 
  Shield, 
  Zap, 
  Star, 
  ChevronLeft, 
  Sparkles, 
  Lock,
  ArrowRight,
  TrendingUp,
  Users,
  MessageSquare,
  Bot,
  BarChart3,
  Trophy,
  Rocket,
  Crown,
  Gift,
  DollarSign
} from 'lucide-react';

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for new creators',
      monthlyPrice: 29,
      yearlyPrice: 290,
      badge: null,
      features: [
        { text: 'Up to 500 fans', included: true },
        { text: 'Basic AI responses', included: true },
        { text: 'Message automation', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Email support', included: true },
        { text: 'Advanced AI training', included: false },
        { text: 'Priority support', included: false },
        { text: 'Custom integrations', included: false }
      ],
      gradient: 'from-gray-600 to-gray-700',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For growing creators',
      monthlyPrice: 99,
      yearlyPrice: 990,
      badge: 'MOST POPULAR',
      features: [
        { text: 'Up to 5,000 fans', included: true },
        { text: 'Advanced AI responses', included: true },
        { text: 'Smart automation flows', included: true },
        { text: 'Detailed analytics', included: true },
        { text: 'Priority support', included: true },
        { text: 'AI voice training', included: true },
        { text: 'Campaign manager', included: true },
        { text: 'Custom integrations', included: false }
      ],
      gradient: 'from-purple-600 to-pink-600',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For top creators',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      badge: 'BEST VALUE',
      features: [
        { text: 'Unlimited fans', included: true },
        { text: 'Custom AI personality', included: true },
        { text: 'Advanced automation', included: true },
        { text: 'Real-time analytics', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'API access', included: true },
        { text: 'White-label options', included: true },
        { text: 'Custom integrations', included: true }
      ],
      gradient: 'from-amber-600 to-orange-600',
      popular: false
    }
  ];

  const getPrice = (plan: any) => {
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    return billingPeriod === 'monthly' ? price : Math.floor(price / 12);
  };

  const getSavings = (plan: any) => {
    if (billingPeriod === 'yearly') {
      const yearlySavings = (plan.monthlyPrice * 12) - plan.yearlyPrice;
      return Math.floor(yearlySavings);
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Secure payment by Stripe</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Upgrade Your Business</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose the perfect plan for your growth
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of creators who are automating their fan interactions and scaling their revenue
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly billing
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative elevated-card rounded-2xl border-2 transition-all cursor-pointer ${
                selectedPlan === plan.id
                  ? 'border-purple-600 shadow-2xl shadow-purple-600/20 scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r ${plan.gradient} text-white text-sm font-bold rounded-full shadow-lg`}>
                  {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="p-8 pb-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.gradient} p-3 mb-4`}>
                  {plan.id === 'starter' && <Rocket className="w-full h-full text-white" />}
                  {plan.id === 'professional' && <Crown className="w-full h-full text-white" />}
                  {plan.id === 'enterprise' && <Trophy className="w-full h-full text-white" />}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">${getPrice(plan)}</span>
                    <span className="text-gray-500">/ {billingPeriod === 'monthly' ? 'month' : 'month (billed yearly)'}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 mt-2">
                      Save ${getSavings(plan)} per year
                    </p>
                  )}
                  {billingPeriod === 'yearly' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Billed ${plan.yearlyPrice} annually
                    </p>
                  )}
                </div>

                {/* Select Button */}
                <button
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    selectedPlan === plan.id
                      ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>

              {/* Features */}
              <div className="px-8 pb-8 pt-6 border-t border-gray-100">
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to scale your creator business?</h2>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Join 10,000+ creators who are using Huntaze to automate their fan interactions and grow their revenue
          </p>
          <button
            onClick={() => {/* handle checkout */}}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-xl"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-purple-200 mt-4">
            <Lock className="w-4 h-4 inline mr-1" />
            Secure payment. Cancel anytime. No hidden fees.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Bank-level security</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">PCI compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm">Instant activation</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <span className="text-sm">30-day guarantee</span>
          </div>
        </div>
      </main>
    </div>
  );
}
