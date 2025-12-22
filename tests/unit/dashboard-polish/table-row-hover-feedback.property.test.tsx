/**
 * Feature: dashboard-global-polish, Property 5: Table Row Hover Feedback
 * Validates: Requirements 3.3
 * 
 * Property: For any table row, hovering should apply a slightly lighter background color
 * to provide visual feedback.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as fc from 'fast-check';
import { IndexTable, Column } from '@/components/ui/IndexTable';

interface TestRow {
  id: string;
  name: string;
  value: number;
}

describe('Property 5: Table Row Hover Feedback', () => {
  it('should apply hover background color to any table row on hover', async () => {
    const user = userEvent.setup();
    
    // Generate test data
    const testData: TestRow[] = [
      { id: '1', name: 'Row 1', value: 100 },
      { id: '2', name: 'Row 2', value: 200 },
      { id: '3', name: 'Row 3', value: 300 },
    ];

    const columns: Column<TestRow>[] = [
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value', numeric: true },
    ];

    const { container } = render(
      <IndexTable<TestRow>
        data={testData}
        columns={columns}
        keyField="id"
      />
    );

    // Get all table rows (excluding header)
    const rows = container.querySelectorAll('.index-table__row');
    
    // Test each row
    for (const row of Array.from(rows)) {
      // Get initial background color
      const initialBg = window.getComputedStyle(row).backgroundColor;
      
      // Hover over the row
      await user.hover(row as HTMLElement);
      
      // Check that hover class is applied
      expect(row.classList.contains('index-table__row--hovered')).toBe(true);
      
      // Unhover
      await user.unhover(row as HTMLElement);
      
      // Check that hover class is removed
      expect(row.classList.contains('index-table__row--hovered')).toBe(false);
    }
  });

  it('should apply hover feedback consistently across different row counts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            value: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (testData) => {
          const user = userEvent.setup();
          
          const columns: Column<typeof testData[0]>[] = [
            { key: 'name', header: 'Name' },
            { key: 'value', header: 'Value', numeric: true },
          ];

          const { container, unmount } = render(
            <IndexTable
              data={testData}
              columns={columns}
              keyField="id"
            />
          );

          const rows = container.querySelectorAll('.index-table__row');
          
          // Test that all rows support hover
          expect(rows.length).toBe(testData.length);
          
          // Test first and last row
          if (rows.length > 0) {
            const firstRow = rows[0];
            await user.hover(firstRow as HTMLElement);
            expect(firstRow.classList.contains('index-table__row--hovered')).toBe(true);
            await user.unhover(firstRow as HTMLElement);
            
            const lastRow = rows[rows.length - 1];
            await user.hover(lastRow as HTMLElement);
            expect(lastRow.classList.contains('index-table__row--hovered')).toBe(true);
            await user.unhover(lastRow as HTMLElement);
          }
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain hover state only on the currently hovered row', async () => {
    const user = userEvent.setup();
    
    const testData: TestRow[] = [
      { id: '1', name: 'Row 1', value: 100 },
      { id: '2', name: 'Row 2', value: 200 },
      { id: '3', name: 'Row 3', value: 300 },
    ];

    const columns: Column<TestRow>[] = [
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value', numeric: true },
    ];

    const { container } = render(
      <IndexTable<TestRow>
        data={testData}
        columns={columns}
        keyField="id"
      />
    );

    const rows = Array.from(container.querySelectorAll('.index-table__row'));
    
    // Hover over first row
    await user.hover(rows[0] as HTMLElement);
    expect(rows[0].classList.contains('index-table__row--hovered')).toBe(true);
    expect(rows[1].classList.contains('index-table__row--hovered')).toBe(false);
    expect(rows[2].classList.contains('index-table__row--hovered')).toBe(false);
    
    // Move to second row
    await user.hover(rows[1] as HTMLElement);
    expect(rows[0].classList.contains('index-table__row--hovered')).toBe(false);
    expect(rows[1].classList.contains('index-table__row--hovered')).toBe(true);
    expect(rows[2].classList.contains('index-table__row--hovered')).toBe(false);
  });
});
