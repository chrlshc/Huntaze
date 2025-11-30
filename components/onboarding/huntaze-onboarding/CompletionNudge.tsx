'use client';

/**
 * CompletionNudge Component
 * 
 * Dismissible banner encouraging users to complete remaining setup steps.
 * Supports snooze functionality with limits and auto-dismissal.
 * 
 * Requirements: 1.4, 15.1, 15.2, 15.3, 15.4, 16.1, 16.2, 16.3
 */

import { useState } from 'react';
import { X, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompletionNudgeProps {
  remainingSteps: number;
  progress: number;
  onSnooze: (days: number) => Promise<void>;
  onDismiss: () => void;
  snoozeCount: number;
  maxSnoozes: number;
  className?: string;
}

export default function CompletionNudge({
  remainingSteps,
  progress,
  onSnooze,
  onDismiss,
  snoozeCount,
  maxSnoozes,
  className = '',
}: CompletionNudgeProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  // Auto-hide if progress >= 80%
  if (!isVisible || progress >= 80 || remainingSteps === 0) {
    return null;
  }

  const handleSnooze = async () => {
    setLoading(true);
    try {
      await onSnooze(7);
      setIsVisible(false);
    } catch (error) {
      console.error('[CompletionNudge] Snooze failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  const canSnooze = snoozeCount < maxSnoozes;

  return (
    <div
      className={`bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4 animate-slide-in ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-content-primary">
            Unlock Autopilot ({remainingSteps})
          </p>
          <p className="text-sm text-content-secondary">
            Turn on the top revenue drivers and let Huntaze sell for you
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {canSnooze && (
          <Button
            onClick={handleSnooze}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10"
            aria-label="Snooze for 7 days"
          >
            <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
            Snooze 7 days
          </Button>
        )}
        
        {!canSnooze && snoozeCount >= maxSnoozes && (
          <span className="text-xs text-content-secondary px-2">
            Limite de reports atteinte
          </span>
        )}

        <Button variant="primary" onClick={handleDismiss} aria-label="Close" aria-hidden="true">
  <X className="w-5 h-5" aria-hidden="true" />
</Button>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
