'use client';

import { useState, useEffect } from 'react';
import ProgressTracker from './ProgressTracker';
import StepNavigation from './StepNavigation';
import { CreatorAssessment } from './CreatorAssessment';
import { GoalSelection } from './GoalSelection';
import { PlatformConnection } from './PlatformConnection';
import { AIConfiguration } from './AIConfiguration';
import { AdditionalPlatforms } from './AdditionalPlatforms';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface OnboardingWizardProps {
  userId: string;
  onComplete?: () => void;
}

export function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Ordered list of steps for progress UI
  const orderedSteps = [
    'welcome',
    'creator_assessment',
    'goal_selection',
    'first_platform',
    'ai_configuration',
    'additional_platforms',
    'completion',
  ] as const;

  const stepTitles: Record<string, string> = {
    welcome: 'Welcome',
    creator_assessment: 'Assessment',
    goal_selection: 'Goals',
    first_platform: 'Connect Platform',
    ai_configuration: 'Configure AI',
    additional_platforms: 'More Platforms',
    completion: 'Complete',
  };

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

      const result = await response.json().catch(() => ({} as any));

      // Always update local progress even if backend returns non-success in staging/demo
      const updatedCompleted = completedSteps.includes(stepId)
        ? completedSteps
        : [...completedSteps, stepId];
      setCompletedSteps(updatedCompleted);
      setProgress(typeof result?.data?.progress === 'number' ? result.data.progress : Math.min(100, progress + 15));

      const idx = orderedSteps.indexOf(stepId as any);
      const nextId = result?.data?.nextStep?.id || orderedSteps[Math.min(idx + 1, orderedSteps.length - 1)];

      if (nextId && nextId !== stepId) {
        setCurrentStep(nextId);
      } else if (nextId === 'completion' || idx >= orderedSteps.length - 1) {
        onComplete?.();
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      // Fallback: advance locally to avoid user being blocked
      const idx = orderedSteps.indexOf(stepId as any);
      const nextId = orderedSteps[Math.min(idx + 1, orderedSteps.length - 1)];
      if (nextId && nextId !== stepId) setCurrentStep(nextId);
      if (nextId === 'completion' || idx >= orderedSteps.length - 1) onComplete?.();
    }
  };

  const handleStepSkip = async (stepId: string) => {
    try {
      const response = await fetch(`/api/onboarding/step/${stepId}/skip`, {
        method: 'POST'
      });

      const result = await response.json().catch(() => ({} as any));
      const idx = orderedSteps.indexOf(stepId as any);
      const nextId = result?.data?.nextStep?.id || orderedSteps[Math.min(idx + 1, orderedSteps.length - 1)];
      if (nextId) setCurrentStep(nextId);
      if (typeof result?.data?.progress === 'number') setProgress(result.data.progress);
    } catch (error) {
      console.error('Failed to skip step:', error);
      const idx = orderedSteps.indexOf(stepId as any);
      const nextId = orderedSteps[Math.min(idx + 1, orderedSteps.length - 1)];
      if (nextId) setCurrentStep(nextId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentStepIndex = Math.max(0, orderedSteps.indexOf(currentStep as any));
  const stepsForTracker = orderedSteps.map((id, idx) => ({
    id,
    title: stepTitles[id] || id,
    completed: completedSteps.includes(id) || idx < currentStepIndex,
  }));

  const handleBack = () => {
    const prevIndex = Math.max(0, currentStepIndex - 1);
    setCurrentStep(orderedSteps[prevIndex]);
  };

  const handleNext = () => {
    // Default next completes current step to keep server state in sync when possible
    handleStepComplete(currentStep);
  };

  const handleSkip = () => {
    if (currentStep === 'additional_platforms') {
      handleStepSkip('additional_platforms');
    } else {
      handleNext();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <ProgressTracker
          steps={stepsForTracker}
          currentStepIndex={currentStepIndex}
          progressPercentage={progress || 0}
          estimatedTimeRemaining={0}
        />

        <Card className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          {currentStep === 'welcome' && (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Huntaze! 🎉
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Let's get you set up in just a few minutes
              </p>
              <Button 
                variant="primary" 
                onClick={() => handleStepComplete('welcome')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Get Started
              </Button>
              <div className="mt-4">
                <Button 
                  variant="primary" 
                  onClick={async () => {
                    try {
                      await fetch('/api/force-complete-onboarding');
                    } catch {}
                    onComplete?.();
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Skip onboarding for now
                </Button>
              </div>
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
              <Button 
                variant="primary" 
                onClick={() => {
                  handleStepComplete('completion');
                  onComplete?.();
                }}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Start Creating Content
              </Button>
            </div>
          )}
        </Card>

        <StepNavigation
          canGoBack={currentStepIndex > 0}
          canGoNext={currentStepIndex < orderedSteps.length - 1}
          canSkip={currentStep === 'additional_platforms'}
          isLastStep={currentStepIndex >= orderedSteps.length - 1}
          onBack={handleBack}
          onNext={handleNext}
          onSkip={handleSkip}
          nextLabel={currentStepIndex >= orderedSteps.length - 2 ? 'Complete' : 'Continue'}
        />
      </div>
    </div>
  );
}
