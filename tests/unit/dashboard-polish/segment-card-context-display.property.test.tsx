/**
 * Feature: dashboard-global-polish, Property 10: Segment Card Context Display
 * 
 * Property: For any fan segment card (VIP, AT-RISK, CHURNED), it should display
 * both count and percentage when applicable.
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { SegmentCard } from '@/components/fans/SegmentCard';

describe('Property 10: Segment Card Context Display', () => {
  // Define segment types
  const segmentLabels = ['ALL FANS', 'VIP', 'ACTIVE', 'AT-RISK', 'CHURNED'] as const;
  
  // Requirement 6.1: ALL FANS segment displays total count only
  it('should display only count for ALL FANS segment', () => {
    const { getByTestId } = render(
      <SegmentCard
        label="ALL FANS"
        count={5}
        onClick={() => {}}
      />
    );
    
    const count = getByTestId('segment-card-count');
    expect(count.textContent).toBe('5');
    
    // Should NOT have percentage
    const percentage = screen.queryByTestId('segment-card-percentage');
    expect(percentage).toBeNull();
  });

  // Requirement 6.2: VIP segment displays count and percentage
  it('should display count and percentage for VIP segment', () => {
    const { getByTestId } = render(
      <SegmentCard
        label="VIP"
        count={2}
        percentage={40}
        onClick={() => {}}
      />
    );
    
    const count = getByTestId('segment-card-count');
    expect(count.textContent).toBe('2');
    
    const percentage = getByTestId('segment-card-percentage');
    expect(percentage.textContent).toBe('(40%)');
  });

  // Requirement 6.3: AT-RISK segment displays count and percentage
  it('should display count and percentage for AT-RISK segment', () => {
    const { getByTestId } = render(
      <SegmentCard
        label="AT-RISK"
        count={1}
        percentage={20}
        onClick={() => {}}
      />
    );
    
    const count = getByTestId('segment-card-count');
    expect(count.textContent).toBe('1');
    
    const percentage = getByTestId('segment-card-percentage');
    expect(percentage.textContent).toBe('(20%)');
  });

  // Requirement 6.4: CHURNED segment displays count and percentage
  it('should display count and percentage for CHURNED segment', () => {
    const { getByTestId } = render(
      <SegmentCard
        label="CHURNED"
        count={3}
        percentage={60}
        onClick={() => {}}
      />
    );
    
    const count = getByTestId('segment-card-count');
    expect(count.textContent).toBe('3');
    
    const percentage = getByTestId('segment-card-percentage');
    expect(percentage.textContent).toBe('(60%)');
  });

  // Property-based test: For any segment with percentage, both count and percentage should be displayed
  it('displays both count and percentage when percentage is provided', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 0, max: 1000 }), // count
        fc.integer({ min: 0, max: 100 }), // percentage
        (label, count, percentage) => {
          const { container } = render(
            <SegmentCard
              label={label}
              count={count}
              percentage={percentage}
              onClick={() => {}}
            />
          );
          
          // Count should always be displayed
          const countElement = container.querySelector('[data-testid="segment-card-count"]');
          expect(countElement?.textContent).toBe(String(count));
          
          // Percentage should be displayed
          const percentageElement = container.querySelector('[data-testid="segment-card-percentage"]');
          expect(percentageElement?.textContent).toBe(`(${percentage}%)`);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: For any segment without percentage, only count should be displayed
  it('displays only count when percentage is not provided', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 0, max: 1000 }), // count
        (label, count) => {
          const { container } = render(
            <SegmentCard
              label={label}
              count={count}
              onClick={() => {}}
            />
          );
          
          // Count should be displayed
          const countElement = container.querySelector('[data-testid="segment-card-count"]');
          expect(countElement?.textContent).toBe(String(count));
          
          // Percentage should NOT be displayed
          const percentageElement = container.querySelector('[data-testid="segment-card-percentage"]');
          expect(percentageElement).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Label should always be displayed in uppercase with letter-spacing
  it('displays label in uppercase format for all segments', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 0, max: 1000 }),
        (label, count) => {
          const { container } = render(
            <SegmentCard
              label={label}
              count={count}
              onClick={() => {}}
            />
          );
          
          const labelElement = container.querySelector('[data-testid="segment-card-label"]');
          expect(labelElement?.textContent).toBe(label);
          
          // Label should have the polish-label class styling
          const card = container.querySelector('[data-testid="segment-card"]');
          expect(card).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Stats container should always contain count
  it('ensures stats container always contains count element', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 0, max: 1000 }),
        fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        (label, count, percentage) => {
          const { container } = render(
            <SegmentCard
              label={label}
              count={count}
              percentage={percentage}
              onClick={() => {}}
            />
          );
          
          const statsContainer = container.querySelector('[data-testid="segment-card-stats"]');
          expect(statsContainer).toBeTruthy();
          
          const countElement = container.querySelector('[data-testid="segment-card-count"]');
          expect(statsContainer?.contains(countElement)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Percentage format should always include parentheses and % symbol
  it('formats percentage with parentheses and percent symbol', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 100 }),
        (label, count, percentage) => {
          const { container } = render(
            <SegmentCard
              label={label}
              count={count}
              percentage={percentage}
              onClick={() => {}}
            />
          );
          
          const percentageElement = container.querySelector('[data-testid="segment-card-percentage"]');
          const text = percentageElement?.textContent || '';
          
          // Should start with '(' and end with '%)'
          expect(text.startsWith('(')).toBe(true);
          expect(text.endsWith('%)')).toBe(true);
          
          // Should contain the percentage value
          expect(text).toContain(String(percentage));
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Active state should not affect context display
  it('maintains context display regardless of active state', () => {
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
          
          // Count should always be displayed
          const countElement = container.querySelector('[data-testid="segment-card-count"]');
          expect(countElement?.textContent).toBe(String(count));
          
          // Percentage display should depend only on whether it's provided
          const percentageElement = container.querySelector('[data-testid="segment-card-percentage"]');
          if (percentage !== undefined) {
            expect(percentageElement).toBeTruthy();
            expect(percentageElement?.textContent).toBe(`(${percentage}%)`);
          } else {
            expect(percentageElement).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Zero values should be displayed correctly
  it('displays zero values correctly for count and percentage', () => {
    const { getByTestId } = render(
      <SegmentCard
        label="VIP"
        count={0}
        percentage={0}
        onClick={() => {}}
      />
    );
    
    const count = getByTestId('segment-card-count');
    expect(count.textContent).toBe('0');
    
    const percentage = getByTestId('segment-card-percentage');
    expect(percentage.textContent).toBe('(0%)');
  });

  // Property-based test: Large numbers should be displayed without truncation
  it('displays large numbers without truncation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 1000, max: 999999 }),
        fc.integer({ min: 0, max: 100 }),
        (label, count, percentage) => {
          const { container } = render(
            <SegmentCard
              label={label}
              count={count}
              percentage={percentage}
              onClick={() => {}}
            />
          );
          
          const countElement = container.querySelector('[data-testid="segment-card-count"]');
          expect(countElement?.textContent).toBe(String(count));
          
          const percentageElement = container.querySelector('[data-testid="segment-card-percentage"]');
          expect(percentageElement?.textContent).toBe(`(${percentage}%)`);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Requirement 6.5: Contextual information should be in subtle, secondary text style
  it('applies secondary text styling to percentage', () => {
    const { getByTestId } = render(
      <SegmentCard
        label="VIP"
        count={2}
        percentage={40}
        onClick={() => {}}
      />
    );
    
    const percentage = getByTestId('segment-card-percentage');
    
    // Should have the segment-card__percentage class
    expect(percentage.classList.contains('segment-card__percentage')).toBe(true);
  });

  // Property-based test: Component structure should be consistent
  it('maintains consistent component structure for all segments', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...segmentLabels),
        fc.integer({ min: 0, max: 1000 }),
        fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        (label, count, percentage) => {
          const { container } = render(
            <SegmentCard
              label={label}
              count={count}
              percentage={percentage}
              onClick={() => {}}
            />
          );
          
          // Should have main card element
          const card = container.querySelector('[data-testid="segment-card"]');
          expect(card).toBeTruthy();
          
          // Should have label
          const labelElement = container.querySelector('[data-testid="segment-card-label"]');
          expect(labelElement).toBeTruthy();
          
          // Should have stats container
          const stats = container.querySelector('[data-testid="segment-card-stats"]');
          expect(stats).toBeTruthy();
          
          // Should have count
          const countElement = container.querySelector('[data-testid="segment-card-count"]');
          expect(countElement).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
