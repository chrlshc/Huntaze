'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import CompletionCelebration from '@/components/onboarding/CompletionCelebration';

export default function OnboardingSetupPage() {
  const [userId, setUserId] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Get current user
      const userResponse = await fetch('/api/users/profile');
      const userData = await userResponse.json();
      
      if (userData.success) {
        setUserId(userData.data.id);
        
        // Check onboarding status
        const statusResponse = await fetch('/api/onboarding/status');
        const statusData = await statusResponse.json();
        
        if (statusData.success) {
          const progress = statusData.data.progressPercentage;
          
          if (progress >= 100) {
            // Onboarding is complete
            setIsComplete(true);
            setCompletionData({
              completedSteps: statusData.data.completedSteps.length,
              unlockedFeatures: statusData.data.unlockedFeatures || 0,
              creatorLevel: statusData.data.creatorLevel || 'intermediate'
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      // Fetch final stats
      const statusResponse = await fetch('/api/onboarding/status');
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        setCompletionData({
          completedSteps: statusData.data.completedSteps.length,
          unlockedFeatures: statusData.data.unlockedFeatures || 0,
          creatorLevel: statusData.data.creatorLevel || 'intermediate'
        });
        setIsComplete(true);
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  if (isComplete && completionData) {
    return (
      <CompletionCelebration
        userId={userId}
        completedSteps={completionData.completedSteps}
        unlockedFeatures={completionData.unlockedFeatures}
        creatorLevel={completionData.creatorLevel}
      />
    );
  }

  return (
    <OnboardingWizard
      userId={userId}
      onComplete={handleOnboardingComplete}
    />
  );
}
