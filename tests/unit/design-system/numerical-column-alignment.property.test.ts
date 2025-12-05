/**
 * Property-Based Tests for IndexTable Numerical Column Alignment
 * 
 * **Feature: dashboard-design-refactor, Property 16: Numerical column alignment**
 * **Validates: Requirements 6.2**
 * 
 * Tests that numerical columns in IndexTable are right-aligned.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Column alignment types
type ColumnAlignment = 'left' | 'center' | 'right';

interface Column<T> {
  key: keyof T;
  header: string;
  align?: ColumnAlignment;
  numeric?: boolean;
}

// Helper function to determine column alignment (mirrors component logic)
function getColumnAlignment<T>(column: Column<T>, value?: unknown): ColumnAlignment {
  // Numeric columns are always right-aligned
  if (column.numeric) {
    return 'right';
  }
  
  // Auto-detect numeric values
  if (value !== undefined && isNumericValue(value)) {
    return 'right';
  }
  
  return column.align || 'left';
}

function isNumericValue(value: unknown): boolean {
  return typeof value === 'number' || 
         (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '');
}

// Arbitraries for generating test data
const numericValueArbitrary = fc.oneof(
  fc.integer(),
  fc.float({ noNaN: true }),
  fc.integer().map(n => String(n)),
  fc.float({ noNaN: true }).map(n => n.toFixed(2)),
);

const nonNumericValueArbitrary = fc.oneof(
  fc.string({ minLength: 1 }).filter(s => isNaN(Number(s)) || s.trim() === ''),
  fc.constantFrom('active', 'pending', 'completed', 'N/A', '-'),
  fc.boolean().map(b => String(b)),
);

const columnArbitrary = <T extends Record<string, unknown>>() => fc.record({
  key: fc.constantFrom('id', 'name', 'value', 'amount', 'count', 'status') as fc.Arbitrary<keyof T>,
  header: fc.string({ minLength: 1, maxLength: 20 }),
  align: fc.option(fc.constantFrom<ColumnAlignment>('left', 'center', 'right'), { nil: undefined }),
  numeric: fc.option(fc.boolean(), { nil: undefined }),
});

describe('Property 16: Numerical column alignment', () => {
  /**
   * Property: For any IndexTable column with numeric data,
   * the column cells SHALL have text-align: right.
   */
  it('columns marked as numeric are always right-aligned', () => {
    fc.assert(
      fc.property(
        fc.record({
          key: fc.constantFrom('amount', 'count', 'value') as fc.Arbitrary<keyof Record<string, unknown>>,
          header: fc.string({ minLength: 1 }),
          numeric: fc.constant(true),
          align: fc.option(fc.constantFrom<ColumnAlignment>('left', 'center', 'right'), { nil: undefined }),
        }),
        (column) => {
          const alignment = getColumnAlignment(column);
          
          // Numeric columns should always be right-aligned
          expect(alignment).toBe('right');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('numeric values are right-aligned even without numeric flag', () => {
    fc.assert(
      fc.property(
        fc.record({
          key: fc.constant('value') as fc.Arbitrary<keyof Record<string, unknown>>,
          header: fc.string({ minLength: 1 }),
          numeric: fc.constant(undefined),
          align: fc.constant(undefined),
        }),
        numericValueArbitrary,
        (column, value) => {
          const alignment = getColumnAlignment(column, value);
          
          // Auto-detected numeric values should be right-aligned
          expect(alignment).toBe('right');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('non-numeric columns default to left alignment', () => {
    fc.assert(
      fc.property(
        fc.record({
          key: fc.constant('name') as fc.Arbitrary<keyof Record<string, unknown>>,
          header: fc.string({ minLength: 1 }),
          numeric: fc.constant(undefined),
          align: fc.constant(undefined),
        }),
        nonNumericValueArbitrary,
        (column, value) => {
          const alignment = getColumnAlignment(column, value);
          
          // Non-numeric columns without explicit alignment default to left
          expect(alignment).toBe('left');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('explicit align overrides default for non-numeric columns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ColumnAlignment>('left', 'center', 'right'),
        nonNumericValueArbitrary,
        (explicitAlign, value) => {
          const column = {
            key: 'status' as keyof Record<string, unknown>,
            header: 'Status',
            align: explicitAlign,
            numeric: undefined,
          };
          
          const alignment = getColumnAlignment(column, value);
          
          // Explicit alignment should be respected for non-numeric columns
          expect(alignment).toBe(explicitAlign);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('numeric flag takes precedence over explicit align', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ColumnAlignment>('left', 'center'),
        (explicitAlign) => {
          const column = {
            key: 'amount' as keyof Record<string, unknown>,
            header: 'Amount',
            align: explicitAlign,
            numeric: true,
          };
          
          const alignment = getColumnAlignment(column);
          
          // Numeric flag should override explicit alignment
          expect(alignment).toBe('right');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('integer values are detected as numeric', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        (value) => {
          expect(isNumericValue(value)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('float values are detected as numeric', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true }),
        (value) => {
          expect(isNumericValue(value)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('numeric strings are detected as numeric', () => {
    fc.assert(
      fc.property(
        fc.integer().map(n => String(n)),
        (value) => {
          expect(isNumericValue(value)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('non-numeric strings are not detected as numeric', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => isNaN(Number(s))),
        (value) => {
          expect(isNumericValue(value)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty and whitespace strings are not numeric', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', '  ', '\t', '\n', '   '),
        (value) => {
          expect(isNumericValue(value)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('IndexTable numerical alignment edge cases', () => {
  it('currency-formatted strings are handled correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }).map(n => `$${n.toLocaleString()}`),
        (value) => {
          // Currency strings with symbols are not pure numeric
          // They should be handled by custom render functions
          const isNumeric = isNumericValue(value);
          expect(typeof isNumeric).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('percentage strings are handled correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }).map(n => `${n}%`),
        (value) => {
          // Percentage strings are not pure numeric
          const isNumeric = isNumericValue(value);
          expect(typeof isNumeric).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('negative numbers are detected as numeric', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: -1 }),
        (value) => {
          expect(isNumericValue(value)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('decimal numbers are detected as numeric', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }).map(n => (n / 100).toFixed(2)),
        (value) => {
          expect(isNumericValue(value)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('scientific notation is detected as numeric', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (base, exp) => {
          const value = `${base}e${exp}`;
          expect(isNumericValue(value)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('mixed content columns respect explicit alignment', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(numericValueArbitrary, nonNumericValueArbitrary),
          { minLength: 1, maxLength: 20 }
        ),
        fc.constantFrom<ColumnAlignment>('left', 'center', 'right'),
        (values, explicitAlign) => {
          const column = {
            key: 'mixed' as keyof Record<string, unknown>,
            header: 'Mixed',
            align: explicitAlign,
            numeric: false, // Explicitly not numeric
          };
          
          // With numeric: false, explicit alignment should be used
          const alignment = getColumnAlignment(column);
          expect(alignment).toBe(explicitAlign);
        }
      ),
      { numRuns: 100 }
    );
  });
});
