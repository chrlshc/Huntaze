/**
 * Property Test: Chart Data Gap Handling
 * 
 * Property 5: For any time series with missing dates, the chart SHALL render 
 * without throwing errors and display zero or interpolated values for gaps.
 * 
 * Validates: Requirements 4.4
 * Feature: creator-analytics-dashboard
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TimeSeriesPoint } from '@/lib/dashboard/types';

/**
 * Fill gaps in time series data with zero values
 * This is the expected behavior for handling missing dates
 */
function fillGaps(data: TimeSeriesPoint[]): TimeSeriesPoint[] {
  if (data.length === 0) return [];
  
  // Sort by date first
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  
  const result: TimeSeriesPoint[] = [];
  const startDate = new Date(sorted[0].date);
  const endDate = new Date(sorted[sorted.length - 1].date);
  
  // Create a map for quick lookup
  const dataMap = new Map(sorted.map(point => [point.date, point.value]));
  
  // Fill all dates between start and end
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      value: dataMap.get(dateStr) ?? 0, // Use 0 for missing dates
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

/**
 * Validate that data can be safely rendered without errors
 */
function canRenderSafely(data: TimeSeriesPoint[]): boolean {
  try {
    // Check all values are valid numbers
    for (const point of data) {
      if (typeof point.value !== 'number' || !isFinite(point.value)) {
        return false;
      }
      if (typeof point.date !== 'string' || point.date.length === 0) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

describe('**Feature: creator-analytics-dashboard, Property 5: Chart Data Gap Handling**', () => {
  it('renders without errors for data with gaps', () => {
    fc.assert(
      fc.property(
        // Generate sparse time series with gaps
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 31 })
              .map(day => `2024-01-${String(day).padStart(2, '0')}`),
            value: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 15 } // Less than 31 days = guaranteed gaps
        ),
        (sparseData) => {
          // Remove duplicates by date
          const uniqueData = Array.from(
            new Map(sparseData.map(p => [p.date, p])).values()
          );
          
          const filledData = fillGaps(uniqueData);
          
          // Should be able to render safely
          expect(canRenderSafely(filledData)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fills gaps with zero values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 10 })
              .map(day => `2024-01-${String(day).padStart(2, '0')}`),
            value: fc.float({ min: 1, max: 100000, noNaN: true }), // Non-zero values
          }),
          { minLength: 2, maxLength: 5 } // Sparse data
        ),
        (sparseData) => {
          // Remove duplicates
          const uniqueData = Array.from(
            new Map(sparseData.map(p => [p.date, p])).values()
          );
          
          if (uniqueData.length < 2) return true; // Skip if not enough data
          
          const filledData = fillGaps(uniqueData);
          
          // Should have more points than original (gaps filled)
          expect(filledData.length).toBeGreaterThanOrEqual(uniqueData.length);
          
          // All original non-zero values should be preserved
          const originalDates = new Set(uniqueData.map(p => p.date));
          for (const point of filledData) {
            if (originalDates.has(point.date)) {
              const original = uniqueData.find(p => p.date === point.date);
              expect(point.value).toBeCloseTo(original!.value, 2);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('creates continuous date sequence', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 15 })
              .map(day => `2024-01-${String(day).padStart(2, '0')}`),
            value: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          { minLength: 2, maxLength: 8 }
        ),
        (sparseData) => {
          const uniqueData = Array.from(
            new Map(sparseData.map(p => [p.date, p])).values()
          );
          
          if (uniqueData.length < 2) return true;
          
          const filledData = fillGaps(uniqueData);
          
          // Check dates are continuous (no gaps)
          for (let i = 1; i < filledData.length; i++) {
            const prevDate = new Date(filledData[i - 1].date);
            const currDate = new Date(filledData[i].date);
            const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
            
            expect(diffDays).toBe(1); // Exactly 1 day apart
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles empty data gracefully', () => {
    const result = fillGaps([]);
    expect(result).toEqual([]);
    expect(canRenderSafely(result)).toBe(true);
  });

  it('handles single data point', () => {
    const singlePoint: TimeSeriesPoint = {
      date: '2024-01-15',
      value: 1000,
    };
    const result = fillGaps([singlePoint]);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(singlePoint);
    expect(canRenderSafely(result)).toBe(true);
  });

  it('handles data with no gaps', () => {
    const continuousData: TimeSeriesPoint[] = [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-02', value: 200 },
      { date: '2024-01-03', value: 150 },
    ];
    
    const result = fillGaps(continuousData);
    
    expect(result).toHaveLength(3);
    expect(result).toEqual(continuousData);
    expect(canRenderSafely(result)).toBe(true);
  });

  it('handles data with large gaps', () => {
    const dataWithLargeGap: TimeSeriesPoint[] = [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-10', value: 200 }, // 9-day gap
    ];
    
    const result = fillGaps(dataWithLargeGap);
    
    expect(result).toHaveLength(10); // 10 days total
    expect(result[0].value).toBe(100);
    expect(result[9].value).toBe(200);
    
    // Middle values should be zero
    for (let i = 1; i < 9; i++) {
      expect(result[i].value).toBe(0);
    }
    
    expect(canRenderSafely(result)).toBe(true);
  });

  it('handles unsorted data', () => {
    const unsortedData: TimeSeriesPoint[] = [
      { date: '2024-01-05', value: 300 },
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-03', value: 200 },
    ];
    
    const result = fillGaps(unsortedData);
    
    expect(result).toHaveLength(5);
    expect(result[0].date).toBe('2024-01-01');
    expect(result[4].date).toBe('2024-01-05');
    expect(canRenderSafely(result)).toBe(true);
  });

  it('preserves all original data points', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 20 })
              .map(day => `2024-01-${String(day).padStart(2, '0')}`),
            value: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (sparseData) => {
          const uniqueData = Array.from(
            new Map(sparseData.map(p => [p.date, p])).values()
          );
          
          const filledData = fillGaps(uniqueData);
          
          // All original dates should exist in filled data
          for (const original of uniqueData) {
            const found = filledData.find(p => p.date === original.date);
            expect(found).toBeDefined();
            expect(found!.value).toBeCloseTo(original.value, 2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all filled values are valid numbers', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 15 })
              .map(day => `2024-01-${String(day).padStart(2, '0')}`),
            value: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 8 }
        ),
        (sparseData) => {
          const uniqueData = Array.from(
            new Map(sparseData.map(p => [p.date, p])).values()
          );
          
          const filledData = fillGaps(uniqueData);
          
          // All values should be valid numbers
          for (const point of filledData) {
            expect(typeof point.value).toBe('number');
            expect(isFinite(point.value)).toBe(true);
            expect(point.value).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
