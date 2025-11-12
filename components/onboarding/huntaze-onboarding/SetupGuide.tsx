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
    <div className="rounded-2xl border border-border-default bg-surface-raised p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-content-primary">
          Setup Guide
        </h2>
        <span 
          className="text-sm text-content-secondary"
          aria-label={`${progress} percent complete`}
        >
          {progress}% complete
        </span>
      </div>

      {/* Progress Bar with Animation */}
      <div className="mb-4">
        <div 
          className="w-full bg-surface-muted rounded-full h-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Setup progress"
        >
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
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
        <div className="space-y-2" role="status" aria-live="polite">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-border-default bg-surface-muted animate-pulse"
              aria-label="Loading steps"
            />
          ))}
        </div>
      ) : (
        <ul className="space-y-2" role="list">
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
        <div className="text-center py-8">
          <p className="text-content-secondary text-sm">
            No setup steps available
          </p>
        </div>
      )}
    </div>
  );
}
