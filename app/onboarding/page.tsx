'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, CreditCard, Bot, Link2 } from 'lucide-react';
import { subscriptionApi, platformsApi, aiApi } from '@/src/lib/api';

const steps = [
  { id: 1, name: 'Choose Plan', icon: CreditCard },
  { id: 2, name: 'Connect Platform', icon: Link2 },
  { id: 3, name: 'Configure AI', icon: Bot },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Store token in localStorage
      localStorage.setItem('token', token);
    } else {
      // Redirect if no token
      router.push('/join');
    }
  }, [token, router]);

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
          animate={{ width: `${(currentStep / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Steps */}
          <div className="flex justify-between mb-12">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center ${
                    step.id < steps.length ? 'flex-1' : ''
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        step.id <= currentStep
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm whitespace-nowrap">
                      {step.name}
                    </span>
                  </div>
                  {step.id < steps.length && (
                    <div
                      className={`flex-1 h-0.5 mx-4 transition-colors ${
                        step.id < currentStep
                          ? 'bg-purple-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mt-20"
          >
            {currentStep === 1 && <ChoosePlanStep onNext={handleNextStep} />}
            {currentStep === 2 && <ConnectPlatformStep onNext={handleNextStep} />}
            {currentStep === 3 && <ConfigureAIStep onNext={handleNextStep} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Choose Plan
function ChoosePlanStep({ onNext }: { onNext: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: '€0',
      period: '3 days',
      features: ['100 AI messages/day', 'Basic analytics', 'Email support'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '€99',
      period: 'per month',
      features: ['Unlimited AI messages', 'Advanced analytics', 'Priority support', 'Custom AI training'],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      features: ['Everything in Pro', 'Multiple accounts', 'API access', 'Dedicated support'],
    },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-gray-500 ml-2">{plan.period}</span>
            </div>
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="text-center space-y-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={async () => {
            setError(null);
            if (selectedPlan === 'trial') {
              onNext();
              return;
            }

            const priceId =
              (selectedPlan === 'pro' && process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO) ||
              (selectedPlan === 'enterprise' && process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE) ||
              '';
            if (!priceId) {
              setError('Stripe price not configured. Continuing without payment.');
              onNext();
              return;
            }

            try {
              setLoading(true);
              const res: any = await subscriptionApi.createCheckout(priceId);
              if (res?.url) {
                window.location.href = res.url;
              } else {
                setError('Failed to create checkout session.');
                onNext();
              }
            } catch (e) {
              setError('Payment initiation failed, continuing.');
              onNext();
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Redirecting…' : 'Continue to Payment'}
        </button>
      </div>
    </div>
  );
}

// Step 2: Connect Platform
function ConnectPlatformStep({ onNext }: { onNext: () => void }) {
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setError('');
    setMessage('');
    try {
      setLoading(true);
      await platformsApi.connectOnlyFans({ username, apiKey });
      setMessage('OnlyFans connected!');
      setTimeout(onNext, 500);
    } catch (e) {
      setError('Failed to connect. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Connect Your Platform</h2>
      <div className="space-y-4">
        <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">OnlyFans</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Connect your OnlyFans account to start automating messages
          </p>
          <div className="grid gap-3 mb-4">
            <input
              className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <button onClick={handleConnect} disabled={loading} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            {loading ? 'Connecting…' : 'Connect OnlyFans'}
          </button>
        </div>
      </div>
      <div className="text-center mt-8">
        <button onClick={onNext} className="text-gray-500 hover:text-gray-700">Skip for now →</button>
      </div>
    </div>
  );
}

// Step 3: Configure AI
function ConfigureAIStep({ onNext }: { onNext: () => void }) {
  const [saving, setSaving] = useState(false);
  const [tone, setTone] = useState('friendly');
  const [responseStyle, setResponseStyle] = useState('friendly');
  const [notice, setNotice] = useState('');

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Configure Your AI Assistant</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">AI Personality (tone)</label>
          <select className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="friendly">Friendly & Engaging</option>
            <option value="playful">Flirty & Playful</option>
            <option value="professional">Professional & Direct</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Response Style</label>
          <select className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800" value={responseStyle} onChange={(e) => setResponseStyle(e.target.value)}>
            <option value="friendly">Friendly</option>
            <option value="short">Short</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
      </div>

      {notice && <p className="text-green-600 text-sm mt-4">{notice}</p>}

      <div className="text-center mt-8">
        <button
          onClick={async () => {
            setSaving(true);
            try {
              await aiApi.updateConfig({ personality: { tone }, responseStyle });
              setNotice('AI configuration saved');
              setTimeout(onNext, 400);
            } catch (e) {
              setNotice('Failed to save, continuing');
              onNext();
            } finally {
              setSaving(false);
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
}
