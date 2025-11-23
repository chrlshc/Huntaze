'use client';

import { useState, useOptimistic } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toggleOnboardingStep } from '@/app/actions/onboarding';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

interface Props {
  initialSteps: OnboardingStep[];
}

/**
 * OnboardingChecklist Component
 * 
 * Displays an interactive checklist for user onboarding with:
 * - Optimistic UI updates for instant feedback
 * - Collapsible interface with progress indicator
 * - Framer Motion animations
 * - Confetti celebration when all steps are completed
 * 
 * Requirements:
 * - Requirement 8.1: Collapsible onboarding checklist
 * - Requirement 8.2: Server action for progress persistence
 * - Requirement 8.3: Framer Motion animations
 * - Requirement 8.4: Confetti trigger at 100% completion
 * - Requirement 8.5: Compact progress indicator
 * - Requirement 8.6: Optimistic UI updates
 */
export function OnboardingChecklist({ initialSteps }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [optimisticSteps, updateOptimisticSteps] = useOptimistic(
    initialSteps,
    (state, stepId: string) => {
      return state.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      );
    }
  );

  const completedCount = optimisticSteps.filter(s => s.completed).length;
  const totalCount = optimisticSteps.length;
  const progress = (completedCount / totalCount) * 100;

  async function handleStepComplete(stepId: string) {
    // Check if this will complete all steps
    const willComplete = completedCount + 1 === totalCount;
    
    // Optimistic update
    updateOptimisticSteps(stepId);
    
    // Server sync (no userId needed - extracted from session)
    const result = await toggleOnboardingStep(stepId);
    
    if (!result.success) {
      // Revert optimistic update on error
      console.error('Failed to update:', result.error);
      return;
    }
    
    // Trigger confetti when all steps are complete
    if (willComplete) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5E6AD2', '#EDEDED', '#8A8F98'], // Brand colors
      });
    }
  }

  // Collapsed state - compact progress indicator
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 p-2 bg-surface rounded-lg cursor-pointer hover:bg-surface/80 transition-colors"
        onClick={() => setIsCollapsed(false)}
      >
        <span className="text-sm text-muted">
          Onboarding: {progress.toFixed(0)}%
        </span>
        <ChevronDown strokeWidth={1.5} size={16} className="text-muted" />
      </motion.div>
    );
  }

  // Expanded state - full checklist
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-lg p-4 border border-border"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Get Started</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-muted hover:text-foreground transition-colors"
          aria-label="Collapse onboarding checklist"
        >
          <ChevronUp strokeWidth={1.5} size={20} />
        </button>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        <AnimatePresence>
          {optimisticSteps
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-start gap-3 p-3 hover:bg-background rounded-lg transition-colors"
              >
                {/* Checkbox */}
                <button
                  onClick={() => !step.completed && handleStepComplete(step.id)}
                  disabled={step.completed}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    step.completed
                      ? "bg-primary border-primary"
                      : "border-border hover:border-primary"
                  )}
                  aria-label={step.completed ? `${step.title} completed` : `Complete ${step.title}`}
                >
                  {step.completed && (
                    <Check strokeWidth={1.5} size={14} className="text-white" />
                  )}
                </button>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.completed
                        ? "line-through text-muted"
                        : "text-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted mt-1">{step.description}</p>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full bg-primary"
          />
        </div>
        <p className="text-xs text-muted mt-2">
          {completedCount} of {totalCount} completed
        </p>
      </div>
    </motion.div>
  );
}
