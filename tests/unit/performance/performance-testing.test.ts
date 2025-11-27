/**
 * Performance Testing Infrastructure Tests
 * Validates that performance testing tools work correctly
 * 
 * Validates: Requirements 8.1 (Performance testing infrastructure)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BundleSizeAnalyzer } from '../../../scripts/bundle-size-analysis';
import { PerformanceBudgetValidator } from '../../../scripts/performance-budget';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Performance Testing Infrastructure', () => {
  const testBuildDir = '.next-test';
  const testStaticDir = join(testBuildDir, 'static', 'chunks');
  
  beforeAll(() => {
    // Create test build directory structure
    if (!existsSync(testStaticDir)) {
      mkdirSync(testStaticDir, { recursive: true });
    }
    
    // Create test bundle files
    const testFiles = [
      { name: 'main.js', size: 150 * 1024 }, // 150KB
      { name: 'vendor.js', size: 250 * 1024 }, // 250KB
      { name: 'page-home.js', size: 50 * 1024 }, // 50KB
      { name: 'styles.css', size: 80 * 1024 }, // 80KB
    ];
    
    for (const file of testFiles) {
      const content = Buffer.alloc(file.size, 'x');
      writeFileSync(join(testStaticDir, file.name), content);
    }
  });
  
  afterAll(() => {
    // Clean up test directory
    if (existsSync(testBuildDir)) {
      rmSync(testBuildDir, { recursive: true, force: true });
    }
  });
  
  describe('Bundle Size Analyzer', () => {
    it('should analyze bundle files correctly', () => {
      const analyzer = new BundleSizeAnalyzer(testBuildDir);
      const analysis = analyzer.analyze();
      
      expect(analysis.files.length).toBeGreaterThan(0);
      expect(analysis.totalSize).toBeGreaterThan(0);
      expect(analysis.totalGzipSize).toBeGreaterThan(0);
      expect(analysis.totalGzipSize).toBeLessThan(analysis.totalSize);
    });
    
    it('should categorize files by type', () => {
      const analyzer = new BundleSizeAnalyzer(testBuildDir);
      const analysis = analyzer.analyze();
      
      expect(analysis.byType.js.count).toBeGreaterThan(0);
      expect(analysis.byType.css.count).toBeGreaterThan(0);
      expect(analysis.byType.js.size).toBeGreaterThan(0);
      expect(analysis.byType.css.size).toBeGreaterThan(0);
    });
    
    it('should identify largest files', () => {
      const analyzer = new BundleSizeAnalyzer(testBuildDir);
      const analysis = analyzer.analyze();
      
      expect(analysis.largestFiles.length).toBeGreaterThan(0);
      
      // Verify files are sorted by size (descending)
      for (let i = 1; i < analysis.largestFiles.length; i++) {
        expect(analysis.largestFiles[i - 1].size).toBeGreaterThanOrEqual(
          analysis.largestFiles[i].size
        );
      }
    });
    
    it('should generate recommendations for oversized chunks', () => {
      const analyzer = new BundleSizeAnalyzer(testBuildDir, 100 * 1024); // 100KB limit
      const analysis = analyzer.analyze();
      
      // Should have recommendations since vendor.js is 250KB
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
    
    it('should calculate compression ratios', () => {
      const analyzer = new BundleSizeAnalyzer(testBuildDir);
      const analysis = analyzer.analyze();
      
      for (const file of analysis.files) {
        const compressionRatio = file.gzipSize / file.size;
        expect(compressionRatio).toBeGreaterThan(0);
        expect(compressionRatio).toBeLessThanOrEqual(1);
      }
    });
  });
  
  describe('Performance Budget Validator', () => {
    it('should validate budgets correctly', () => {
      const validator = new PerformanceBudgetValidator(testBuildDir);
      
      // Test with mock bundles instead of analyzing
      const mockBundles = [
        { file: 'main.js', size: 150 },
        { file: 'vendor.js', size: 250 },
      ];
      
      const result = validator.validateBudgets(mockBundles);
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
    
    it('should detect budget violations', () => {
      const validator = new PerformanceBudgetValidator(testBuildDir);
      const bundles = [
        { file: 'main.js', size: 150 },
        { file: 'vendor.js', size: 400 }, // Exceeds 300KB vendor budget
      ];
      
      const result = validator.validateBudgets(bundles);
      
      // Should have violations since vendor.js exceeds budget
      expect(result.violations.length + result.warnings.length).toBeGreaterThan(0);
    });
    
    it('should calculate resource sizes by type', () => {
      const validator = new PerformanceBudgetValidator(testBuildDir);
      const bundles = [
        { file: 'main.js', size: 150 },
        { file: 'vendor.js', size: 250 },
        { file: 'styles.css', size: 80 },
      ];
      
      const sizes = validator['calculateResourceSizes'](bundles);
      
      expect(sizes.get('js-total')).toBe(400);
      expect(sizes.get('css-total')).toBe(80);
      expect(sizes.get('js-files')).toBe(2);
      expect(sizes.get('css-files')).toBe(1);
    });
    
    it('should generate detailed reports', () => {
      const validator = new PerformanceBudgetValidator(testBuildDir);
      const result = {
        passed: false,
        violations: [
          {
            resourceType: 'js-total',
            actual: 600,
            budget: 500,
            unit: 'KB',
            severity: 'error' as const,
            message: 'js-total: 600KB exceeds budget of 500KB',
          },
        ],
        warnings: [],
        summary: {
          totalSize: 680,
          totalFiles: 4,
          largestFile: { file: 'vendor.js', size: 250 },
        },
      };
      
      const report = validator.generateReport(result);
      
      expect(report).toContain('PERFORMANCE BUDGET VALIDATION REPORT');
      expect(report).toContain('BUDGET VIOLATIONS');
      expect(report).toContain('js-total');
    });
  });
  
  describe('Lighthouse CI Configuration', () => {
    it('should have valid configuration file', () => {
      const configPath = 'lighthouserc.config.js';
      expect(existsSync(configPath)).toBe(true);
    });
    
    it('should define performance thresholds', () => {
      const config = require('../../../lighthouserc.config.js');
      
      expect(config.ci).toBeDefined();
      expect(config.ci.assert).toBeDefined();
      expect(config.ci.assert.assertions).toBeDefined();
      
      // Check key assertions
      expect(config.ci.assert.assertions['categories:performance']).toBeDefined();
      expect(config.ci.assert.assertions['first-contentful-paint']).toBeDefined();
      expect(config.ci.assert.assertions['largest-contentful-paint']).toBeDefined();
      expect(config.ci.assert.assertions['cumulative-layout-shift']).toBeDefined();
    });
    
    it('should define resource budgets', () => {
      const config = require('../../../lighthouserc.config.js');
      const assertions = config.ci.assert.assertions;
      
      expect(assertions['resource-summary:script:size']).toBeDefined();
      expect(assertions['resource-summary:stylesheet:size']).toBeDefined();
      expect(assertions['resource-summary:total:size']).toBeDefined();
    });
  });
  
  describe('CI/CD Integration', () => {
    it('should have GitHub Actions workflow', () => {
      const workflowPath = '.github/workflows/performance-ci.yml';
      expect(existsSync(workflowPath)).toBe(true);
    });
    
    it('should define all required jobs', () => {
      const workflowPath = '.github/workflows/performance-ci.yml';
      const workflow = require('fs').readFileSync(workflowPath, 'utf-8');
      
      expect(workflow).toContain('lighthouse-audit');
      expect(workflow).toContain('bundle-size-check');
      expect(workflow).toContain('web-vitals-e2e');
      expect(workflow).toContain('performance-summary');
    });
  });
  
  describe('Integration Tests', () => {
    it('should run all performance tests in sequence', async () => {
      // This test validates that all tools can work together
      const analyzer = new BundleSizeAnalyzer(testBuildDir);
      const validator = new PerformanceBudgetValidator(testBuildDir);
      
      // Run analysis
      const analysis = analyzer.analyze();
      
      // Use mock data if no files found
      const testBundles = analysis.files.length > 0 ? analysis.files : [
        { file: 'main.js', size: 150, gzipSize: 50, type: 'js' as const },
        { file: 'vendor.js', size: 250, gzipSize: 80, type: 'js' as const },
      ];
      
      // Run validation
      const result = validator.validateBudgets(testBundles);
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
    
    it('should provide actionable feedback', () => {
      const analyzer = new BundleSizeAnalyzer(testBuildDir, 100 * 1024);
      const analysis = analyzer.analyze();
      
      // Should have recommendations
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      
      // Recommendations should be actionable
      const hasActionableRecommendation = analysis.recommendations.some(
        rec => rec.includes('consider') || rec.includes('optimize')
      );
      expect(hasActionableRecommendation).toBe(true);
    });
  });
});
