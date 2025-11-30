'use client';

/**
 * Simplified Onboarding Wizard - 3 Steps
 * 
 * Requirements:
 * - 6.2: Maximum 3 steps onboarding
 * - 6.3: Progress indicator
 * - 6.4: Skip option for each step
 * - 6.5: Onboarding checklist for skipped steps
 */

import { useState } from 'react';
import { Check, ChevronRight, X } from 'lucide-react';
import { DashboardPreview } from './DashboardPreview';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
  skippable: boolean;
}

interface SimplifiedOnboardingWizardProps {
  onComplete: () => void;
  onSkip?: (stepId: number) => void;
}

export function SimplifiedOnboardingWizard({ 
  onComplete,
  onSkip 
}: SimplifiedOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Connect Your Platform',
      description: 'Link your OnlyFans or other creator platform to get started',
      component: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Connect Your First Platform
            </h3>
            <p className="text-gray-600 mb-6">
              Connect OnlyFans, Instagram, TikTok, or any other platform to start tracking your analytics
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <Button variant="outline">
  <div className="text-2xl mb-2">🔥</div>
              <div className="font-medium">OnlyFans</div>
</Button>
            <Button variant="outline">
  <div className="text-2xl mb-2">📸</div>
              <div className="font-medium">Instagram</div>
</Button>
            <Button variant="outline">
  <div className="text-2xl mb-2">🎵</div>
              <div className="font-medium">TikTok</div>
</Button>
            <Button variant="outline">
  <div className="text-2xl mb-2">▶️</div>
              <div className="font-medium">YouTube</div>
</Button>
          </div>
        </div>
      ),
      skippable: true,
    },
    {
      id: 2,
      title: 'Preview Your Dashboard',
      description: 'See what your analytics will look like',
      component: <DashboardPreview />,
      skippable: false,
    },
    {
      id: 3,
      title: 'Explore Features',
      description: 'Quick tour of what Huntaze can do for you',
      component: (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              What You Can Do With Huntaze
            </h3>
            <p className="text-gray-600">
              Here are the key features to help you grow your creator business
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                icon: '📊',
                title: 'Real-Time Analytics',
                description: 'Track your performance across all platforms in one place',
              },
              {
                icon: '💬',
                title: 'Smart Messaging',
                description: 'AI-powered message suggestions to engage with fans faster',
              },
              {
                icon: '💰',
                title: 'Revenue Tracking',
                description: 'Monitor your earnings and identify growth opportunities',
              },
              {
                icon: '🎯',
                title: 'Content Planning',
                description: 'Plan and schedule your content for maximum impact',
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-all"
              >
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      skippable: true,
    },
  ];

  const handleNext = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(steps[currentStep].id);
    setCompletedSteps(newCompleted);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    const newSkipped = new Set(skippedSteps);
    newSkipped.add(steps[currentStep].id);
    setSkippedSteps(newSkipped);
    onSkip?.(steps[currentStep].id);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${index < currentStep 
                  ? 'bg-purple-600 border-purple-600 text-white' 
                  : index === currentStep
                    ? 'border-purple-600 text-purple-600 bg-white'
                    : 'border-gray-300 text-gray-400 bg-white'
                }
              `}>
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          <div className="mb-8">
            {currentStepData.component}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            {currentStepData.skippable ? (
              <Button variant="primary" onClick={handleSkip}>
                <X className="w-4 h-4" />
                Skip for now
              </Button>
            ) : (
              <div />
            )}

            <Button variant="primary" onClick={handleNext}>
              {currentStep < steps.length - 1 ? 'Continue' : 'Get Started'}
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          You can always complete skipped steps later from your dashboard
        </div>
      </div>
    </div>
  );
}
