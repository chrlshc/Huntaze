import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing - Huntaze',
  description:
    'Revolutionary pricing for OF creators. Keep 85-98% of your revenue with our transparent commission caps. First month free if you make less than $1.5k/month.',
};

// Huntaze Pricing Plans
const plans = [
  {
    name: 'STARTER',
    price: '$0/mo',
    description: 'Perfect for creators just starting out',
    color: 'green',
    features: [
      'First month FREE if <$1.5k/mo',
      '20% → 5% commission (scales down)',
      '90 days: 0% on first $500/mo',
      'All core automation features',
      'Email support'
    ],
    badge: 'MOST POPULAR',
    cta: 'Start Free'
  },
  {
    name: 'PRO',
    price: '$69/mo',
    description: 'For established creators ready to scale',
    color: 'purple',
    features: [
      'Commission capped at $699/mo',
      'Perfect for $4k-20k/mo creators',
      'Advanced analytics & insights',
      'Priority support',
      'Custom AI training'
    ],
    cta: 'Go Pro'
  },
  {
    name: 'SCALE',
    price: '$99/mo',
    description: 'Maximum growth with minimal fees',
    color: 'blue',
    features: [
      'Commission capped at $1,999/mo',
      'Best for $20k-50k/mo creators',
      'Multi-platform management',
      'Dedicated success manager',
      'API access'
    ],
    cta: 'Scale Up'
  },
  {
    name: 'ENTERPRISE',
    price: '$499/mo',
    description: 'For top creators and agencies',
    color: 'gold',
    isPremium: true,
    features: [
      'Only 2% flat commission',
      'For $50k+/mo creators',
      'White-label options',
      'Custom integrations',
      '24/7 phone support'
    ],
    cta: 'Contact Sales'
  }
];

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-24">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          Keep 85-98% of Your Revenue
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Unlike agencies that take 50-60% forever, Huntaze uses smart commission caps. 
          The more you grow, the less you pay. First month FREE if you're making less than $1.5k/month!
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => {
          const getCardStyles = () => {
            if (plan.isPremium) {
              return "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-yellow-500/50 shadow-2xl transform hover:scale-105 transition-all duration-300";
            }
            
            const colorMap: Record<string, string> = {
              green: "bg-white border-2 border-green-500 hover:border-green-600",
              purple: "bg-white border-2 border-purple-500 hover:border-purple-600",
              blue: "bg-white border-2 border-blue-500 hover:border-blue-600",
            };
            
            return colorMap[plan.color || ''] || "bg-white border-2 border-gray-300";
          };

          return (
            <div
              key={index}
              className={`relative p-6 rounded-2xl shadow-lg overflow-hidden transition-all ${getCardStyles()}`}
            >
              {plan.badge && (
                <span className="absolute top-4 right-4 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-full px-3 py-1">
                  {plan.badge}
                </span>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className={`text-2xl font-bold ${plan.isPremium ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mt-1 ${plan.isPremium ? 'text-gray-300' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className={`text-4xl font-bold ${plan.isPremium ? 'text-yellow-400' : 'text-gray-900'}`}>
                  {plan.price}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-start text-sm ${plan.isPremium ? 'text-gray-300' : 'text-gray-700'}`}>
                      <svg className={`w-5 h-5 mr-2 flex-shrink-0 ${plan.isPremium ? 'text-yellow-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/join"
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.isPremium 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600' 
                      : plan.color === 'purple'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : plan.color === 'blue'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      {/* Comparison Section */}
      <section className="space-y-8 bg-gradient-to-b from-purple-50 via-pink-50 to-purple-50/30 rounded-2xl p-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-purple-700">
          Huntaze vs Traditional Agencies
        </h2>
        <div className="max-w-4xl mx-auto">
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
      </section>

      {/* Real Savings Examples */}
      <section className="space-y-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">
          See How Much You'll Save
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
      </section>
      
      {/* CTA Section */}
      <section className="text-center space-y-6 py-12">
        <h2 className="text-3xl font-bold">Ready to Keep More of Your Money?</h2>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
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
      </section>
    </div>
  );
}