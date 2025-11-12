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
      {/* Layered cards behind for Shopify effect - dark theme */}
      <div 
        aria-hidden 
        className="absolute inset-x-6 -top-6 h-[86%] rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-pink-950/40 backdrop-blur-sm shadow-[0_8px_40px_rgba(167,139,250,0.15)] -z-10" 
      />
      <div 
        aria-hidden 
        className="absolute inset-x-10 -top-3 h-[90%] rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-950/30 to-pink-950/30 backdrop-blur-sm shadow-[0_8px_40px_rgba(244,114,182,0.12)] -z-10" 
      />
      
      {/* Main card */}
      <div className="relative rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white shadow-2xl ring-1 ring-violet-500/20 p-5 sm:p-6 md:p-8">
        {/* Header */}
        <header className="mb-5 md:mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl md:text-2xl font-semibold text-white">
              Growth Setup
            </h2>
            <span 
              className="text-sm font-medium text-neutral-400"
              aria-label={`${progress} percent complete`}
            >
              {progress}% complete
            </span>
          </div>

          {/* Progress Bar */}
          <div 
            className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Setup progress"
          >
            <div
              className="bg-gradient-to-r from-violet-500 to-pink-500 h-1.5 rounded-full transition-all duration-500 ease-out shadow-lg shadow-violet-500/50"
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
                className="h-20 rounded-xl bg-neutral-800/50 animate-pulse"
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
