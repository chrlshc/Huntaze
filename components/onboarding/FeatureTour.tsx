'use client';

import { useMemo, useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface FeatureTourProps {
  featureId: string;
  featureName: string;
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

export default function FeatureTour({
  featureId,
  featureName,
  steps,
  isOpen,
  onComplete,
  onDismiss
}: FeatureTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const tooltipPosition = useMemo(() => {
    if (!isOpen || !currentStep?.targetElement || typeof document === 'undefined') {
      return { top: 0, left: 0 };
    }

    const element = document.querySelector(currentStep.targetElement);
    if (!element) return { top: 0, left: 0 };

    const rect = element.getBoundingClientRect();
    const position = currentStep.position || 'bottom';

    switch (position) {
      case 'top':
        return { top: rect.top - 20, left: rect.left + rect.width / 2 };
      case 'bottom':
        return { top: rect.bottom + 20, left: rect.left + rect.width / 2 };
      case 'left':
        return { top: rect.top + rect.height / 2, left: rect.left - 20 };
      case 'right':
        return { top: rect.top + rect.height / 2, left: rect.right + 20 };
      default:
        return { top: rect.bottom + 20, left: rect.left + rect.width / 2 };
    }
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (isOpen && currentStep?.targetElement) {
      const element = document.querySelector(currentStep.targetElement);
      if (element) {
        // Highlight the target element
        element.classList.add('tour-highlight');
        
        return () => {
          element.classList.remove('tour-highlight');
        };
      }
    }
  }, [currentStepIndex, currentStep, isOpen]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onDismiss();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-2xl max-w-sm transform -translate-x-1/2 -translate-y-1/2"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`
        }}
      >
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">
                {currentStep.title}
              </h3>
              <p className="text-xs text-gray-500">
                {featureName} Tour • Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
            <Button variant="primary" onClick={handleSkip} aria-label="Close tour">
  <X className="w-5 h-5" />
</Button>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-700">
            {currentStep.description}
          </p>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStepIndex
                    ? 'w-8 bg-blue-600'
                    : index < currentStepIndex
                    ? 'w-2 bg-green-600'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button variant="primary" onClick={handleSkip}>
  Skip Tour
</Button>
            
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button variant="ghost" onClick={handleBack} aria-label="Previous step">
  <ArrowLeft className="w-4 h-4" />
</Button>
              )}
              
              <Button variant="primary" onClick={handleNext}>
  {isLastStep ? (
                  <>
                    <Check className="w-4 h-4" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
</Button>
            </div>
          </div>
        </div>

        {/* Arrow Pointer */}
        <div
          className={`absolute w-4 h-4 bg-white transform rotate-45 ${
            currentStep.position === 'top' ? 'bottom-0 translate-y-1/2' :
            currentStep.position === 'bottom' ? 'top-0 -translate-y-1/2' :
            currentStep.position === 'left' ? 'right-0 translate-x-1/2' :
            'left-0 -translate-x-1/2'
          }`}
          style={{
            left: currentStep.position === 'top' || currentStep.position === 'bottom' ? '50%' : undefined,
            top: currentStep.position === 'left' || currentStep.position === 'right' ? '50%' : undefined,
            transform: currentStep.position === 'top' || currentStep.position === 'bottom' 
              ? 'translateX(-50%) rotate(45deg)' 
              : 'translateY(-50%) rotate(45deg)'
          }}
        />
      </div>

      {/* Global Styles for Highlight */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}
