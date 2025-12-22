/**
 * FilterPill Component - Dashboard Global Polish
 * 
 * Displays an active filter with a label and remove button.
 * Used on the Fans page to show which segment filter is currently active.
 * 
 * Feature: dashboard-global-polish
 * Validates: Requirements 7.2, 7.3
 */

import React from 'react';
import { cn } from '@/lib/utils';
import './FilterPill.css';

export interface FilterPillProps {
  /** Filter label (e.g., "VIP", "At-Risk") */
  label: string;
  /** Callback when remove button is clicked */
  onRemove: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FilterPill Component
 * 
 * Displays an active filter indicator with "Filter: [name]" label
 * and a remove button with X icon.
 * 
 * Design Specification:
 * - Background: rgba(139, 92, 246, 0.1) - subtle violet tint
 * - Border: rgba(139, 92, 246, 0.3) - violet border
 * - Padding: 6px 12px
 * - Border radius: 8px
 * - Label: 12px, 500 weight
 * - Remove button: 14px icon, hover state
 * - Focus: visible focus indicator on remove button
 * 
 * Requirements: 7.2, 7.3
 * 
 * @example
 * ```tsx
 * <FilterPill 
 *   label="VIP" 
 *   onRemove={() => clearFilter()} 
 * />
 * ```
 */
export const FilterPill = React.memo(function FilterPill({
  label,
  onRemove,
  className,
}: FilterPillProps) {
  return (
    <div
      className={cn('filter-pill', className)}
      data-testid="filter-pill"
      data-filter={label}
    >
      <span 
        className="filter-pill__label"
        data-testid="filter-pill-label"
      >
        Filter: {label}
      </span>
      
      <button
        className="filter-pill__remove"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        data-testid="filter-pill-remove"
        type="button"
      >
        <XIcon className="filter-pill__icon" />
      </button>
    </div>
  );
});

/**
 * X Icon for remove button
 */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default FilterPill;
