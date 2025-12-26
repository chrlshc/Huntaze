'use client';
/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { completeOnboarding } from '@/lib/services/onboarding';

export default function CompleteOnboarding() {
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

  const [status, setStatus] = useState('');
  const router = useRouter();
  
  const completeOnboarding = async () => {
    try {
      setStatus('Completing onboarding...');
      
      await completeOnboarding();

      setStatus('Onboarding completed! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to complete onboarding');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 flex items-center justify-center">
      <Card className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-6">Skip Onboarding (Dev Only)</h1>
        
        <Button variant="primary" onClick={completeOnboarding}>
          Complete Onboarding & Go to Dashboard
        </Button>
        
        {status && (
          <p className="mt-4 text-sm text-gray-600">{status}</p>
        )}
      </Card>
    </div>
  );
}
