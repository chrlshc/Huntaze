/**
 * FilterIndicator Component - Dashboard Global Polish
 * 
 * Displays a violet dot indicator on filter buttons when filters are active.
 * Used on the PPV Content page to show when filters differ from default.
 * 
 * Feature: dashboard-global-polish
 * Validates: Requirements 10.1, 10.5
 */

import React from 'react';
import './FilterIndicator.css';

export interface FilterIndicatorProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * FilterIndicator Component
 * 
 * A small violet dot (6px circle) that appears on filter buttons
 * to indicate that active filters are applied.
 * 
 * Design Specification:
 * - Size: 6px circle
 * - Color: var(--accent-primary) - violet
 * - Border: 1px solid var(--bg-primary) - creates separation from button
 * - Position: Absolute positioning (top-right of parent button)
 * - Visibility: Only shown when filters are active
 * 
 * Requirements: 10.1, 10.5
 * 
 * @example
 * ```tsx
 * <button className="filter-button">
 *   Filters
 *   {hasActiveFilters && <FilterIndicator />}
 * </button>
 * ```
 */
export const FilterIndicator = React.memo(function FilterIndicator({
  className = '',
}: FilterIndicatorProps) {
  return (
    <span
      className={`filter-indicator ${className}`}
      data-testid="filter-indicator"
      aria-label="Active filters applied"
      role="status"
    />
  );
});

export default FilterIndicator;
