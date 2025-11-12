'use client';

/**
 * ProgressIndicator Component
 * 
 * Enhanced progress visualization with milestones and animations.
 * Provides visual feedback and celebrates progress achievements.
 * 
 * Requirements: 5.1, 5.2, 5.4, 22.3
 */

import { useEffect, useState } from 'react';
import { CheckCircle, Target } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: number;
  totalSteps: number;
  completedSteps: number;
  showMilestones?: boolean;
  className?: string;
}

const MILESTONES = [
  { value: 25, label: 'Bon début!', icon: '🎯' },
  { value: 50, label: 'À mi-chemin!', icon: '🚀' },
  { value: 75, label: 'Presque fini!', icon: '⭐' },
  { value: 100, label: 'Terminé!', icon: '🎉' },
];

export default function ProgressIndicator({
  progress,
  totalSteps,
  completedSteps,
  showMilestones = true,
  className = '',
}: ProgressIndicatorProps) {
  const [previousProgress, setPreviousProgress] = useState(progress);
  const [showCelebration, setShowCelebration] = useState(false);

  // Detect milestone achievements
  useEffect(() => {
    if (progress > previousProgress && showMilestones) {
      const crossedMilestone = MILESTONES.find(
        (m) => previousProgress < m.value && progress >= m.value
      );

      if (crossedMilestone) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
    setPreviousProgress(progress);
  }, [progress, previousProgress, showMilestones]);

  const currentMilestone = MILESTONES.find((m) => progress >= m.value);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-content-secondary">
            {completedSteps} sur {totalSteps} étapes
          </span>
        </div>
        <span 
          className="font-semibold text-content-primary"
          aria-label={`${progress} pourcent complété`}
        >
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div 
          className="w-full bg-surface-muted rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression de la configuration"
        >
          {/* Animated Progress Fill */}
          <div
            className="h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ 
              width: `${progress}%`,
              background: progress === 100 
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
            }}
          >
            {/* Shimmer Effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>
        </div>

        {/* Milestone Markers */}
        {showMilestones && (
          <div className="absolute top-0 left-0 right-0 h-3 pointer-events-none">
            {MILESTONES.slice(0, -1).map((milestone) => (
              <div
                key={milestone.value}
                className="absolute top-0 bottom-0 w-0.5 bg-surface-raised"
                style={{ left: `${milestone.value}%` }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </div>

      {/* Milestone Celebration */}
      {showCelebration && currentMilestone && (
        <div 
          className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <span className="text-2xl" aria-hidden="true">
            {currentMilestone.icon}
          </span>
          <span className="text-sm font-medium text-primary">
            {currentMilestone.label}
          </span>
        </div>
      )}

      {/* Screen Reader Announcement */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Progression: {progress}%. {completedSteps} étapes complétées sur {totalSteps}.
        {totalSteps - completedSteps > 0 && ` ${totalSteps - completedSteps} étapes restantes.`}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
