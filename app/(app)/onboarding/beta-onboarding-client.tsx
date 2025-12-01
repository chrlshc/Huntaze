'use client';

/**
 * Beta Launch Onboarding Client
 * 
 * 3-step onboarding flow for beta launch:
 * - Step 1: Content type selection
 * - Step 2: OnlyFans connection (optional)
 * - Step 3: Goal selection and revenue goal
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

interface OnboardingData {
  contentTypes: string[];
  platform?: {
    username: string;
    password: string;
  };
  goal?: string;
  revenueGoal?: number;
}

export default function BetaOnboardingClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    contentTypes: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate progress percentage (Requirement 5.2)
  const progress = (currentStep / 3) * 100;

  // Step 1: Content type selection
  const contentTypeOptions = [
    { id: 'photos', label: 'Photos', description: 'Share photo content' },
    { id: 'videos', label: 'Videos', description: 'Share video content' },
    { id: 'stories', label: 'Stories', description: 'Share story content' },
    { id: 'ppv', label: 'PPV Content', description: 'Pay-per-view content' }
  ];

  // Step 3: Goal options
  const goalOptions = [
    { id: 'grow-audience', label: 'Grow Audience', description: 'Increase followers and reach' },
    { id: 'increase-revenue', label: 'Increase Revenue', description: 'Maximize earnings' },
    { id: 'save-time', label: 'Save Time', description: 'Automate workflows' },
    { id: 'all', label: 'All of the Above', description: 'Complete solution' }
  ];

  const toggleContentType = (type: string) => {
    setData(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type]
    }));
  };

  const handleStep1Next = () => {
    // Requirement 5.4: Save selections and advance to step 2
    setCurrentStep(2);
  };

  const handleStep2Next = (username: string, password: string) => {
    // Requirement 5.6: Store credentials and advance to step 3
    setData(prev => ({
      ...prev,
      platform: { username, password }
    }));
    setCurrentStep(3);
  };

  const handleStep2Skip = () => {
    // Requirement 5.10: Skip without saving data
    setCurrentStep(3);
  };

  const handleBack = () => {
    // Requirement 5.11: Return to previous step with data preserved
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async (goal: string, revenueGoal?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Requirement 5.9: Save all onboarding data
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTypes: data.contentTypes,
          platform: data.platform,
          goal,
          revenueGoal
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Redirect to home page
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar (Requirements 5.2, 5.12) */}
        <div className="mb-8">
          <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Step ${currentStep} of 3`}
            />
          </div>
          <p className="mt-2 text-sm text-[var(--text-primary)] text-center">
            Step {currentStep} of 3
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Content Types (Requirement 5.3) */}
        {currentStep === 1 && (
          <div className="bg-[var(--bg-primary)] border border-[var(--bg-secondary)] rounded-xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              What type of content do you create?
            </h2>
            <p className="text-[var(--text-primary)] mb-6">
              Select all that apply
            </p>

            <div className="space-y-3 mb-8">
              {contentTypeOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleContentType(option.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    data.contentTypes.includes(option.id)
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                      : 'border-[var(--bg-secondary)] bg-[var(--bg-primary)] hover:border-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{option.label}</p>
                      <p className="text-sm text-[var(--text-primary)]">{option.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      data.contentTypes.includes(option.id)
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                        : 'border-[var(--bg-tertiary)]'
                    }`}>
                      {data.contentTypes.includes(option.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <Button 
                variant="primary" 
                onClick={() => router.push('/home')}
                className="text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                Skip for now
              </Button>
              <Button variant="primary" onClick={handleStep1Next}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: OnlyFans Connection (Requirement 5.5) */}
        {currentStep === 2 && (
          <OnboardingStep2
            onNext={handleStep2Next}
            onBack={handleBack}
            onSkip={handleStep2Skip}
          />
        )}

        {/* Step 3: Goals (Requirements 5.7, 5.8) */}
        {currentStep === 3 && (
          <OnboardingStep3
            goalOptions={goalOptions}
            onComplete={handleComplete}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

// Step 2 Component
function OnboardingStep2({
  onNext,
  onBack,
  onSkip
}: {
  onNext: (username: string, password: string) => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onNext(username, password);
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--bg-secondary)] rounded-xl p-8">
      <h2 className="text-2xl font-semibold text-white mb-2">
        Connect your OnlyFans account
      </h2>
      <p className="text-[var(--text-primary)] mb-6">
        We'll encrypt and securely store your credentials
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label htmlFor="of-username" className="block text-sm font-medium text-white mb-2">
            Username
          </label>
          <input
            type="text"
            id="of-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--bg-input)] border border-[var(--bg-secondary)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            placeholder="your-username"
          />
        </div>

        <div>
          <label htmlFor="of-password" className="block text-sm font-medium text-white mb-2">
            Password
          </label>
          <input
            type="password"
            id="of-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--bg-input)] border border-[var(--bg-secondary)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            placeholder="••••••••"
          />
        </div>
      </form>

      <div className="flex justify-between">
        <Button variant="primary" onClick={onBack}>
  ← Back
</Button>
        <div className="flex gap-3">
          <Button variant="primary" onClick={onSkip}>
  Skip for now
</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!username || !password}>
  Connect
</Button>
        </div>
      </div>
    </div>
  );
}

// Step 3 Component
function OnboardingStep3({
  goalOptions,
  onComplete,
  onBack,
  isLoading
}: {
  goalOptions: Array<{ id: string; label: string; description: string }>;
  onComplete: (goal: string, revenueGoal?: number) => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [revenueGoal, setRevenueGoal] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoal) {
      const revenue = revenueGoal ? parseInt(revenueGoal.replace(/,/g, ''), 10) : undefined;
      onComplete(selectedGoal, revenue);
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--bg-secondary)] rounded-xl p-8">
      <h2 className="text-2xl font-semibold text-white mb-2">
        What's your primary goal?
      </h2>
      <p className="text-[var(--text-primary)] mb-6">
        Help us personalize your experience
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        <div className="space-y-3">
          {goalOptions.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedGoal(option.id)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedGoal === option.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--bg-secondary)] bg-[var(--bg-primary)] hover:border-[var(--bg-tertiary)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{option.label}</p>
                  <p className="text-sm text-[var(--text-primary)]">{option.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedGoal === option.id
                    ? 'border-[var(--accent-primary)]'
                    : 'border-[var(--bg-tertiary)]'
                }`}>
                  {selectedGoal === option.id && (
                    <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)]" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="revenue-goal" className="block text-sm font-medium text-white mb-2">
            Monthly revenue goal (optional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">$</span>
            <input
              type="text"
              id="revenue-goal"
              value={revenueGoal}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setRevenueGoal(value ? parseInt(value, 10).toLocaleString() : '');
              }}
              className="w-full pl-8 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--bg-secondary)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              placeholder="5,000"
            />
          </div>
        </div>
      </form>

      <div className="flex justify-between">
        <Button variant="primary" onClick={onBack} disabled={isLoading}>
  ← Back
</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!selectedGoal || isLoading}>
  {isLoading ? 'Completing...' : 'Complete Setup'}
</Button>
      </div>
    </div>
  );
}
