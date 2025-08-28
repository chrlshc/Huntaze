'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Loader2, CreditCard, Bot, User } from 'lucide-react';

type Step = 'profile' | 'ai-config' | 'payment' | 'complete';

export default function OnboardingSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Profile
    displayName: '',
    bio: '',
    timezone: '',
    
    // AI Config
    personality: '',
    responseStyle: 'flirty',
    monthlyPrice: '9.99',
    welcomeMessage: '',
    
    // Payment
    paymentMethod: '',
  });

  const steps = [
    { id: 'profile', title: 'Profile Setup', icon: User },
    { id: 'ai-config', title: 'AI Configuration', icon: Bot },
    { id: 'payment', title: 'Payment Method', icon: CreditCard },
  ];

  const handleNext = async () => {
    setLoading(true);
    
    // Save current step data
    if (currentStep === 'profile') {
      // TODO: Save profile data
      setCurrentStep('ai-config');
    } else if (currentStep === 'ai-config') {
      // Save AI configuration
      try {
        const response = await fetch('/api/ai/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personality: formData.personality,
            responseStyle: formData.responseStyle,
            pricing: {
              monthlyPrice: formData.monthlyPrice,
              welcomeMessage: formData.welcomeMessage,
            },
          }),
        });
        
        if (response.ok) {
          setCurrentStep('payment');
        }
      } catch (error) {
        console.error('Failed to save AI config:', error);
      }
    } else if (currentStep === 'payment') {
      // TODO: Set up Stripe payment method
      setCurrentStep('complete');
    }
    
    setLoading(false);
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Let's set up your profile
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This information will be shown to your fans
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Your creator name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell your fans about yourself..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select timezone</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'ai-config':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Configure your AI assistant
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Customize how your AI interacts with fans
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Personality
                </label>
                <textarea
                  rows={4}
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder="Example: Be flirty and playful, use emojis, create a girlfriend experience..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Style
                </label>
                <select
                  value={formData.responseStyle}
                  onChange={(e) => setFormData({ ...formData, responseStyle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                >
                  <option value="friendly">Friendly & Casual</option>
                  <option value="flirty">Flirty & Playful</option>
                  <option value="professional">Professional</option>
                  <option value="dominant">Dominant</option>
                  <option value="submissive">Submissive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Subscription Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Welcome Message
                </label>
                <textarea
                  rows={3}
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  placeholder="Hey babe! 💕 Welcome to my exclusive content..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add your payment method
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Start your free trial - cancel anytime
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                🎉 <strong>First month FREE</strong> if you earn less than $1.5k/mo
              </p>
            </div>

            <div className="space-y-4">
              {/* Stripe Elements placeholder */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Stripe payment form will be integrated here
                </p>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Your payment info is securely processed by Stripe. We never store your card details.
              </p>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You're all set!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your AI assistant is ready to start engaging with fans
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        {currentStep !== 'complete' && (
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isActive ? 'bg-purple-600' : isCompleted ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <step.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`w-24 h-1 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between mt-3">
              {steps.map(step => (
                <p key={step.id} className={`text-sm ${
                  step.id === currentStep ? 'text-purple-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          {renderStepContent()}
          
          {/* Navigation */}
          {currentStep !== 'complete' && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {currentStep === 'payment' ? 'Complete Setup' : 'Continue'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}