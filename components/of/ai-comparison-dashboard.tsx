'use client';

import { useState } from 'react';
import { Brain, Zap, Clock, TrendingUp, Check, X, ChevronRight } from 'lucide-react';
import { AI_MODELS_BY_PLAN, AI_CONVERSION_EXAMPLES, AI_FEATURES_MATRIX } from '@/lib/of/ai-models-by-plan';

export default function AIComparisonDashboard() {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'scale' | 'enterprise'>('pro');
  const [showExample, setShowExample] = useState(false);

  const plans = ['starter', 'pro', 'scale', 'enterprise'] as const;
  const planConfig = AI_MODELS_BY_PLAN[selectedPlan];

  return (
    <div className="space-y-8">
      {/* AI Model Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">AI Power by Plan</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Each plan uses different AI models. Higher plans = smarter AI = more sales
          </p>
        </div>

        {/* Plan Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {plans.map(plan => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className={`px-6 py-3 rounded-lg font-medium capitalize transition-all ${
                selectedPlan === plan
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
              }`}
            >
              {plan}
            </button>
          ))}
        </div>

        {/* Selected Plan Details */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-semibold">AI Model</h3>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-6">
              <h4 className="text-2xl font-bold mb-2">{planConfig.models.primary.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {planConfig.models.primary.model}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Response: {planConfig.models.primary.responseTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Context: {planConfig.models.primary.contextWindow.toLocaleString()} tokens</span>
                </div>
              </div>

              {planConfig.models.fallback && (
                <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded">
                  <p className="text-sm">
                    <strong>Backup:</strong> {planConfig.models.fallback.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {planConfig.models.fallback.when}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold">Performance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Message Quality</span>
                  <span className="font-medium capitalize">{planConfig.features.messageQuality}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    style={{ 
                      width: `${
                        planConfig.features.messageQuality === 'basic' ? 25 :
                        planConfig.features.messageQuality === 'good' ? 50 :
                        planConfig.features.messageQuality === 'excellent' ? 75 :
                        100
                      }%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Personalization</span>
                  <span className="font-medium">{planConfig.features.personalization}/10</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
                    style={{ width: `${planConfig.features.personalization * 10}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Sales Boost:</strong> {planConfig.features.salesConversion}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Learning Speed:</span>
                  <p className="font-medium capitalize">{planConfig.features.learningSpeed}</p>
                </div>
                <div>
                  <span className="text-gray-500">Messages/Month:</span>
                  <p className="font-medium">
                    {planConfig.limits.messagesPerMonth === -1 ? 'Unlimited' : planConfig.limits.messagesPerMonth.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-8">
          <h4 className="font-semibold mb-4">AI Capabilities</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {planConfig.models.primary.capabilities.map((capability, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">{capability}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real Examples */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Real AI Examples</h3>
          <button
            onClick={() => setShowExample(!showExample)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            {showExample ? 'Hide' : 'Show'} Examples
          </button>
        </div>

        {showExample && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-medium mb-2">Basic Message</h4>
              <p className="text-sm italic">{planConfig.examples.basicMessage}</p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium mb-2">Sales Message</h4>
              <p className="text-sm italic">{planConfig.examples.salesMessage}</p>
              {planConfig.examples.differenceFromLower && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  <strong>Advantage:</strong> {planConfig.examples.differenceFromLower}
                </p>
              )}
            </div>

            {/* Conversion Rate Example */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium mb-3">Scenario: Fan viewed PPV but didn't buy</h4>
              <div className="space-y-2">
                {Object.entries(AI_CONVERSION_EXAMPLES).map(([plan, data]) => {
                  if (plan === 'scenario') return null;
                  return (
                    <div key={plan} className={`p-3 rounded ${
                      plan === selectedPlan ? 'bg-white dark:bg-gray-800 ring-2 ring-green-500' : ''
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium capitalize">{plan}</span>
                        <span className="text-green-600 font-bold">{(data as any).conversion} conversion</span>
                      </div>
                      <p className="text-xs italic text-gray-600 dark:text-gray-400">
                        {(data as any).message}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Matrix */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-6">Feature Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">Feature</th>
                <th className="text-center py-3 px-4">Starter</th>
                <th className="text-center py-3 px-4">Pro</th>
                <th className="text-center py-3 px-4">Scale</th>
                <th className="text-center py-3 px-4">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(AI_FEATURES_MATRIX).map(([feature, availability]) => (
                <tr key={feature} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm">{feature}</td>
                  {availability.map((available, idx) => (
                    <td key={idx} className="text-center py-3 px-4">
                      {available ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">
          {selectedPlan === 'starter' && 'Start with Basic AI'}
          {selectedPlan === 'pro' && 'Upgrade to Smarter AI'}
          {selectedPlan === 'scale' && 'Scale with Predictive AI'}
          {selectedPlan === 'enterprise' && 'Dominate with Dual AI'}
        </h2>
        <p className="mb-6 opacity-90">
          {AI_MODELS_BY_PLAN[selectedPlan].features.salesConversion} in revenue
        </p>
        <button className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
          Get {selectedPlan} Plan
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
