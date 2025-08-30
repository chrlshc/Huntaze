'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SkipOnboarding() {
  const [status, setStatus] = useState('');
  const router = useRouter();
  
  const skipOnboarding = async () => {
    try {
      setStatus('Skipping onboarding...');
      
      const response = await fetch('/api/force-complete-onboarding');
      
      if (response.ok) {
        setStatus('Success! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1000);
      } else {
        setStatus('Failed to skip onboarding');
      }
    } catch (error) {
      setStatus('Error: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">Skip Onboarding</h1>
        
        <p className="text-gray-600 mb-6">
          This will skip the onboarding process for development purposes.
        </p>
        
        <button
          onClick={skipOnboarding}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          Skip Onboarding & Go to Dashboard
        </button>
        
        {status && (
          <p className="mt-4 text-sm text-gray-600">{status}</p>
        )}
      </div>
    </div>
  );
}