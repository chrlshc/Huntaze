/**
 * Property Test: Revenue Chart Cumulative Mode Calculation
 * 
 * Property 4: For any array of daily revenue values, the cumulative value at 
 * index i SHALL equal the sum of all daily values from index 0 to i inclusive.
 * 
 * Validates: Requirements 4.5
 * Feature: creator-analytics-dashboard
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TimeSeriesPoint } from '@/lib/dashboard/types';

// Helper function to calculate cumulative (extracted from component for testing)
function calculateCumulative(data: TimeSeriesPoint[]): TimeSeriesPoint[] {
  let cumulative = 0;
  return data.map((point) => {
    cumulative += point.value;
    return {
      date: point.date,
      value: cumulative,
    };
  });
}

describe('**Feature: creator-analytics-dashboard, Property 4: Revenue Chart Cumulative Mode Calculation**', () => {
  it('cumulative value at index i equals sum of all values from 0 to i', () => {
    fc.assert(
      fc.property(
        // Generate array of time series points with random values
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 365 })
              .map(day => `2024-${String(Math.floor((day - 1) / 31) + 1).padStart(2, '0')}-${String(((day - 1) % 31) + 1).padStart(2, '0')}`),
            value: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 365 }
        ),
        (dailyData) => {
          const cumulativeData = calculateCumulative(dailyData);

          // For each index, verify cumulative equals sum of all previous values
          for (let i = 0; i < cumulativeData.length; i++) {
            const expectedSum = dailyData
              .slice(0, i + 1)
              .reduce((sum, point) => sum + point.value, 0);
            
            const actualCumulative = cumulativeData[i].value;
            
            // Allow small floating point error
            const diff = Math.abs(actualCumulative - expectedSum);
            expect(diff).toBeLessThan(0.01);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cumulative values are monotonically increasing for positive values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 365 })
              .map(day => `2024-${String(Math.floor((day - 1) / 31) + 1).padStart(2, '0')}-${String(((day - 1) % 31) + 1).padStart(2, '0')}`),
            value: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          { minLength: 2, maxLength: 100 }
        ),
        (dailyData) => {
          const cumulativeData = calculateCumulative(dailyData);

          // Each cumulative value should be >= previous
          for (let i = 1; i < cumulativeData.length; i++) {
            expect(cumulativeData[i].value).toBeGreaterThanOrEqual(
              cumulativeData[i - 1].value
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('first cumulative value equals first daily value', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 365 })
              .map(day => `2024-${String(Math.floor((day - 1) / 31) + 1).padStart(2, '0')}-${String(((day - 1) % 31) + 1).padStart(2, '0')}`),
            value: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (dailyData) => {
          const cumulativeData = calculateCumulative(dailyData);

          expect(cumulativeData[0].value).toBeCloseTo(dailyData[0].value, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('last cumulative value equals sum of all daily values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 365 })
              .map(day => `2024-${String(Math.floor((day - 1) / 31) + 1).padStart(2, '0')}-${String(((day - 1) % 31) + 1).padStart(2, '0')}`),
            value: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (dailyData) => {
          const cumulativeData = calculateCumulative(dailyData);
          const totalSum = dailyData.reduce((sum, point) => sum + point.value, 0);

          expect(cumulativeData[cumulativeData.length - 1].value).toBeCloseTo(totalSum, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves date values in cumulative calculation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.integer({ min: 1, max: 365 })
              .map(day => `2024-${String(Math.floor((day - 1) / 31) + 1).padStart(2, '0')}-${String(((day - 1) % 31) + 1).padStart(2, '0')}`),
            value: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (dailyData) => {
          const cumulativeData = calculateCumulative(dailyData);

          // Dates should be preserved
          for (let i = 0; i < dailyData.length; i++) {
            expect(cumulativeData[i].date).toBe(dailyData[i].date);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles empty array gracefully', () => {
    const result = calculateCumulative([]);
    expect(result).toEqual([]);
  });

  it('handles single data point', () => {
    const singlePoint: TimeSeriesPoint = {
      date: '2024-01-01',
      value: 1000,
    };
    const result = calculateCumulative([singlePoint]);
    
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(1000);
    expect(result[0].date).toBe('2024-01-01');
  });

  it('handles zero values correctly', () => {
    const dataWithZeros: TimeSeriesPoint[] = [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-02', value: 0 },
      { date: '2024-01-03', value: 50 },
      { date: '2024-01-04', value: 0 },
    ];
    
    const result = calculateCumulative(dataWithZeros);
    
    expect(result[0].value).toBe(100);
    expect(result[1].value).toBe(100); // 100 + 0
    expect(result[2].value).toBe(150); // 100 + 0 + 50
    expect(result[3].value).toBe(150); // 100 + 0 + 50 + 0
  });
});
