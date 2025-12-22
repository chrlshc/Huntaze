/**
 * Feature: dashboard-global-polish, Property 11: Active Filter Visual Feedback
 * 
 * Property: For any active segment filter, the corresponding segment card should
 * have a violet border and a "Filter: [Segment]" pill should be displayed.
 * 
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { SegmentCard } from '@/components/fans/SegmentCard';
import { FilterPill } from '@/components/fans/FilterPill';

describe('Property 11: Active Filter Visual Feedback', () => {
  // Define segment types
  const segmentLabels = ['VIP', 'ACTIVE', 'AT-RISK', 'CHURNED'] as const;
  
  // Requirement 7.1: Active segment card should have violet border
  it('should apply violet border to active segment card', () => {
    const { container } = render(
      <SegmentCard
        label="VIP"
        count={2}
        percentage={40}
        isActive={true}
        onClick={() => {}}
      />
    );
    
    const card = container.querySelector('[data-testid="segment-card"]');
    expect(card?.classList.contains('segment-card--active')).toBe(true);
    expect(card?.getAttribute('aria-pressed')).toBe('true');
  });

  // Requirement 7.2: Filter pill should display "Filter: [Segment Name]" format
  it('should display filter pill with correct format', () => {
    const { getByTestId } = render(
      <FilterPill
        label="VIP"
        onRemove={() => {}}
      />
    );
    
    const label = getByTestId('filter-pill-label');
    expect(label.textContent).toBe('Filter: VIP');
  });

  // Requirement 7.3: Filter pill should have remove button
  it('should include remove button in filter pill', () => {
    const { getByTestId } = render(
      <FilterPill
        label="VIP"
        onRemove={() => {}}
      />
    );
    
    const removeButton = getByTestId('filter-pill-remove');
    expect(removeButton).toBeTruthy();
    expect(removeButton.getAttribute('aria-label')).toBe('Remove VIP filter');
  });

  // Property-based test: Active state should be reflected in data attributes
  it('reflects active state in data attributes for all segments', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 0, max: 1000 }),
        fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        fc.boolean(),
        (label, count, percentage, isActive) => {
          const { container } = render(
            <SegmentCard
              label={label}
              count={count}
              percentage={percentage}
              isActive={isActive}
              onClick={() => {}}
            />
          );
          
          const card = container.querySelector('[data-testid="segment-card"]');
          expect(card?.getAttribute('data-active')).toBe(String(isActive));
          expect(card?.getAttribute('aria-pressed')).toBe(String(isActive));
          
          if (isActive) {
            expect(card?.classList.contains('segment-card--active')).toBe(true);
          } else {
            expect(card?.classList.contains('segment-card--active')).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Filter pill label format should be consistent
  it('maintains consistent "Filter: [name]" format for all segments', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        (label) => {
          const { container } = render(
            <FilterPill
              label={label}
              onRemove={() => {}}
            />
          );
          
          const labelElement = container.querySelector('[data-testid="filter-pill-label"]');
          expect(labelElement?.textContent).toBe(`Filter: ${label}`);
          
          // Should start with "Filter: "
          const text = labelElement?.textContent || '';
          expect(text.startsWith('Filter: ')).toBe(true);
          
          // Should contain the segment name
          expect(text).toContain(label);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Remove button should have proper accessibility attributes
  it('ensures remove button has proper aria-label for all segments', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        (label) => {
          const { container } = render(
            <FilterPill
              label={label}
              onRemove={() => {}}
            />
          );
          
          const removeButton = container.querySelector('[data-testid="filter-pill-remove"]');
          expect(removeButton).toBeTruthy();
          
          const ariaLabel = removeButton?.getAttribute('aria-label');
          expect(ariaLabel).toBe(`Remove ${label} filter`);
          
          // Should contain "Remove" and "filter"
          expect(ariaLabel).toContain('Remove');
          expect(ariaLabel).toContain('filter');
          expect(ariaLabel).toContain(label);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Requirement 7.4: Active filter indicator should update when different segment is selected
  it('updates active state when different segment is selected', () => {
    const { container, rerender } = render(
      <SegmentCard
        label="VIP"
        count={2}
        isActive={true}
        onClick={() => {}}
      />
    );
    
    let card = container.querySelector('[data-testid="segment-card"]');
    expect(card?.classList.contains('segment-card--active')).toBe(true);
    
    // Rerender with isActive=false
    rerender(
      <SegmentCard
        label="VIP"
        count={2}
        isActive={false}
        onClick={() => {}}
      />
    );
    
    card = container.querySelector('[data-testid="segment-card"]');
    expect(card?.classList.contains('segment-card--active')).toBe(false);
  });

  // Requirement 7.5: Active filter indicator should be visually distinct
  it('applies distinct visual styling to active segment card', () => {
    const { container } = render(
      <SegmentCard
        label="VIP"
        count={2}
        isActive={true}
        onClick={() => {}}
      />
    );
    
    const card = container.querySelector('[data-testid="segment-card"]');
    
    // Should have the active class
    expect(card?.classList.contains('segment-card--active')).toBe(true);
    
    // Should be a button element (interactive)
    expect(card?.tagName).toBe('BUTTON');
  });

  // Property-based test: Filter pill should have correct data attributes
  it('includes correct data attributes in filter pill', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        (label) => {
          const { container } = render(
            <FilterPill
              label={label}
              onRemove={() => {}}
            />
          );
          
          const pill = container.querySelector('[data-testid="filter-pill"]');
          expect(pill).toBeTruthy();
          expect(pill?.getAttribute('data-filter')).toBe(label);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Only one segment should be active at a time
  it('ensures only one segment can be active in a set', () => {
    const segments = [
      { label: 'VIP', count: 2, isActive: true },
      { label: 'ACTIVE', count: 3, isActive: false },
      { label: 'AT-RISK', count: 1, isActive: false },
    ];
    
    const { container } = render(
      <div>
        {segments.map((seg) => (
          <SegmentCard
            key={seg.label}
            label={seg.label}
            count={seg.count}
            isActive={seg.isActive}
            onClick={() => {}}
          />
        ))}
      </div>
    );
    
    const activeCards = container.querySelectorAll('.segment-card--active');
    expect(activeCards.length).toBe(1);
    
    const activeCard = activeCards[0];
    expect(activeCard.getAttribute('data-segment')).toBe('VIP');
  });

  // Property-based test: Filter pill structure should be consistent
  it('maintains consistent structure for filter pill', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        (label) => {
          const { container } = render(
            <FilterPill
              label={label}
              onRemove={() => {}}
            />
          );
          
          // Should have main pill element
          const pill = container.querySelector('[data-testid="filter-pill"]');
          expect(pill).toBeTruthy();
          
          // Should have label
          const labelElement = container.querySelector('[data-testid="filter-pill-label"]');
          expect(labelElement).toBeTruthy();
          
          // Should have remove button
          const removeButton = container.querySelector('[data-testid="filter-pill-remove"]');
          expect(removeButton).toBeTruthy();
          
          // Remove button should be a button element
          expect(removeButton?.tagName).toBe('BUTTON');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Remove button should have type="button"
  it('ensures remove button has correct type attribute', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        (label) => {
          const { container } = render(
            <FilterPill
              label={label}
              onRemove={() => {}}
            />
          );
          
          const removeButton = container.querySelector('[data-testid="filter-pill-remove"]');
          expect(removeButton?.getAttribute('type')).toBe('button');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Segment card should have type="button"
  it('ensures segment card has correct type attribute', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 0, max: 1000 }),
        fc.boolean(),
        (label, count, isActive) => {
          const { container } = render(
            <SegmentCard
              label={label}
              count={count}
              isActive={isActive}
              onClick={() => {}}
            />
          );
          
          const card = container.querySelector('[data-testid="segment-card"]');
          expect(card?.getAttribute('type')).toBe('button');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Filter pill should be easy to locate
  it('ensures filter pill is easily identifiable', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        (label) => {
          const { container } = render(
            <FilterPill
              label={label}
              onRemove={() => {}}
            />
          );
          
          // Should have filter-pill class
          const pill = container.querySelector('.filter-pill');
          expect(pill).toBeTruthy();
          
          // Should have data-testid
          expect(pill?.getAttribute('data-testid')).toBe('filter-pill');
          
          // Should have data-filter attribute
          expect(pill?.getAttribute('data-filter')).toBe(label);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Active segment should maintain hover effects
  it('maintains hover effects on active segment card', () => {
    const { container } = render(
      <SegmentCard
        label="VIP"
        count={2}
        isActive={true}
        onClick={() => {}}
      />
    );
    
    const card = container.querySelector('[data-testid="segment-card"]');
    
    // Should have both active class and base class
    expect(card?.classList.contains('segment-card')).toBe(true);
    expect(card?.classList.contains('segment-card--active')).toBe(true);
  });

  // Property-based test: Filter pill should handle special characters in labels
  it('handles special characters in segment labels', () => {
    const specialLabels = ['AT-RISK', 'VIP', 'ACTIVE'];
    
    specialLabels.forEach((label) => {
      const { getByTestId, unmount } = render(
        <FilterPill
          label={label}
          onRemove={() => {}}
        />
      );
      
      const labelElement = getByTestId('filter-pill-label');
      expect(labelElement.textContent).toBe(`Filter: ${label}`);
      
      // Clean up after each render
      unmount();
    });
  });

  // Property-based test: Component should be keyboard accessible
  it('ensures components are keyboard accessible', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        (label) => {
          const { container } = render(
            <>
              <SegmentCard
                label={label}
                count={5}
                isActive={true}
                onClick={() => {}}
              />
              <FilterPill
                label={label}
                onRemove={() => {}}
              />
            </>
          );
          
          // Segment card should be focusable
          const card = container.querySelector('[data-testid="segment-card"]');
          expect(card?.tagName).toBe('BUTTON');
          
          // Remove button should be focusable
          const removeButton = container.querySelector('[data-testid="filter-pill-remove"]');
          expect(removeButton?.tagName).toBe('BUTTON');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Visual feedback should be immediate
  it('provides immediate visual feedback on state change', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 0, max: 1000 }),
        (label, count) => {
          const { container, rerender } = render(
            <SegmentCard
              label={label}
              count={count}
              isActive={false}
              onClick={() => {}}
            />
          );
          
          let card = container.querySelector('[data-testid="segment-card"]');
          expect(card?.getAttribute('aria-pressed')).toBe('false');
          
          // Change to active
          rerender(
            <SegmentCard
              label={label}
              count={count}
              isActive={true}
              onClick={() => {}}
            />
          );
          
          card = container.querySelector('[data-testid="segment-card"]');
          expect(card?.getAttribute('aria-pressed')).toBe('true');
          expect(card?.classList.contains('segment-card--active')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
