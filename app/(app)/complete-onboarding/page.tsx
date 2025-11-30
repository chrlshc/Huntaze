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

export default function CompleteOnboarding() {
  const [status, setStatus] = useState('');
  const router = useRouter();
  
  const completeOnboarding = async () => {
    try {
      setStatus('Completing onboarding...');
      
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
      });
      
      if (response.ok) {
        setStatus('Onboarding completed! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setStatus('Failed to complete onboarding');
      }
    } catch (error) {
      setStatus('Error: ' + error);
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
