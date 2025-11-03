'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { FeatureTour, TourStep, featureTourService } from '@/lib/services/featureTourService';

interface FeatureTourGuideProps {
  tour: FeatureTour;
  userId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export default function FeatureTourGuide({ 
  tour, 
  userId, 
  onComplete, 
  onDismiss 
}: FeatureTourGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(true);

  const currentStep = tour.steps[currentStepIndex];
  const isLastStep = currentStepIndex === tour.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Calculate tooltip position based on target element
  const updateTooltipPosition = useCallback(() => {
    if (!currentStep) return;

    const targetElement = document.querySelector(currentStep.target);
    if (!targetElement) {
      console.warn(`Target element not found: ${currentStep.target}`);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 16;

    let top = 0;
    let left = 0;

    switch (currentStep.placement) {
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + offset;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(offset, Math.min(top, window.innerHeight - tooltipHeight - offset));
    left = Math.max(offset, Math.min(left, window.innerWidth - tooltipWidth - offset));

    setTooltipPosition({ top, left });

    // Highlight target element
    targetElement.classList.add('tour-highlight');
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentStep]);

  useEffect(() => {
    updateTooltipPosition();
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition);
      
      // Remove highlight from all elements
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
    };
  }, [updateTooltipPosition]);

  const handleNext = async () => {
    if (!currentStep) return;

    // Mark current step as completed
    await featureTourService.completeStep(userId, tour.id, currentStep.id);

    if (isLastStep) {
      await handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    await featureTourService.completeTour(userId, tour.id);
    setIsVisible(false);
    onComplete?.();
  };

  const handleDismiss = async () => {
    await featureTourService.dismissTour(userId, tour.id);
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible || !currentStep) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 tour-overlay" />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-80 tour-tooltip"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentStep.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Step {currentStepIndex + 1} of {tour.steps.length}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            {currentStep.content}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {tour.steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStepIndex
                  ? 'bg-blue-600'
                  : index < currentStepIndex
                  ? 'bg-blue-400'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4" />
                Finish
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip tour option */}
        <div className="mt-4 text-center">
          <button
            onClick={handleDismiss}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Skip tour
          </button>
        </div>
      </div>

      {/* Styles for highlighting */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 4px;
          transition: box-shadow 0.3s ease;
        }
      `}</style>
    </>
  );
}
