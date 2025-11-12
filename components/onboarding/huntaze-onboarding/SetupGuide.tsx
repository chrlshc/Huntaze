'use client';

/**
 * SetupGuide Component
 * 
 * Main onboarding checklist component displaying progress and step list.
 * Implements responsive layout with mobile-first design and full accessibility.
 * 
 * Requirements: 1.3, 22.1, 22.3, 23.1
 */

import { SetupGuideProps } from './types';
import StepItem from './StepItem';

export default function SetupGuide({
  steps,
  progress,
  onStepUpdate,
  onLearnMore,
  userRole,
  loading = false,
}: SetupGuideProps) {
  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">
          Setup Guide
        </h2>
        <span 
          className="text-sm font-medium text-gray-600"
          aria-label={`${progress} percent complete`}
        >
          {progress}% complete
        </span>
      </div>

      {/* Progress Bar with Animation */}
      <div className="px-5 pt-4">
        <div 
          className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Setup progress"
        >
          <div
            className="bg-green-600 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${progress}%`,
              transform: `translateX(${progress === 0 ? '-100%' : '0'})`,
            }}
          />
        </div>
        
        {/* Screen Reader Announcement */}
        <div 
          className="sr-only" 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
        >
          {progress}% of setup complete. {steps.filter(s => s.status === 'todo').length} steps remaining.
        </div>
      </div>

      {/* Step List */}
      {loading ? (
        <div className="p-5 space-y-3" role="status" aria-live="polite">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-md bg-gray-100 animate-pulse"
              aria-label="Loading steps"
            />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200" role="list">
          {steps.map((step) => (
            <StepItem
              key={`${step.id}-${step.version}`}
              step={step}
              onUpdate={onStepUpdate}
              onLearnMore={onLearnMore}
              userRole={userRole}
            />
          ))}
        </ul>
      )}

      {/* Empty State */}
      {!loading && steps.length === 0 && (
        <div className="text-center py-8 px-5">
          <p className="text-gray-500 text-sm">
            No setup steps available
          </p>
        </div>
      )}
    </div>
  );
}
