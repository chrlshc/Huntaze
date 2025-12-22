/**
 * Feature: dashboard-global-polish, Property 14: Table Header Stickiness
 * Validates: Requirements 8.7
 * 
 * Property: For any fans table, the header row should remain sticky (fixed position)
 * when scrolling the table content.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { IndexTable, Column } from '@/components/ui/IndexTable';

interface TestRow {
  id: string;
  name: string;
  tier: string;
  value: number;
}

describe('Property 14: Table Header Stickiness', () => {
  it('should have sticky positioning on table header', () => {
    const testData: TestRow[] = Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Fan ${i + 1}`,
      tier: 'VIP',
      value: 100 * (i + 1),
    }));

    const columns: Column<TestRow>[] = [
      { key: 'name', header: 'Name' },
      { key: 'tier', header: 'Tier' },
      { key: 'value', header: 'Value', numeric: true },
    ];

    const { container } = render(
      <div style={{ height: '400px', overflow: 'auto' }}>
        <IndexTable<TestRow>
          data={testData}
          columns={columns}
          keyField="id"
        />
      </div>
    );

    const header = container.querySelector('.index-table__header');
    expect(header).toBeTruthy();
    
    // Check that header has sticky positioning
    const headerStyle = window.getComputedStyle(header as Element);
    expect(headerStyle.position).toBe('sticky');
    expect(headerStyle.top).toBe('0px');
  });

  it('should maintain sticky header across different data sizes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            tier: fc.constantFrom('VIP', 'Active', 'At-Risk'),
            value: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 5, maxLength: 50 }
        ),
        async (testData) => {
          const columns: Column<typeof testData[0]>[] = [
            { key: 'name', header: 'Name' },
            { key: 'tier', header: 'Tier' },
            { key: 'value', header: 'Value', numeric: true },
          ];

          const { container, unmount } = render(
            <div style={{ height: '400px', overflow: 'auto' }}>
              <IndexTable
                data={testData}
                columns={columns}
                keyField="id"
              />
            </div>
          );

          const header = container.querySelector('.index-table__header');
          expect(header).toBeTruthy();
          
          const headerStyle = window.getComputedStyle(header as Element);
          expect(headerStyle.position).toBe('sticky');
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should keep header visible when scrolling through table content', () => {
    const testData: TestRow[] = Array.from({ length: 30 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Fan ${i + 1}`,
      tier: i % 3 === 0 ? 'VIP' : i % 3 === 1 ? 'Active' : 'At-Risk',
      value: 100 * (i + 1),
    }));

    const columns: Column<TestRow>[] = [
      { key: 'name', header: 'Name' },
      { key: 'tier', header: 'Tier' },
      { key: 'value', header: 'Value', numeric: true },
    ];

    const { container } = render(
      <div 
        style={{ height: '400px', overflow: 'auto' }}
        data-testid="scroll-container"
      >
        <IndexTable<TestRow>
          data={testData}
          columns={columns}
          keyField="id"
        />
      </div>
    );

    const scrollContainer = container.querySelector('[data-testid="scroll-container"]');
    const header = container.querySelector('.index-table__header');
    
    expect(header).toBeTruthy();
    expect(scrollContainer).toBeTruthy();
    
    // Verify sticky positioning is set
    const headerStyle = window.getComputedStyle(header as Element);
    expect(headerStyle.position).toBe('sticky');
    expect(headerStyle.top).toBe('0px');
    
    // Verify z-index is set to keep header above content
    const zIndex = parseInt(headerStyle.zIndex);
    expect(zIndex).toBeGreaterThan(0);
  });

  it('should apply sticky positioning to all header cells', () => {
    const testData: TestRow[] = [
      { id: '1', name: 'Fan 1', tier: 'VIP', value: 100 },
    ];

    const columns: Column<TestRow>[] = [
      { key: 'name', header: 'Name' },
      { key: 'tier', header: 'Tier' },
      { key: 'value', header: 'Value', numeric: true },
    ];

    const { container } = render(
      <IndexTable<TestRow>
        data={testData}
        columns={columns}
        keyField="id"
      />
    );

    const headerCells = container.querySelectorAll('.index-table__header-cell');
    expect(headerCells.length).toBe(columns.length);
    
    // All header cells should be within the sticky header
    const header = container.querySelector('.index-table__header');
    headerCells.forEach(cell => {
      expect(header?.contains(cell)).toBe(true);
    });
  });
});
