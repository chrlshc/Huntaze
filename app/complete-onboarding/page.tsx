'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="max-w-md mx-auto elevated-card p-6 text-center">
        <h1 className="text-2xl font-bold mb-6">Skip Onboarding (Dev Only)</h1>
        
        <button
          onClick={completeOnboarding}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Complete Onboarding & Go to Dashboard
        </button>
        
        {status && (
          <p className="mt-4 text-sm text-gray-600">{status}</p>
        )}
      </div>
    </div>
  );
}
