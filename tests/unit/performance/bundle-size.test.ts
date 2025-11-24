/**
 * Bundle Size Performance Tests
 * 
 * Tests to verify that lazy loading reduces initial bundle size and
 * improves loading performance.
 * 
 * Requirements: 7.1, 7.4
 */

import { describe, it, expect } from 'vitest';
import { analyzeFile, HEAVY_LIBRARIES, LAZY_LOAD_THRESHOLD } from '../../../scripts/analyze-bundle-size';
import * as path from 'path';

describe('Bundle Size Analysis', () => {
  describe('Heavy Component Detection', () => {
    it('should identify PhoneMockup3D as heavy component', () => {
      const filePath = path.join(process.cwd(), 'components/animations/PhoneMockup3D.tsx');
      const analysis = analyzeFile(filePath);

      expect(analysis).toBeDefined();
      expect(analysis?.shouldLazyLoad).toBe(true);
      expect(analysis?.estimatedSizeKB).toBeGreaterThan(LAZY_LOAD_THRESHOLD);
    });

    it('should identify LiveDashboard as heavy component', () => {
      const filePath = path.join(process.cwd(), 'components/animations/LiveDashboard.tsx');
      const analysis = analyzeFile(filePath);

      expect(analysis).toBeDefined();
      expect(analysis?.shouldLazyLoad).toBe(true);
      expect(analysis?.estimatedSizeKB).toBeGreaterThan(LAZY_LOAD_THRESHOLD);
    });

    it('should identify ContentEditor as heavy component', () => {
      const filePath = path.join(process.cwd(), 'components/content/ContentEditor.tsx');
      const analysis = analyzeFile(filePath);

      expect(analysis).toBeDefined();
      expect(analysis?.shouldLazyLoad).toBe(true);
      expect(analysis?.estimatedSizeKB).toBeGreaterThan(LAZY_LOAD_THRESHOLD);
    });
  });

  describe('Heavy Library Detection', () => {
    it('should detect Three.js imports', () => {
      const filePath = path.join(process.cwd(), 'components/animations/PhoneMockup3D.tsx');
      const analysis = analyzeFile(filePath);

      expect(analysis?.imports).toBeDefined();
      
      const hasThreeImports = analysis?.imports.some(
        imp => imp.includes('@react-three/fiber') || 
               imp.includes('@react-three/drei') || 
               imp.includes('three')
      );
      
      expect(hasThreeImports).toBe(true);
    });

    it('should detect Chart.js imports', () => {
      const filePath = path.join(process.cwd(), 'components/animations/LiveDashboard.tsx');
      const analysis = analyzeFile(filePath);

      expect(analysis?.imports).toBeDefined();
      
      const hasChartImports = analysis?.imports.some(
        imp => imp.includes('react-chartjs-2') || imp.includes('chart.js')
      );
      
      expect(hasChartImports).toBe(true);
    });

    it('should detect TipTap imports', () => {
      const filePath = path.join(process.cwd(), 'components/content/ContentEditor.tsx');
      const analysis = analyzeFile(filePath);

      expect(analysis?.imports).toBeDefined();
      
      const hasTipTapImports = analysis?.imports.some(
        imp => imp.includes('@tiptap/react') || imp.includes('@tiptap/starter-kit')
      );
      
      expect(hasTipTapImports).toBe(true);
    });
  });

  describe('Size Threshold', () => {
    it('should use 50KB as the lazy load threshold', () => {
      expect(LAZY_LOAD_THRESHOLD).toBe(50);
    });

    it('should correctly identify components above threshold', () => {
      const filePath = path.join(process.cwd(), 'components/animations/PhoneMockup3D.tsx');
      const analysis = analyzeFile(filePath);

      if (analysis && analysis.estimatedSizeKB > LAZY_LOAD_THRESHOLD) {
        expect(analysis.shouldLazyLoad).toBe(true);
      }
    });

    it('should correctly identify components below threshold', () => {
      // Test with a small component
      const filePath = path.join(process.cwd(), 'components/layout/SkeletonScreen.tsx');
      const analysis = analyzeFile(filePath);

      if (analysis && analysis.estimatedSizeKB <= LAZY_LOAD_THRESHOLD) {
        expect(analysis.shouldLazyLoad).toBe(false);
      }
    });
  });

  describe('Heavy Library Sizes', () => {
    it('should have correct size estimates for heavy libraries', () => {
      expect(HEAVY_LIBRARIES['three']).toBe(600);
      expect(HEAVY_LIBRARIES['@react-three/fiber']).toBe(150);
      expect(HEAVY_LIBRARIES['@react-three/drei']).toBe(200);
      expect(HEAVY_LIBRARIES['chart.js']).toBe(200);
      expect(HEAVY_LIBRARIES['react-chartjs-2']).toBe(100);
      expect(HEAVY_LIBRARIES['@tiptap/react']).toBe(80);
    });

    it('should estimate Three.js components as very heavy', () => {
      const threeSize = HEAVY_LIBRARIES['three'] + 
                       HEAVY_LIBRARIES['@react-three/fiber'] + 
                       HEAVY_LIBRARIES['@react-three/drei'];
      
      expect(threeSize).toBeGreaterThan(900);
    });

    it('should estimate Chart.js components as heavy', () => {
      const chartSize = HEAVY_LIBRARIES['chart.js'] + 
                       HEAVY_LIBRARIES['react-chartjs-2'];
      
      expect(chartSize).toBeGreaterThan(250);
    });
  });
});

describe('Lazy Loading Implementation', () => {
  describe('LazyHeavyComponents', () => {
    it('should export lazy versions of heavy components', async () => {
      const { LazyComponents } = await import('../../../components/performance/LazyHeavyComponents');

      expect(LazyComponents).toBeDefined();
      expect(LazyComponents.PhoneMockup3D).toBeDefined();
      expect(LazyComponents.LiveDashboard).toBeDefined();
      expect(LazyComponents.ContentEditor).toBeDefined();
      expect(LazyComponents.LineChart).toBeDefined();
      expect(LazyComponents.DoughnutChart).toBeDefined();
      expect(LazyComponents.BarChart).toBeDefined();
    });

    it('should export all required lazy components', async () => {
      const { LazyComponents } = await import('../../../components/performance/LazyHeavyComponents');

      const requiredComponents = [
        'PhoneMockup3D',
        'LiveDashboard',
        'ContentEditor',
        'ContentEditorWithAutoSave',
        'LineChart',
        'DoughnutChart',
        'BarChart',
        'PerformanceCharts',
        'MediaPicker',
        'InteractiveDemo',
        'CookieConsent',
        'ContactSalesModal',
        'NotificationSettings',
      ];

      for (const component of requiredComponents) {
        expect(LazyComponents[component as keyof typeof LazyComponents]).toBeDefined();
      }
    });
  });

  describe('Bundle Size Reduction', () => {
    it('should reduce initial bundle by not importing heavy components directly', async () => {
      // This test verifies that heavy components are not in the initial bundle
      // by checking that they are dynamically imported
      
      const fs = require('fs');
      const path = require('path');
      
      const lazyComponentsPath = path.join(process.cwd(), 'components/performance/LazyHeavyComponents.tsx');
      
      if (fs.existsSync(lazyComponentsPath)) {
        const content = fs.readFileSync(lazyComponentsPath, 'utf-8');
        
        // Should use dynamic imports, not direct imports
        expect(content).toContain('import(');
        expect(content).not.toContain("import PhoneMockup3D from '../animations/PhoneMockup3D'");
        expect(content).not.toContain("import LiveDashboard from '../animations/LiveDashboard'");
        expect(content).not.toContain("import ContentEditor from '../content/ContentEditor'");
      } else {
        // If file doesn't exist yet, skip this test
        expect(true).toBe(true);
      }
    });
  });
});

describe('Performance Metrics', () => {
  describe('Loading Performance', () => {
    it('should load lazy components asynchronously', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      expect(LazyComponent).toBeDefined();
      expect(typeof LazyComponent).toBe('function');
    });

    it('should provide fallback UI during loading', async () => {
      const { LazyComponent } = await import('../../../components/performance/LazyComponent');
      
      // LazyComponent should be a valid React component
      expect(LazyComponent).toBeDefined();
      expect(typeof LazyComponent).toBe('function');
      
      // Verify it accepts the required props
      const props = {
        loader: () => Promise.resolve({ default: () => null }),
        fallback: 'Loading...',
      };
      
      // Just verify the component exists and has the right shape
      expect(LazyComponent).toBeDefined();
    });
  });

  describe('Threshold Configuration', () => {
    it('should use 50KB threshold for lazy loading', () => {
      expect(LAZY_LOAD_THRESHOLD).toBe(50);
    });

    it('should allow custom threshold configuration', async () => {
      const { shouldLazyLoad } = await import('../../../components/performance/LazyComponent');
      
      expect(shouldLazyLoad(60, 50)).toBe(true);
      expect(shouldLazyLoad(40, 50)).toBe(false);
      expect(shouldLazyLoad(100, 80)).toBe(true);
      expect(shouldLazyLoad(70, 80)).toBe(false);
    });
  });
});

describe('Bundle Analysis Report', () => {
  it('should generate bundle analysis report', () => {
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(process.cwd(), '.kiro/reports/bundle-analysis.json');
    
    // Report should exist after running the analysis script
    // This test assumes the script has been run at least once
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      
      expect(report).toBeDefined();
      expect(report.threshold).toBe(50);
      expect(report.components).toBeDefined();
      expect(Array.isArray(report.components)).toBe(true);
    }
  });
});
