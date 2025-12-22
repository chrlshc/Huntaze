'use client';
/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';


import { useRouter } from 'next/navigation';
import { useAsyncOperation, AsyncErrorDisplay } from '@/components/dashboard/AsyncOperationWrapper';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SkipOnboarding() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-6">
        <EmptyState
          variant="no-data"
          title="Not available"
          description="This developer utility is disabled in production."
        />
      </div>
    );
  }

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
      <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] p-8 max-w-md text-center">
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
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors disabled:opacity-50"
          >
            Skip Onboarding & Go to Dashboard
          </button>
        )}
      </Card>
    </div>
  );
}
