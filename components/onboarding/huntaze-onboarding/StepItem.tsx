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
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border-default p-3 hover:bg-surface-muted/50 transition-colors gap-3">
      {/* Step Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-content-primary">{step.title}</p>
          
          {/* Required Badge */}
          {step.required && (
            <span 
              className="text-xs rounded bg-danger/10 text-danger px-2 py-0.5 border border-danger/20 whitespace-nowrap"
              role="status"
              aria-label="Étape obligatoire"
            >
              Obligatoire
            </span>
          )}
          
          {/* Done Icon */}
          {step.status === 'done' && (
            <CheckCircle 
              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" 
              aria-label="Complété"
            />
          )}
          
          {/* Skipped Badge */}
          {step.status === 'skipped' && (
            <span 
              className="text-xs rounded bg-surface-muted text-content-secondary px-2 py-0.5 border border-border-default whitespace-nowrap"
              role="status"
              aria-label="Étape passée"
            >
              Passé
            </span>
          )}
        </div>
        
        {/* Description */}
        {step.description && (
          <p className="text-sm text-content-secondary mt-1">
            {step.description}
          </p>
        )}
        
        {/* Role Restriction Message */}
        {!canModify && (
          <p className="text-sm text-primary mt-1 flex items-center gap-1">
            <Info className="w-4 h-4" aria-hidden="true" />
            Demander à l'owner
          </p>
        )}
        
        {/* Completion Info */}
        {step.status === 'done' && step.completedAt && (
          <p className="text-xs text-content-secondary mt-1">
            Complété le {new Date(step.completedAt).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {canModify && (
        <div className="flex gap-2 flex-wrap sm:flex-nowrap sm:ml-4">
          {/* Complete Button */}
          {step.status !== 'done' && (
            <Button
              onClick={() => handleUpdate('done')}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary/10"
              aria-label={`Compléter ${step.title}`}
            >
              Faire
            </Button>
          )}

          {/* Skip Button */}
          {!step.required && step.status !== 'skipped' && (
            <Button
              onClick={() => handleUpdate('skipped')}
              disabled={loading}
              variant="outline"
              size="sm"
              aria-label={`Passer ${step.title} pour l'instant (vous pourrez y revenir depuis le tableau de bord)`}
            >
              Passer
            </Button>
          )}

          {/* Learn More Button */}
          <Button
            onClick={() => onLearnMore(step.id)}
            variant="ghost"
            size="sm"
            aria-label={`En savoir plus sur ${step.title}`}
          >
            En savoir plus
          </Button>
        </div>
      )}
    </li>
  );
}
