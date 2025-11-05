'use client';

import { useState, useEffect } from 'react';
import ProgressTracker from './ProgressTracker';
import StepNavigation from './StepNavigation';
import { CreatorAssessment } from './CreatorAssessment';
import { GoalSelection } from './GoalSelection';
import { PlatformConnection } from './PlatformConnection';
import { AIConfiguration } from './AIConfiguration';
import { AdditionalPlatforms } from './AdditionalPlatforms';

interface OnboardingWizardProps {
  userId: string;
  onComplete?: () => void;
}

export function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      const response = await fetch('/api/onboarding/status');
      const result = await response.json();
      
      if (result.success) {
        setCurrentStep(result.data.currentStep);
        setProgress(result.data.progress);
        setCompletedSteps(result.data.completedSteps);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepId: string, data?: any) => {
    try {
      const response = await fetch(`/api/onboarding/step/${stepId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      const result = await response.json();
      
      if (result.success) {
        setCompletedSteps([...completedSteps, stepId]);
        setProgress(result.data.progress);
        
        if (result.data.nextStep) {
          setCurrentStep(result.data.nextStep.id);
        } else {
          // Onboarding complete
          onComplete?.();
        }
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const handleStepSkip = async (stepId: string) => {
    try {
      const response = await fetch(`/api/onboarding/step/${stepId}/skip`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.success && result.data.nextStep) {
        setCurrentStep(result.data.nextStep.id);
        setProgress(result.data.progress);
      }
    } catch (error) {
      console.error('Failed to skip step:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <ProgressTracker 
          progress={progress}
          completedSteps={completedSteps}
        />

        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          {currentStep === 'welcome' && (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Huntaze! 🎉
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Let's get you set up in just a few minutes
              </p>
              <button
                onClick={() => handleStepComplete('welcome')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Get Started
              </button>
            </div>
          )}

          {currentStep === 'creator_assessment' && (
            <CreatorAssessment onComplete={(data) => handleStepComplete('creator_assessment', data)} />
          )}

          {currentStep === 'goal_selection' && (
            <GoalSelection onComplete={(data) => handleStepComplete('goal_selection', data)} />
          )}

          {currentStep === 'first_platform' && (
            <PlatformConnection 
              onComplete={() => handleStepComplete('first_platform')}
              isFirst={true}
            />
          )}

          {currentStep === 'ai_configuration' && (
            <AIConfiguration onComplete={(data) => handleStepComplete('ai_configuration', data)} />
          )}

          {currentStep === 'additional_platforms' && (
            <AdditionalPlatforms 
              onComplete={() => handleStepComplete('additional_platforms')}
              onSkip={() => handleStepSkip('additional_platforms')}
            />
          )}

          {currentStep === 'completion' && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎊</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                You're All Set!
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Your account is configured and ready to go
              </p>
              <button
                onClick={() => {
                  handleStepComplete('completion');
                  onComplete?.();
                }}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Start Creating Content
              </button>
            </div>
          )}
        </div>

        <StepNavigation 
          currentStep={currentStep}
          onBack={() => {/* Handle back navigation */}}
          canGoBack={completedSteps.length > 0}
        />
      </div>
    </div>
  );
}
