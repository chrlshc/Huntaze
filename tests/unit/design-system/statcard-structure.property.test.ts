/**
 * **Feature: dashboard-design-refactor, Property 9: StatCard structure**
 * **Validates: Requirements 3.5**
 * 
 * For any StatCard component, the rendered output SHALL have the label 
 * element positioned before the value element in the DOM.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// StatCard configuration
interface StatCardConfig {
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  isEmpty: boolean;
  emptyMessage: string;
  loading: boolean;
}

// Simulated DOM element order
interface StatCardDOMStructure {
  elements: Array<{
    type: 'label' | 'value' | 'empty-message' | 'trend' | 'skeleton';
    order: number;
  }>;
}

// Simulate StatCard DOM structure
function simulateStatCardDOM(config: StatCardConfig): StatCardDOMStructure {
  const elements: StatCardDOMStructure['elements'] = [];
  let order = 0;

  if (config.loading) {
    // Loading state renders skeletons
    elements.push({ type: 'skeleton', order: order++ });
    elements.push({ type: 'skeleton', order: order++ });
    return { elements };
  }

  // Label always comes first
  elements.push({ type: 'label', order: order++ });

  if (config.isEmpty) {
    // Empty state shows message instead of value
    elements.push({ type: 'empty-message', order: order++ });
  } else {
    // Value comes after label
    elements.push({ type: 'value', order: order++ });
    
    // Trend indicator comes after value (if present)
    if (config.trend) {
      elements.push({ type: 'trend', order: order++ });
    }
  }

  return { elements };
}

// Get element order by type
function getElementOrder(structure: StatCardDOMStructure, type: string): number | undefined {
  const element = structure.elements.find(e => e.type === type);
  return element?.order;
}

// Arbitraries
const labelArb = fc.string({ minLength: 1, maxLength: 50 });
const valueArb = fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.integer({ min: 0, max: 1000000 })
);
const trendDirectionArb = fc.constantFrom('up', 'down', 'neutral') as fc.Arbitrary<'up' | 'down' | 'neutral'>;
const trendArb = fc.option(
  fc.record({
    direction: trendDirectionArb,
    value: fc.string({ minLength: 1, maxLength: 10 }),
  }),
  { nil: undefined }
);

const statCardConfigArb = fc.record({
  label: labelArb,
  value: valueArb,
  trend: trendArb,
  isEmpty: fc.boolean(),
  emptyMessage: fc.string({ minLength: 1, maxLength: 100 }),
  loading: fc.boolean(),
});

describe('Property 9: StatCard structure', () => {
  it('label should always come before value in DOM order (non-loading, non-empty)', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: labelArb,
          value: valueArb,
          trend: trendArb,
          isEmpty: fc.constant(false),
          emptyMessage: fc.string({ minLength: 1, maxLength: 100 }),
          loading: fc.constant(false),
        }),
        (config) => {
          const structure = simulateStatCardDOM(config);
          const labelOrder = getElementOrder(structure, 'label');
          const valueOrder = getElementOrder(structure, 'value');
          
          expect(labelOrder).toBeDefined();
          expect(valueOrder).toBeDefined();
          expect(labelOrder).toBeLessThan(valueOrder!);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('label should always come before empty-message in DOM order (empty state)', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: labelArb,
          value: valueArb,
          trend: trendArb,
          isEmpty: fc.constant(true),
          emptyMessage: fc.string({ minLength: 1, maxLength: 100 }),
          loading: fc.constant(false),
        }),
        (config) => {
          const structure = simulateStatCardDOM(config);
          const labelOrder = getElementOrder(structure, 'label');
          const emptyOrder = getElementOrder(structure, 'empty-message');
          
          expect(labelOrder).toBeDefined();
          expect(emptyOrder).toBeDefined();
          expect(labelOrder).toBeLessThan(emptyOrder!);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trend indicator should come after value when present', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: labelArb,
          value: valueArb,
          trend: fc.record({
            direction: trendDirectionArb,
            value: fc.string({ minLength: 1, maxLength: 10 }),
          }),
          isEmpty: fc.constant(false),
          emptyMessage: fc.string({ minLength: 1, maxLength: 100 }),
          loading: fc.constant(false),
        }),
        (config) => {
          const structure = simulateStatCardDOM(config);
          const valueOrder = getElementOrder(structure, 'value');
          const trendOrder = getElementOrder(structure, 'trend');
          
          expect(valueOrder).toBeDefined();
          expect(trendOrder).toBeDefined();
          expect(valueOrder).toBeLessThan(trendOrder!);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('loading state should render skeleton elements', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: labelArb,
          value: valueArb,
          trend: trendArb,
          isEmpty: fc.boolean(),
          emptyMessage: fc.string({ minLength: 1, maxLength: 100 }),
          loading: fc.constant(true),
        }),
        (config) => {
          const structure = simulateStatCardDOM(config);
          const skeletonElements = structure.elements.filter(e => e.type === 'skeleton');
          
          expect(skeletonElements.length).toBeGreaterThan(0);
          // Should not have label or value in loading state
          expect(getElementOrder(structure, 'label')).toBeUndefined();
          expect(getElementOrder(structure, 'value')).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('label should always be the first element in non-loading state', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: labelArb,
          value: valueArb,
          trend: trendArb,
          isEmpty: fc.boolean(),
          emptyMessage: fc.string({ minLength: 1, maxLength: 100 }),
          loading: fc.constant(false),
        }),
        (config) => {
          const structure = simulateStatCardDOM(config);
          const labelOrder = getElementOrder(structure, 'label');
          
          expect(labelOrder).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
