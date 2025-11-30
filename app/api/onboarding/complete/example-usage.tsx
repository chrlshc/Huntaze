/**
 * Onboarding Complete API - Example Usage
 * 
 * Demonstrates how to use the onboarding completion API in various scenarios.
 * 
 * Requirements: 5.4, 5.6, 5.9
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingComplete } from '@/hooks/useOnboardingComplete';
import type { ContentType, CreatorGoal } from '@/app/api/onboarding/complete/types';
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/export-all";

// ============================================================================
// Example 1: Basic Form with Hook
// ============================================================================

export function BasicOnboardingForm() {
  const router = useRouter();
  const { completeOnboarding, loading, error } = useOnboardingComplete();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [goal, setGoal] = useState<CreatorGoal>('increase-revenue');
  const [revenueGoal, setRevenueGoal] = useState<number>(5000);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await completeOnboarding({
      contentTypes,
      goal,
      revenueGoal,
    });

    if (result.success) {
      console.log('Onboarding completed:', result.data.user);
      router.push('/home');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="onboarding-form">
      <h2>Complete Your Profile</h2>

      {/* Content Types */}
      <fieldset>
        <legend>What content do you create?</legend>
        {(['photos', 'videos', 'stories', 'ppv'] as ContentType[]).map((type) => (
          <label key={type}>
            <input
              type="checkbox"
              checked={contentTypes.includes(type)}
              onChange={(e) => {
                if (e.target.checked) {
                  setContentTypes([...contentTypes, type]);
                } else {
                  setContentTypes(contentTypes.filter((t) => t !== type));
                }
              }}
            />
            {type}
          </label>
        ))}
      </fieldset>

      {/* Goal */}
      <fieldset>
        <legend>What's your primary goal?</legend>
        <Select value={goal} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGoal(e.target.value as CreatorGoal)}>
          <option value="grow-audience">Grow Audience</option>
          <option value="increase-revenue">Increase Revenue</option>
          <option value="save-time">Save Time</option>
          <option value="all">All of the Above</option>
        </Select>
      </fieldset>

      {/* Revenue Goal */}
      <fieldset>
        <legend>Monthly Revenue Goal</legend>
        <input
          type="number"
          value={revenueGoal}
          onChange={(e) => setRevenueGoal(parseInt(e.target.value))}
          min={0}
          max={1000000}
        />
      </fieldset>

      {/* Error Display */}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button type="submit" disabled={loading}>
        {loading ? 'Completing...' : 'Complete Onboarding'}
      </button>
    </form>
  );
}

// ============================================================================
// Example 2: Multi-Step Form with Platform Credentials
// ============================================================================

export function MultiStepOnboardingForm() {
  const router = useRouter();
  const { completeOnboarding, loading, error } = useOnboardingComplete();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    contentTypes: [] as ContentType[],
    goal: 'increase-revenue' as CreatorGoal,
    revenueGoal: 5000,
    platform: {
      username: '',
      password: '',
    },
  });

  async function handleComplete() {
    const result = await completeOnboarding(formData);

    if (result.success) {
      router.push('/home');
    }
  }

  return (
    <div className="multi-step-form">
      {/* Step 1: Content Types */}
      {step === 1 && (
        <div>
          <h2>Step 1: Content Types</h2>
          {/* Content type selection */}
          <button onClick={() => setStep(2)}>Next</button>
        </div>
      )}

      {/* Step 2: Goals */}
      {step === 2 && (
        <div>
          <h2>Step 2: Your Goals</h2>
          {/* Goal selection */}
          <button onClick={() => setStep(1)}>Back</button>
          <button onClick={() => setStep(3)}>Next</button>
        </div>
      )}

      {/* Step 3: Platform (Optional) */}
      {step === 3 && (
        <div>
          <h2>Step 3: Connect OnlyFans (Optional)</h2>
          <input
            type="text"
            placeholder="Username"
            value={formData.platform.username}
            onChange={(e) =>
              setFormData({
                ...formData,
                platform: { ...formData.platform, username: e.target.value },
              })
            }
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.platform.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                platform: { ...formData.platform, password: e.target.value },
              })
            }
          />
          {error && <div className="error">{error}</div>}
          <button onClick={() => setStep(2)}>Back</button>
          <button onClick={handleComplete} disabled={loading}>
            {loading ? 'Completing...' : 'Complete'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Direct API Call (No Hook)
// ============================================================================

export function DirectAPIExample() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleComplete() {
    setLoading(true);

    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf/token');
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.data.token;

      // Complete onboarding
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          contentTypes: ['photos', 'videos'],
          goal: 'increase-revenue',
          revenueGoal: 5000,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        console.log('Success:', data);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleComplete} disabled={loading}>
        {loading ? 'Loading...' : 'Complete Onboarding'}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

// ============================================================================
// Example 4: With Type-Safe Client
// ============================================================================

export function TypeSafeClientExample() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setLoading(true);
    setError(null);

    // Import client
    const { completeOnboarding } = await import('@/app/api/onboarding/complete/client');
    const { useCsrfToken } = await import('@/hooks/useCsrfToken');

    // Get CSRF token (in real app, use hook)
    const csrfResponse = await fetch('/api/csrf/token');
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.data.token;

    // Complete onboarding with type safety
    const result = await completeOnboarding(
      {
        contentTypes: ['photos', 'videos'],
        goal: 'increase-revenue',
        revenueGoal: 5000,
      },
      csrfToken
    );

    if (result.success) {
      console.log('User:', result.data.user);
      console.log('Duration:', result.data.duration, 'ms');
      router.push('/home');
    } else {
      setError(result.error.error);
      console.error('Error:', result.error);

      // Check if retryable
      if (result.error.retryable) {
        console.log('Error is retryable, will retry automatically');
      }
    }

    setLoading(false);
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleComplete} disabled={loading}>
        Complete Onboarding
      </button>
    </div>
  );
}

// ============================================================================
// Example 5: With Error Handling and Retry
// ============================================================================

export function ErrorHandlingExample() {
  const { completeOnboarding, loading, error, reset } = useOnboardingComplete();
  const [retryCount, setRetryCount] = useState(0);

  async function handleSubmit() {
    const result = await completeOnboarding({
      contentTypes: ['photos'],
      goal: 'grow-audience',
    });

    if (!result.success) {
      // Check if retryable
      if (result.error.retryable && retryCount < 3) {
        console.log('Retrying...', retryCount + 1);
        setRetryCount(retryCount + 1);
        
        // Wait and retry
        setTimeout(() => handleSubmit(), 2000);
      } else {
        console.error('Max retries reached or non-retryable error');
      }
    } else {
      setRetryCount(0);
      console.log('Success!');
    }
  }

  return (
    <div>
      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={reset}>Dismiss</button>
        </div>
      )}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? `Completing... (Attempt ${retryCount + 1})` : 'Complete'}
      </button>
    </div>
  );
}

// ============================================================================
// Example 6: Server-Side Validation
// ============================================================================

export function ServerSideValidationExample() {
  const { completeOnboarding, loading, error } = useOnboardingComplete();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  async function handleSubmit(data: any) {
    // Client-side validation
    const errors: Record<string, string> = {};

    if (!data.contentTypes || data.contentTypes.length === 0) {
      errors.contentTypes = 'Please select at least one content type';
    }

    if (data.revenueGoal && (data.revenueGoal < 0 || data.revenueGoal > 1000000)) {
      errors.revenueGoal = 'Revenue goal must be between 0 and 1,000,000';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Submit to API
    const result = await completeOnboarding(data);

    if (!result.success) {
      // Handle server-side validation errors
      if (result.error.statusCode === 400) {
        setValidationErrors({ server: result.error.error });
      }
    }
  }

  return (
    <div>
      {Object.entries(validationErrors).map(([field, message]) => (
        <div key={field} className="error">
          {field}: {message}
        </div>
      ))}
      {error && <div className="error">{error}</div>}
      <button onClick={() => handleSubmit({ contentTypes: ['photos'] })} disabled={loading}>
        Submit
      </button>
    </div>
  );
}
