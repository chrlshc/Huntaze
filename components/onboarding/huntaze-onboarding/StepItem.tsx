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
import { CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepItemProps } from './types';

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
    <li className="flex flex-col sm:flex-row sm:items-start sm:justify-between px-5 py-4 hover:bg-gray-50 transition-colors gap-3">
      {/* Step Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-medium text-gray-900 text-sm">{step.title}</h3>
          
          {/* Done Icon */}
          {step.status === 'done' && (
            <CheckCircle 
              className="w-4 h-4 text-green-600 flex-shrink-0" 
              aria-label="Completed"
            />
          )}
          
          {/* Skipped Badge */}
          {step.status === 'skipped' && (
            <span 
              className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 whitespace-nowrap"
              role="status"
              aria-label="Skipped step"
            >
              Skipped
            </span>
          )}
        </div>
        
        {/* Description */}
        {step.description && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {step.description}
          </p>
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
          <p className="text-xs text-gray-500 mt-1">
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
              onClick={() => handleUpdate('skipped')}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="text-gray-700 hover:bg-gray-100 text-sm font-normal"
              aria-label={`Skip ${step.title} for now (you can return to it from the dashboard)`}
            >
              Skip for now
            </Button>
          )}

          {/* Complete Button */}
          <Button
            onClick={() => handleUpdate('done')}
            disabled={loading}
            variant="default"
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-normal px-4"
            aria-label={`Complete ${step.title}`}
          >
            {loading ? 'Loading...' : step.required ? 'Set up' : 'Do it'}
          </Button>
        </div>
      )}
    </li>
  );
}
