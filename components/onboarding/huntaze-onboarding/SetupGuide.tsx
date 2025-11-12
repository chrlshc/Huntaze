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
    <div className="relative">
      {/* Layered cards behind for Shopify effect */}
      <div 
        aria-hidden 
        className="absolute inset-x-6 -top-6 h-[86%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.45)] -z-10" 
      />
      <div 
        aria-hidden 
        className="absolute inset-x-10 -top-3 h-[90%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.35)] -z-10" 
      />
      
      {/* Main card */}
      <div className="relative rounded-2xl bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5 p-5 sm:p-6 md:p-8">
        {/* Header */}
        <header className="mb-5 md:mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl md:text-2xl font-semibold">
              Setup Guide
            </h2>
            <span 
              className="text-sm font-medium text-neutral-600"
              aria-label={`${progress} percent complete`}
            >
              {progress}% complete
            </span>
          </div>

          {/* Progress Bar */}
          <div 
            className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden"
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
        </header>

        {/* Step List */}
        {loading ? (
          <div className="space-y-3" role="status" aria-live="polite">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-neutral-100 animate-pulse"
                aria-label="Loading steps"
              />
            ))}
          </div>
        ) : (
          <ul className="space-y-3 md:space-y-4" role="list">
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
            <p className="text-neutral-500 text-sm">
              No setup steps available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
