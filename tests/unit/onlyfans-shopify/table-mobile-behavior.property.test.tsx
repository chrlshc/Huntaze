/**
 * **Feature: onlyfans-shopify-unification, Property 15: Table Mobile Behavior**
 * 
 * *For any* ShopifyIndexTable on mobile viewport, the table should either enable horizontal 
 * scrolling or transform to card-based layout
 * 
 * **Validates: Requirements 8.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ShopifyIndexTable } from '@/components/ui/shopify/ShopifyIndexTable';
import React from 'react';

// Sample data generators
const columnArbitrary = fc.array(
  fc.record({
    header: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
    accessor: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
  }),
  { minLength: 2, maxLength: 5 }
);

const dataArbitrary = (columns: any[]) => 
  fc.array(
    fc.record(
      Object.fromEntries(columns.map(col => [col.accessor, fc.string({ maxLength: 20 })]))
    ),
    { minLength: 1, maxLength: 5 }
  );

describe('Property 15: Table Mobile Behavior', () => {
  it('should have overflow-x-auto for horizontal scrolling', () => {
    fc.assert(
      fc.property(columnArbitrary, (columns) => {
        fc.pre(columns.length > 0);
        
        const data = columns.map((col, idx) => ({
          id: `row-${idx}`,
          [col.accessor]: `Value ${idx}`,
        }));

        const { container } = render(
          <ShopifyIndexTable
            columns={columns}
            data={data}
          />
        );

        // Should have overflow-x-auto for horizontal scrolling
        const scrollContainer = container.querySelector('.overflow-x-auto');
        expect(scrollContainer).toBeTruthy();
      }),
      { numRuns: 50 }
    );
  });

  it('should render table structure consistently', () => {
    fc.assert(
      fc.property(columnArbitrary, (columns) => {
        fc.pre(columns.length > 0);
        
        const data = columns.map((col, idx) => ({
          id: `row-${idx}`,
          [col.accessor]: `Value ${idx}`,
        }));

        const { container } = render(
          <ShopifyIndexTable
            columns={columns}
            data={data}
          />
        );

        // Should have table element
        const table = container.querySelector('table');
        expect(table).toBeTruthy();
        
        // Should have thead and tbody
        const thead = container.querySelector('thead');
        const tbody = container.querySelector('tbody');
        expect(thead).toBeTruthy();
        expect(tbody).toBeTruthy();
      }),
      { numRuns: 50 }
    );
  });

  it('should have responsive container with rounded corners', () => {
    fc.assert(
      fc.property(columnArbitrary, (columns) => {
        fc.pre(columns.length > 0);
        
        const data = columns.map((col, idx) => ({
          id: `row-${idx}`,
          [col.accessor]: `Value ${idx}`,
        }));

        const { container } = render(
          <ShopifyIndexTable
            columns={columns}
            data={data}
          />
        );

        // Container should have rounded corners
        const tableContainer = container.querySelector('.rounded-lg');
        expect(tableContainer).toBeTruthy();
      }),
      { numRuns: 50 }
    );
  });
});
