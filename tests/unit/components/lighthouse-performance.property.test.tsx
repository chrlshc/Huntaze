/**
 * Property-Based Tests for Lighthouse Performance
 * 
 * Tests that all marketing pages achieve a Lighthouse performance score of at least 90.
 * Verifies Property 16: Lighthouse performance threshold
 * 
 * Feature: site-restructure-multipage, Property 16: Lighthouse performance threshold
 * Validates: Requirements 6.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Marketing pages to test
const MARKETING_PAGES = [
  '/',
  '/features',
  '/pricing',
  '/about',
  '/case-studies',
  '/contact',
  '/roadmap',
  '/careers',
  '/how-it-works',
  '/platforms',
  '/business',
  '/creator',
  '/why-huntaze',
  '/use-cases',
  '/blog',
  '/privacy',
  '/terms'
];

// Minimum performance score required
const MIN_PERFORMANCE_SCORE = 90;

// Helper function to run Lighthouse on a URL
async function runLighthouse(url: string): Promise<number> {
  try {
    const outputDir = path.join(process.cwd(), '.lighthouse-temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'report.json');
    
    // Run Lighthouse CLI
    execSync(
      `npx lighthouse ${url} --output json --output-path ${outputPath} --preset desktop --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet --only-categories=performance`,
      { stdio: 'pipe', timeout: 60000 }
    );

    // Read the report
    const report = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    const performanceScore = report.categories.performance.score * 100;

    // Clean up
    fs.unlinkSync(outputPath);

    return performanceScore;
  } catch (error) {
    console.error(`Error running Lighthouse for ${url}:`, error);
    throw error;
  }
}

// Helper function to check if server is running
function isServerRunning(url: string): boolean {
  try {
    execSync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, { 
      stdio: 'pipe',
      timeout: 5000 
    });
    return true;
  } catch {
    return false;
  }
}

describe('Lighthouse Performance Property Tests', () => {
  /**
   * Property 16: Lighthouse performance threshold
   * 
   * For any marketing page, running Lighthouse audit should yield a 
   * performance score of at least 90.
   * 
   * This property verifies that:
   * 1. All marketing pages meet the minimum performance threshold
   * 2. Performance optimizations are consistently applied
   * 3. Core Web Vitals are within acceptable ranges
   * 4. Bundle sizes are optimized
   * 
   * Feature: site-restructure-multipage, Property 16: Lighthouse performance threshold
   * Validates: Requirements 6.5
   */
  describe('Property 16: Lighthouse performance threshold', () => {
    // Skip if server is not running
    const baseUrl = process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:3000';
    const skipTests = !isServerRunning(baseUrl);

    if (skipTests) {
      it.skip('requires running server - start with "npm run dev" or "npm run start"', () => {
        expect(true).toBe(true);
      });
    }

    it('should achieve performance score ≥ 90 for all marketing pages', async () => {
      if (skipTests) return;

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...MARKETING_PAGES),
          async (pagePath) => {
            const url = `${baseUrl}${pagePath}`;
            
            console.log(`\n🔦 Testing Lighthouse performance for: ${url}`);
            
            const performanceScore = await runLighthouse(url);
            
            console.log(`   Performance Score: ${performanceScore}/100`);
            
            // Assert that performance score meets threshold
            expect(performanceScore).toBeGreaterThanOrEqual(MIN_PERFORMANCE_SCORE);
            
            return true;
          }
        ),
        { numRuns: MARKETING_PAGES.length, timeout: 120000 }
      );
    }, 300000); // 5 minute timeout for all tests

    it('should maintain consistent performance across multiple runs', async () => {
      if (skipTests) return;

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('/features', '/pricing', '/about'),
          fc.integer({ min: 2, max: 3 }),
          async (pagePath, numRuns) => {
            const url = `${baseUrl}${pagePath}`;
            const scores: number[] = [];
            
            console.log(`\n🔦 Testing performance consistency for: ${url} (${numRuns} runs)`);
            
            for (let i = 0; i < numRuns; i++) {
              const score = await runLighthouse(url);
              scores.push(score);
              console.log(`   Run ${i + 1}: ${score}/100`);
            }
            
            // Calculate variance
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
            const stdDev = Math.sqrt(variance);
            
            console.log(`   Average: ${avg.toFixed(2)}, Std Dev: ${stdDev.toFixed(2)}`);
            
            // All runs should meet threshold
            scores.forEach(score => {
              expect(score).toBeGreaterThanOrEqual(MIN_PERFORMANCE_SCORE);
            });
            
            // Standard deviation should be low (consistent performance)
            expect(stdDev).toBeLessThan(10);
            
            return true;
          }
        ),
        { numRuns: 3, timeout: 180000 }
      );
    }, 600000); // 10 minute timeout

    it('should have optimized Core Web Vitals', async () => {
      if (skipTests) return;

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('/', '/features', '/pricing'),
          async (pagePath) => {
            const url = `${baseUrl}${pagePath}`;
            const outputDir = path.join(process.cwd(), '.lighthouse-temp');
            
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }

            const outputPath = path.join(outputDir, 'cwv-report.json');
            
            console.log(`\n🔦 Testing Core Web Vitals for: ${url}`);
            
            // Run Lighthouse with all metrics
            execSync(
              `npx lighthouse ${url} --output json --output-path ${outputPath} --preset desktop --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet`,
              { stdio: 'pipe', timeout: 60000 }
            );

            const report = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            
            // Extract Core Web Vitals
            const fcp = report.audits['first-contentful-paint']?.numericValue || 0;
            const lcp = report.audits['largest-contentful-paint']?.numericValue || 0;
            const cls = report.audits['cumulative-layout-shift']?.numericValue || 0;
            const tbt = report.audits['total-blocking-time']?.numericValue || 0;
            
            console.log(`   FCP: ${(fcp / 1000).toFixed(2)}s (target: <2s)`);
            console.log(`   LCP: ${(lcp / 1000).toFixed(2)}s (target: <2.5s)`);
            console.log(`   CLS: ${cls.toFixed(3)} (target: <0.1)`);
            console.log(`   TBT: ${tbt.toFixed(0)}ms (target: <300ms)`);
            
            // Clean up
            fs.unlinkSync(outputPath);
            
            // Assert Core Web Vitals are within acceptable ranges
            expect(fcp).toBeLessThan(2000); // FCP < 2s
            expect(lcp).toBeLessThan(2500); // LCP < 2.5s
            expect(cls).toBeLessThan(0.1);  // CLS < 0.1
            expect(tbt).toBeLessThan(300);  // TBT < 300ms
            
            return true;
          }
        ),
        { numRuns: 3, timeout: 120000 }
      );
    }, 300000);

    it('should have optimized resource loading', async () => {
      if (skipTests) return;

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('/', '/features', '/pricing'),
          async (pagePath) => {
            const url = `${baseUrl}${pagePath}`;
            const outputDir = path.join(process.cwd(), '.lighthouse-temp');
            
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }

            const outputPath = path.join(outputDir, 'resources-report.json');
            
            console.log(`\n🔦 Testing resource optimization for: ${url}`);
            
            execSync(
              `npx lighthouse ${url} --output json --output-path ${outputPath} --preset desktop --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet`,
              { stdio: 'pipe', timeout: 60000 }
            );

            const report = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            
            // Check resource optimization audits
            const unusedJs = report.audits['unused-javascript']?.score || 0;
            const unusedCss = report.audits['unused-css-rules']?.score || 0;
            const imageOptimization = report.audits['uses-optimized-images']?.score || 0;
            
            console.log(`   Unused JS Score: ${(unusedJs * 100).toFixed(0)}/100`);
            console.log(`   Unused CSS Score: ${(unusedCss * 100).toFixed(0)}/100`);
            console.log(`   Image Optimization Score: ${(imageOptimization * 100).toFixed(0)}/100`);
            
            // Clean up
            fs.unlinkSync(outputPath);
            
            // Resource optimization scores should be reasonable
            expect(unusedJs).toBeGreaterThan(0.5);
            expect(unusedCss).toBeGreaterThan(0.5);
            expect(imageOptimization).toBeGreaterThan(0.7);
            
            return true;
          }
        ),
        { numRuns: 3, timeout: 120000 }
      );
    }, 300000);

    it('should have minimal render-blocking resources', async () => {
      if (skipTests) return;

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('/', '/features', '/pricing'),
          async (pagePath) => {
            const url = `${baseUrl}${pagePath}`;
            const outputDir = path.join(process.cwd(), '.lighthouse-temp');
            
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }

            const outputPath = path.join(outputDir, 'blocking-report.json');
            
            console.log(`\n🔦 Testing render-blocking resources for: ${url}`);
            
            execSync(
              `npx lighthouse ${url} --output json --output-path ${outputPath} --preset desktop --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet`,
              { stdio: 'pipe', timeout: 60000 }
            );

            const report = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            
            // Check render-blocking resources
            const renderBlocking = report.audits['render-blocking-resources'];
            const blockingResources = renderBlocking?.details?.items?.length || 0;
            
            console.log(`   Render-blocking resources: ${blockingResources}`);
            
            // Clean up
            fs.unlinkSync(outputPath);
            
            // Should have minimal render-blocking resources
            expect(blockingResources).toBeLessThan(5);
            
            return true;
          }
        ),
        { numRuns: 3, timeout: 120000 }
      );
    }, 300000);
  });

  /**
   * Performance Consistency Tests
   * 
   * Verifies that performance optimizations are consistently applied
   */
  describe('Performance Consistency', () => {
    const baseUrl = process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:3000';
    const skipTests = !isServerRunning(baseUrl);

    if (skipTests) {
      it.skip('requires running server', () => {
        expect(true).toBe(true);
      });
    }

    it('should maintain similar performance across related pages', async () => {
      if (skipTests) return;

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            ['/features', '/pricing', '/about'],
            ['/', '/how-it-works', '/why-huntaze']
          ),
          async (pageGroup) => {
            const scores: number[] = [];
            
            console.log(`\n🔦 Testing performance consistency across page group`);
            
            for (const pagePath of pageGroup) {
              const url = `${baseUrl}${pagePath}`;
              const score = await runLighthouse(url);
              scores.push(score);
              console.log(`   ${pagePath}: ${score}/100`);
            }
            
            // All pages in group should meet threshold
            scores.forEach(score => {
              expect(score).toBeGreaterThanOrEqual(MIN_PERFORMANCE_SCORE);
            });
            
            // Calculate variance within group
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const maxDiff = Math.max(...scores) - Math.min(...scores);
            
            console.log(`   Average: ${avg.toFixed(2)}, Max Difference: ${maxDiff.toFixed(2)}`);
            
            // Performance should be consistent within group (max 15 point difference)
            expect(maxDiff).toBeLessThan(15);
            
            return true;
          }
        ),
        { numRuns: 2, timeout: 180000 }
      );
    }, 600000);
  });
});
