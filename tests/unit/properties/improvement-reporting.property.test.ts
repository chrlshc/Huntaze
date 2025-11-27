/**
 * Property-Based Tests for Improvement Reporting
 * 
 * Feature: dashboard-performance-real-fix, Property 23: Performance improvement reporting
 * 
 * Tests that for any completed optimization, a report is generated showing
 * the percentage improvement in each measured metric.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ImpactMeasurementTool, PerformanceSnapshot } from '../../../lib/diagnostics/impact-measurement';

describe('Property 23: Performance improvement reporting', () => {
  /**
   * Property: For any completed optimization, a report should be generated
   * showing percentage improvements
   */
  it('should generate a report with percentage improvements for all metrics', () => {
    fc.assert(
      fc.property(
        // Generate before/after snapshots
        fc.record({
          timestamp: fc.integer({ min: Date.now() - 1000000, max: Date.now() }),
          pageLoadTimes: fc.dictionary(
            fc.constantFrom('/dashboard', '/content', '/analytics'),
            fc.float({ min: 500, max: 3000 })
          ),
          apiResponseTimes: fc.dictionary(
            fc.constantFrom('/api/test1', '/api/test2'),
            fc.float({ min: 50, max: 500 })
          ),
          dbQueryCounts: fc.dictionary(
            fc.constantFrom('/api/test1', '/api/test2'),
            fc.integer({ min: 5, max: 50 })
          ),
          cacheHitRates: fc.dictionary(
            fc.constantFrom('/api/test1', '/api/test2'),
            fc.float({ min: Math.fround(0.3), max: Math.fround(0.7), noNaN: true })
          ),
          totalRequests: fc.integer({ min: 10, max: 100 }),
          totalDbQueries: fc.integer({ min: 50, max: 500 }),
          averagePageLoadTime: fc.float({ min: 500, max: 3000 }),
          averageApiResponseTime: fc.float({ min: 50, max: 500 }),
        }),
        fc.record({
          timestamp: fc.integer({ min: Date.now(), max: Date.now() + 1000000 }),
          pageLoadTimes: fc.dictionary(
            fc.constantFrom('/dashboard', '/content', '/analytics'),
            fc.float({ min: 200, max: 2000 })
          ),
          apiResponseTimes: fc.dictionary(
            fc.constantFrom('/api/test1', '/api/test2'),
            fc.float({ min: 20, max: 300 })
          ),
          dbQueryCounts: fc.dictionary(
            fc.constantFrom('/api/test1', '/api/test2'),
            fc.integer({ min: 1, max: 25 })
          ),
          cacheHitRates: fc.dictionary(
            fc.constantFrom('/api/test1', '/api/test2'),
            fc.float({ min: Math.fround(0.5), max: Math.fround(0.95), noNaN: true })
          ),
          totalRequests: fc.integer({ min: 10, max: 100 }),
          totalDbQueries: fc.integer({ min: 10, max: 250 }),
          averagePageLoadTime: fc.float({ min: 200, max: 2000 }),
          averageApiResponseTime: fc.float({ min: 20, max: 300 }),
        }),
        (beforeSnapshot, afterSnapshot) => {
          const tool = new ImpactMeasurementTool();
          const measurement = tool.compareSnapshots(beforeSnapshot, afterSnapshot);
          
          // Generate report
          const report = tool.generateReport(measurement);
          
          // Property: Report must contain percentage improvements
          expect(report).toContain('%');
          expect(report).toContain('OVERALL IMPROVEMENTS');
          
          // Property: Report must show all four key metrics
          expect(report).toContain('Page Load Time:');
          expect(report).toContain('API Response Time:');
          expect(report).toContain('DB Query Count:');
          expect(report).toContain('Cache Hit Rate:');
          
          // Property: Report must include detailed breakdowns
          expect(report).toContain('PAGE LOAD TIME IMPROVEMENTS');
          expect(report).toContain('API RESPONSE TIME IMPROVEMENTS');
          expect(report).toContain('DATABASE QUERY REDUCTIONS');
          expect(report).toContain('CACHE HIT RATE CHANGES');
          
          // Property: Report must show before/after values
          expect(report).toContain('→');
          
          // Property: Report must be properly formatted
          expect(report).toContain('='.repeat(80));
          expect(report).toContain('-'.repeat(80));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Report should show improvement direction correctly
   */
  it('should indicate improvement direction with arrows', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1000, max: 3000, noNaN: true }),
        fc.float({ min: 500, max: 2500, noNaN: true }),
        (beforeTime, afterTime) => {
          const tool = new ImpactMeasurementTool();
          
          const beforeSnapshot: PerformanceSnapshot = {
            timestamp: Date.now() - 1000,
            pageLoadTimes: { '/test': beforeTime },
            apiResponseTimes: {},
            dbQueryCounts: {},
            cacheHitRates: {},
            totalRequests: 1,
            totalDbQueries: 0,
            averagePageLoadTime: beforeTime,
            averageApiResponseTime: 0,
          };
          
          const afterSnapshot: PerformanceSnapshot = {
            timestamp: Date.now(),
            pageLoadTimes: { '/test': afterTime },
            apiResponseTimes: {},
            dbQueryCounts: {},
            cacheHitRates: {},
            totalRequests: 1,
            totalDbQueries: 0,
            averagePageLoadTime: afterTime,
            averageApiResponseTime: 0,
          };
          
          const measurement = tool.compareSnapshots(beforeSnapshot, afterSnapshot);
          const report = tool.generateReport(measurement);
          
          // Property: If performance improved (after < before), report should show ↑
          if (afterTime < beforeTime) {
            expect(report).toContain('↑');
            expect(report).toContain('faster');
          }
          
          // Property: If performance degraded (after > before), report should show ↓
          if (afterTime > beforeTime) {
            expect(report).toContain('↓');
            expect(report).toContain('slower');
          }
          
          // Property: Report should show actual values
          expect(report).toContain(beforeTime.toFixed(0));
          expect(report).toContain(afterTime.toFixed(0));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Report should handle edge cases gracefully
   */
  it('should handle edge cases like zero improvements or missing data', () => {
    fc.assert(
      fc.property(
        fc.record({
          timestamp: fc.integer({ min: Date.now() - 1000, max: Date.now() }),
          pageLoadTimes: fc.dictionary(fc.string(), fc.float({ min: 100, max: 1000 })),
          apiResponseTimes: fc.dictionary(fc.string(), fc.float({ min: 10, max: 100 })),
          dbQueryCounts: fc.dictionary(fc.string(), fc.integer({ min: 0, max: 10 })),
          cacheHitRates: fc.dictionary(fc.string(), fc.float({ min: 0, max: 1 })),
          totalRequests: fc.integer({ min: 0, max: 10 }),
          totalDbQueries: fc.integer({ min: 0, max: 100 }),
          averagePageLoadTime: fc.float({ min: 0, max: 1000 }),
          averageApiResponseTime: fc.float({ min: 0, max: 100 }),
        }),
        (snapshot) => {
          const tool = new ImpactMeasurementTool();
          
          // Compare snapshot with itself (zero improvement)
          const measurement = tool.compareSnapshots(snapshot, snapshot);
          
          // Property: Report generation should not throw even with zero improvements
          expect(() => tool.generateReport(measurement)).not.toThrow();
          
          const report = tool.generateReport(measurement);
          
          // Property: Report should still be valid
          expect(report).toBeTruthy();
          expect(report.length).toBeGreaterThan(0);
          expect(report).toContain('PERFORMANCE OPTIMIZATION IMPACT REPORT');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Report should show all pages and endpoints that were measured
   */
  it('should include all measured pages and endpoints in the report', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (pages, endpoints) => {
          const tool = new ImpactMeasurementTool();
          
          const beforeSnapshot: PerformanceSnapshot = {
            timestamp: Date.now() - 1000,
            pageLoadTimes: Object.fromEntries(pages.map(p => [p, 1000])),
            apiResponseTimes: Object.fromEntries(endpoints.map(e => [e, 100])),
            dbQueryCounts: Object.fromEntries(endpoints.map(e => [e, 10])),
            cacheHitRates: Object.fromEntries(endpoints.map(e => [e, 0.5])),
            totalRequests: endpoints.length,
            totalDbQueries: endpoints.length * 10,
            averagePageLoadTime: 1000,
            averageApiResponseTime: 100,
          };
          
          const afterSnapshot: PerformanceSnapshot = {
            timestamp: Date.now(),
            pageLoadTimes: Object.fromEntries(pages.map(p => [p, 500])),
            apiResponseTimes: Object.fromEntries(endpoints.map(e => [e, 50])),
            dbQueryCounts: Object.fromEntries(endpoints.map(e => [e, 5])),
            cacheHitRates: Object.fromEntries(endpoints.map(e => [e, 0.8])),
            totalRequests: endpoints.length,
            totalDbQueries: endpoints.length * 5,
            averagePageLoadTime: 500,
            averageApiResponseTime: 50,
          };
          
          const measurement = tool.compareSnapshots(beforeSnapshot, afterSnapshot);
          const report = tool.generateReport(measurement);
          
          // Property: All pages should appear in the report
          for (const page of pages) {
            expect(report).toContain(page);
          }
          
          // Property: All endpoints should appear in the report
          for (const endpoint of endpoints) {
            expect(report).toContain(endpoint);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Report percentages should be mathematically correct
   */
  it('should calculate and display correct percentage improvements', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 1000, noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.99), noNaN: true }), // improvement factor
        (beforeValue, improvementFactor) => {
          const afterValue = beforeValue * improvementFactor;
          const expectedImprovement = ((beforeValue - afterValue) / beforeValue) * 100;
          
          const tool = new ImpactMeasurementTool();
          
          const beforeSnapshot: PerformanceSnapshot = {
            timestamp: Date.now() - 1000,
            pageLoadTimes: { '/test': beforeValue },
            apiResponseTimes: {},
            dbQueryCounts: {},
            cacheHitRates: {},
            totalRequests: 1,
            totalDbQueries: 0,
            averagePageLoadTime: beforeValue,
            averageApiResponseTime: 0,
          };
          
          const afterSnapshot: PerformanceSnapshot = {
            timestamp: Date.now(),
            pageLoadTimes: { '/test': afterValue },
            apiResponseTimes: {},
            dbQueryCounts: {},
            cacheHitRates: {},
            totalRequests: 1,
            totalDbQueries: 0,
            averagePageLoadTime: afterValue,
            averageApiResponseTime: 0,
          };
          
          const measurement = tool.compareSnapshots(beforeSnapshot, afterSnapshot);
          const report = tool.generateReport(measurement);
          
          // Property: Report should contain the calculated improvement percentage
          const improvementStr = expectedImprovement.toFixed(1);
          expect(report).toContain(improvementStr);
          
          // Property: Improvement should be positive (faster)
          expect(report).toContain('faster');
        }
      ),
      { numRuns: 100 }
    );
  });
});
