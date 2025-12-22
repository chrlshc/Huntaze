import React from 'react';
import { cn } from '@/lib/utils';
import './SegmentCard.css';

export interface SegmentCardProps {
  /** Segment label (e.g., "ALL FANS", "VIP", "AT-RISK") */
  label: string;
  /** Total count for this segment */
  count: number;
  /** Optional percentage (shown for non-ALL segments) */
  percentage?: number;
  /** Whether this segment is currently active/selected */
  isActive?: boolean;
  /** Click handler for segment selection */
  onClick: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * SegmentCard Component
 * 
 * Displays a fan segment with count and optional percentage.
 * Used on the Fans page for segment filtering.
 * 
 * Design Specification:
 * - Label: 11px uppercase, letter-spacing 0.05em
 * - Count: 24px, 600 weight
 * - Percentage: 12px, secondary color
 * - Active state: violet border (2px), subtle background
 * - Hover: translateY(-1px), shadow
 * - Focus: visible focus indicator
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1
 */
export const SegmentCard = React.memo(function SegmentCard({
  label,
  count,
  percentage,
  isActive = false,
  onClick,
  className,
}: SegmentCardProps) {
  return (
    <button
      className={cn(
        'segment-card',
        isActive && 'segment-card--active',
        className
      )}
      onClick={onClick}
      aria-pressed={isActive}
      data-testid="segment-card"
      data-segment={label}
      data-active={isActive}
      type="button"
    >
      <span 
        className="segment-card__label" 
        data-testid="segment-card-label"
      >
        {label}
      </span>
      
      <div className="segment-card__stats" data-testid="segment-card-stats">
        <span 
          className="segment-card__count" 
          data-testid="segment-card-count"
        >
          {count}
        </span>
        
        {percentage !== undefined && (
          <span 
            className="segment-card__percentage" 
            data-testid="segment-card-percentage"
          >
            ({percentage}%)
          </span>
        )}
      </div>
    </button>
  );
});
