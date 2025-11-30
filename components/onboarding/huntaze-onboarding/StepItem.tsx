'use client';

/**
 * StepItem Component
 * 
 * Individual step item with action buttons and status display.
 * Handles role-based permissions and displays appropriate UI for each state.
 * 
 * Requirements: 2.1, 3.1, 14.2, 14.3
 */

import { useState } from 'react';
import { CheckCircle, Info, Zap, Clock } from 'lucide-react';
import { StepItemProps } from './types';
import { Button } from "@/components/ui/button";

export default function StepItem({
  step,
  onUpdate,
  onLearnMore,
  userRole,
}: StepItemProps) {
  const [loading, setLoading] = useState(false);
  const canModify = !step.roleRestricted || step.roleRestricted === userRole;

  const handleUpdate = async (status: 'done' | 'skipped') => {
    setLoading(true);
    try {
      await onUpdate(step.id, status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="rounded-xl border border-neutral-200 p-4 md:p-5 hover:border-neutral-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-neutral-900">{step.title}</p>
            
            {/* Done Icon */}
            {step.status === 'done' && (
              <CheckCircle 
                className="w-5 h-5 text-green-600 flex-shrink-0" 
                aria-label="Completed"
              />
            )}
            
            {/* Skipped Badge */}
            {step.status === 'skipped' && (
              <span 
                className="text-xs rounded-full bg-neutral-100 text-neutral-600 px-2 py-0.5 whitespace-nowrap"
                role="status"
                aria-label="Skipped step"
              >
                Skipped
              </span>
            )}
          </div>
          
          {/* Description */}
          {step.description && (
            <p className="text-sm text-neutral-600">
              {step.description}
            </p>
          )}

          {/* Value chips */}
          {(step.badge || step.impact || step.timeEstimate || step.required) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {step.required && (
                <span className="text-xs rounded-full bg-neutral-900 text-white px-2 py-0.5">
                  Required
                </span>
              )}
              {step.badge && (
                <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 inline-flex items-center gap-1">
                  <Zap className="w-3 h-3" aria-hidden="true" />
                  {step.badge}
                </span>
              )}
              {step.impact && (
                <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                  {step.impact} impact
                </span>
              )}
              {step.timeEstimate && (
                <span className="text-xs rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {step.timeEstimate}
                </span>
              )}
            </div>
          )}
          
          {/* Role Restriction Message */}
          {!canModify && (
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
              <Info className="w-4 h-4" aria-hidden="true" />
              Ask the owner
            </p>
          )}
          
          {/* Completion Info */}
          {step.status === 'done' && step.completedAt && (
            <p className="text-xs text-neutral-500 mt-1">
              Completed on {new Date(step.completedAt).toLocaleDateString('en-US')}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {canModify && step.status === 'todo' && (
          <div className="flex gap-2 flex-shrink-0">
            {/* Skip Button */}
            {!step.required && (
              <Button 
                variant="primary" 
                onClick={() => handleUpdate('skipped')} 
                disabled={loading}
                className="text-sm font-medium text-neutral-700 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-md px-1 disabled:opacity-50"
                aria-label={`Skip ${step.title} for now`}
              >
                Skip for now
              </Button>
            )}

            {/* Complete Button */}
            <button
              onClick={() => handleUpdate('done')}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-white shadow bg-neutral-900 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50 text-sm font-medium"
              aria-label={`Complete ${step.title}`}
            >
              {loading ? 'Loading...' : 'Do it'}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
