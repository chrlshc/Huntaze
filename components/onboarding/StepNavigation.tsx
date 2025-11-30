'use client';

import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface StepNavigationProps {
  canGoBack: boolean;
  canGoNext: boolean;
  canSkip: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  nextLabel?: string;
}

export default function StepNavigation({
  canGoBack,
  canGoNext,
  canSkip,
  isLastStep,
  onBack,
  onNext,
  onSkip,
  nextLabel = 'Continue'
}: StepNavigationProps) {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canGoNext && !e.shiftKey) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Enter' && e.shiftKey && canGoBack) {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoNext, onBack, onNext]);

  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          canGoBack
            ? 'text-gray-700 hover:bg-gray-100'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        aria-label="Go back to previous step"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3">
        {/* Skip Button */}
        {canSkip && (
          <Button variant="ghost" onClick={onSkip} type="button" aria-label="Skip this optional step">
  <SkipForward className="w-4 h-4" />
            Skip
</Button>
        )}

        {/* Next/Complete Button */}
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
            canGoNext
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          aria-label={isLastStep ? 'Complete onboarding' : 'Continue to next step'}
        >
          {isLastStep ? 'Complete' : nextLabel}
          {!isLastStep && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
export { StepNavigation };