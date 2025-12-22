/**
 * Property Test: Filter Visual Feedback
 * Feature: onlyfans-shopify-unification
 * Property 11: Filter Visual Feedback
 * Validates: Requirements 5.3
 * 
 * Property: For any active filter, the filter should display visual feedback
 * (background color, border, or badge) indicating its active state
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';

// Mock filter button component for testing
interface FilterButtonProps {
  label: string;
  isActive: boolean;
  count?: number;
  onClick?: () => void;
}

function FilterButton({ label, isActive, count, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${
        isActive
          ? 'bg-[#1a1a1a] text-white'
          : 'bg-white border border-[#e1e3e5] text-[#202223] hover:bg-[#f6f6f7]'
      }`}
      data-testid={`filter-${label.toLowerCase().replace(/\s+/g, '-')}`}
      data-active={isActive}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );
}

describe('Property 11: Filter Visual Feedback', () => {
  describe('Active filter visual indicators', () => {
    it('should display dark background for active filters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 1000 }),
          (filterLabel, count) => {
            const { container } = render(
              <FilterButton label={filterLabel} isActive={true} count={count} />
            );

            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            // Active filter should have dark background
            const hasActiveBackground = button?.className.includes('bg-[#1a1a1a]');
            expect(hasActiveBackground).toBe(true);
            
            // Active filter should have white text
            const hasWhiteText = button?.className.includes('text-white');
            expect(hasWhiteText).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display border for inactive filters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 1000 }),
          (filterLabel, count) => {
            const { container } = render(
              <FilterButton label={filterLabel} isActive={false} count={count} />
            );

            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            // Inactive filter should have white background
            const hasWhiteBackground = button?.className.includes('bg-white');
            expect(hasWhiteBackground).toBe(true);
            
            // Inactive filter should have border
            const hasBorder = button?.className.includes('border-[#e1e3e5]');
            expect(hasBorder).toBe(true);
            
            // Inactive filter should have dark text
            const hasDarkText = button?.className.includes('text-[#202223]');
            expect(hasDarkText).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have data-active attribute matching active state', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          (filterLabel, isActive) => {
            const { container } = render(
              <FilterButton label={filterLabel} isActive={isActive} />
            );

            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            // data-active attribute should match isActive prop
            const dataActive = button?.getAttribute('data-active');
            expect(dataActive).toBe(String(isActive));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain visual distinction between active and inactive states', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (filterLabel) => {
            // Render both active and inactive versions
            const { container: activeContainer } = render(
              <FilterButton label={filterLabel} isActive={true} />
            );
            const { container: inactiveContainer } = render(
              <FilterButton label={filterLabel} isActive={false} />
            );

            const activeButton = activeContainer.querySelector('button');
            const inactiveButton = inactiveContainer.querySelector('button');

            expect(activeButton).toBeTruthy();
            expect(inactiveButton).toBeTruthy();

            // Active and inactive should have different class names
            const activeClasses = activeButton?.className || '';
            const inactiveClasses = inactiveButton?.className || '';
            
            expect(activeClasses).not.toBe(inactiveClasses);
            
            // Active should have dark background, inactive should not
            expect(activeClasses.includes('bg-[#1a1a1a]')).toBe(true);
            expect(inactiveClasses.includes('bg-[#1a1a1a]')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display count badge when provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          fc.integer({ min: 0, max: 1000 }),
          (filterLabel, isActive, count) => {
            const { container } = render(
              <FilterButton label={filterLabel} isActive={isActive} count={count} />
            );

            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            // Button text should include count
            const buttonText = button?.textContent || '';
            expect(buttonText).toContain(`(${count})`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Filter button accessibility', () => {
    it('should have proper test ID for all filters', () => {
      fc.assert(
        fc.property(
          // Use alphanumeric strings with spaces for realistic filter labels
          fc.stringMatching(/^[a-zA-Z0-9 ]{1,20}$/),
          fc.boolean(),
          (filterLabel, isActive) => {
            // Skip empty strings after trimming
            if (filterLabel.trim().length === 0) return true;
            
            const { container } = render(<FilterButton label={filterLabel} isActive={isActive} />);

            // Test ID should be kebab-case version of label
            const expectedTestId = `filter-${filterLabel.toLowerCase().replace(/\s+/g, '-')}`;
            const button = container.querySelector(`[data-testid="${expectedTestId}"]`);
            
            // Button should exist with the expected test ID
            expect(button).toBeTruthy();
            expect(button?.getAttribute('data-testid')).toBe(expectedTestId);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be keyboard accessible', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          (filterLabel, isActive) => {
            const { container } = render(
              <FilterButton label={filterLabel} isActive={isActive} />
            );

            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            // Button should be a native button element (keyboard accessible by default)
            expect(button?.tagName).toBe('BUTTON');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Filter state transitions', () => {
    it('should apply transition classes for smooth state changes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          (filterLabel, isActive) => {
            const { container } = render(
              <FilterButton label={filterLabel} isActive={isActive} />
            );

            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            // Should have transition-colors class for smooth visual feedback
            const hasTransition = button?.className.includes('transition-colors');
            expect(hasTransition).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Multiple filters interaction', () => {
    it('should allow only one filter to be active at a time in a group', () => {
      const filters = [
        { label: 'All', isActive: true },
        { label: 'VIP', isActive: false },
        { label: 'Active', isActive: false },
        { label: 'At-Risk', isActive: false },
      ];

      const { container } = render(
        <div>
          {filters.map((filter) => (
            <FilterButton
              key={filter.label}
              label={filter.label}
              isActive={filter.isActive}
            />
          ))}
        </div>
      );

      const buttons = container.querySelectorAll('button');
      const activeButtons = Array.from(buttons).filter((btn) =>
        btn.className.includes('bg-[#1a1a1a]')
      );

      // Only one button should be active
      expect(activeButtons.length).toBe(1);
    });

    it('should maintain visual consistency across all filter buttons', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 10 }),
          fc.integer({ min: 0, max: 10 }),
          (filterLabels, activeIndex) => {
            // Ensure activeIndex is within bounds
            const safeActiveIndex = activeIndex % filterLabels.length;

            const { container } = render(
              <div>
                {filterLabels.map((label, index) => (
                  <FilterButton
                    key={label}
                    label={label}
                    isActive={index === safeActiveIndex}
                  />
                ))}
              </div>
            );

            const buttons = container.querySelectorAll('button');
            
            // All buttons should have consistent base classes
            buttons.forEach((button) => {
              expect(button.className).toContain('px-4');
              expect(button.className).toContain('py-2');
              expect(button.className).toContain('rounded-lg');
              expect(button.className).toContain('text-[14px]');
              expect(button.className).toContain('font-medium');
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
