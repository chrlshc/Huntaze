'use client';

import { useRouter } from 'next/navigation';
import { useAsyncOperation, AsyncErrorDisplay, AsyncLoadingSpinner } from '@/components/dashboard/AsyncOperationWrapper';
import { Loader2 } from 'lucide-react';

export default function SkipOnboarding() {
  const router = useRouter();
  const { isLoading, error, execute } = useAsyncOperation({
    timeout: 10000,
  });
  
  const skipOnboarding = async () => {
    const result = await execute(async () => {
      const response = await fetch('/api/force-complete-onboarding');
      
      if (!response.ok) {
        throw new Error('Failed to skip onboarding');
      }
      
      return response.json();
    });
    
    if (result) {
      // Success - redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
      <div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-[var(--color-text-main)]">Skip Onboarding</h1>
        
        <p className="text-[var(--color-text-sub)] mb-6">
          This will skip the onboarding process for development purposes.
        </p>
        
        {error && (
          <div className="mb-6">
            <AsyncErrorDisplay error={error} onRetry={skipOnboarding} />
          </div>
        )}
        
        {isLoading ? (
          <div className="py-4">
            <Loader2 className="w-8 h-8 text-[var(--color-indigo)] animate-spin mx-auto mb-2" />
            <p className="text-sm text-[var(--color-text-sub)]">Skipping onboarding...</p>
          </div>
        ) : (
          <button
            onClick={skipOnboarding}
            disabled={isLoading}
            className="px-6 py-3 bg-[var(--color-indigo)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip Onboarding & Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
