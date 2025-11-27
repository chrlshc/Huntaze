/**
 * Web Vitals E2E Testing Script
 * Captures and validates Web Vitals metrics in end-to-end tests
 * 
 * Validates: Requirements 2.2 (Web Vitals tracking)
 */

import { chromium, Browser, Page } from 'playwright';

interface WebVitalsMetrics {
  url: string;
  fcp: number | null;  // First Contentful Paint
  lcp: number | null;  // Largest Contentful Paint
  fid: number | null;  // First Input Delay
  cls: number | null;  // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  inp: number | null;  // Interaction to Next Paint
}

interface WebVitalsThresholds {
  fcp: { good: number; poor: number };
  lcp: { good: number; poor: number };
  fid: { good: number; poor: number };
  cls: { good: number; poor: number };
  ttfb: { good: number; poor: number };
  inp: { good: number; poor: number };
}

interface WebVitalsTestResult {
  url: string;
  metrics: WebVitalsMetrics;
  passed: boolean;
  failures: string[];
  warnings: string[];
  grade: 'good' | 'needs-improvement' | 'poor';
}

// Web Vitals thresholds (based on Google's Core Web Vitals)
const THRESHOLDS: WebVitalsThresholds = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
  inp: { good: 200, poor: 500 },
};

class WebVitalsE2ETester {
  private browser: Browser | null = null;
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Initialize browser
   */
  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
  }
  
  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
  
  /**
   * Inject Web Vitals measurement script
   */
  private async injectWebVitalsScript(page: Page): Promise<void> {
    await page.addInitScript(() => {
      // Store Web Vitals metrics
      (window as any).__webVitals = {
        fcp: null,
        lcp: null,
        fid: null,
        cls: null,
        ttfb: null,
        inp: null,
      };
      
      // Observe performance entries
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            (window as any).__webVitals.fcp = entry.startTime;
          }
          if (entry.entryType === 'largest-contentful-paint') {
            (window as any).__webVitals.lcp = entry.startTime;
          }
          if (entry.entryType === 'first-input') {
            (window as any).__webVitals.fid = (entry as any).processingStart - entry.startTime;
          }
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            (window as any).__webVitals.cls = 
              ((window as any).__webVitals.cls || 0) + (entry as any).value;
          }
        }
      });
      
      observer.observe({ 
        entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
      });
      
      // Measure TTFB
      window.addEventListener('load', () => {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navTiming) {
          (window as any).__webVitals.ttfb = navTiming.responseStart - navTiming.requestStart;
        }
      });
    });
  }
  
  /**
   * Measure Web Vitals for a URL
   */
  async measureWebVitals(url: string): Promise<WebVitalsMetrics> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }
    
    const page = await this.browser.newPage();
    
    try {
      // Inject measurement script
      await this.injectWebVitalsScript(page);
      
      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for metrics to be collected
      await page.waitForTimeout(3000);
      
      // Simulate user interaction for FID/INP
      await page.mouse.move(100, 100);
      await page.mouse.click(100, 100);
      await page.waitForTimeout(500);
      
      // Extract metrics
      const metrics = await page.evaluate(() => {
        return (window as any).__webVitals;
      });
      
      return {
        url,
        ...metrics,
      };
    } finally {
      await page.close();
    }
  }
  
  /**
   * Evaluate metric against thresholds
   */
  private evaluateMetric(
    value: number | null,
    thresholds: { good: number; poor: number }
  ): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }
  
  /**
   * Validate Web Vitals metrics
   */
  validateMetrics(metrics: WebVitalsMetrics): WebVitalsTestResult {
    const failures: string[] = [];
    const warnings: string[] = [];
    
    // Evaluate each metric
    const evaluations = {
      fcp: this.evaluateMetric(metrics.fcp, THRESHOLDS.fcp),
      lcp: this.evaluateMetric(metrics.lcp, THRESHOLDS.lcp),
      fid: this.evaluateMetric(metrics.fid, THRESHOLDS.fid),
      cls: this.evaluateMetric(metrics.cls, THRESHOLDS.cls),
      ttfb: this.evaluateMetric(metrics.ttfb, THRESHOLDS.ttfb),
      inp: this.evaluateMetric(metrics.inp, THRESHOLDS.inp),
    };
    
    // Check for failures (poor metrics)
    for (const [metric, evaluation] of Object.entries(evaluations)) {
      const value = metrics[metric as keyof WebVitalsMetrics];
      
      if (evaluation === 'poor') {
        failures.push(
          `${metric.toUpperCase()}: ${value?.toFixed(2)} (threshold: ${THRESHOLDS[metric as keyof WebVitalsThresholds].poor})`
        );
      } else if (evaluation === 'needs-improvement') {
        warnings.push(
          `${metric.toUpperCase()}: ${value?.toFixed(2)} (good: ${THRESHOLDS[metric as keyof WebVitalsThresholds].good})`
        );
      }
    }
    
    // Calculate overall grade
    const grades = Object.values(evaluations).filter(e => e !== 'unknown');
    const poorCount = grades.filter(g => g === 'poor').length;
    const needsImprovementCount = grades.filter(g => g === 'needs-improvement').length;
    
    let grade: 'good' | 'needs-improvement' | 'poor';
    if (poorCount > 0) {
      grade = 'poor';
    } else if (needsImprovementCount > 0) {
      grade = 'needs-improvement';
    } else {
      grade = 'good';
    }
    
    return {
      url: metrics.url,
      metrics,
      passed: failures.length === 0,
      failures,
      warnings,
      grade,
    };
  }
  
  /**
   * Test multiple URLs
   */
  async testUrls(urls: string[]): Promise<WebVitalsTestResult[]> {
    const results: WebVitalsTestResult[] = [];
    
    for (const url of urls) {
      console.log(`\n📊 Testing ${url}...`);
      
      const metrics = await this.measureWebVitals(url);
      const result = this.validateMetrics(metrics);
      
      results.push(result);
      
      // Print immediate feedback
      const gradeEmoji = result.grade === 'good' ? '✅' : result.grade === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`${gradeEmoji} Grade: ${result.grade.toUpperCase()}`);
      
      if (result.failures.length > 0) {
        console.log('  Failures:');
        result.failures.forEach(f => console.log(`    - ${f}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('  Warnings:');
        result.warnings.forEach(w => console.log(`    - ${w}`));
      }
    }
    
    return results;
  }
  
  /**
   * Generate summary report
   */
  generateReport(results: WebVitalsTestResult[]): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(70));
    lines.push('WEB VITALS E2E TEST REPORT');
    lines.push('='.repeat(70));
    lines.push('');
    
    // Overall summary
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    lines.push(`📊 Overall: ${passed}/${total} URLs passed`);
    lines.push('');
    
    // Detailed results
    for (const result of results) {
      const gradeEmoji = result.grade === 'good' ? '✅' : result.grade === 'needs-improvement' ? '⚠️' : '❌';
      
      lines.push(`${gradeEmoji} ${result.url}`);
      lines.push(`   Grade: ${result.grade.toUpperCase()}`);
      lines.push('   Metrics:');
      lines.push(`     FCP: ${result.metrics.fcp?.toFixed(2) || 'N/A'} ms`);
      lines.push(`     LCP: ${result.metrics.lcp?.toFixed(2) || 'N/A'} ms`);
      lines.push(`     FID: ${result.metrics.fid?.toFixed(2) || 'N/A'} ms`);
      lines.push(`     CLS: ${result.metrics.cls?.toFixed(3) || 'N/A'}`);
      lines.push(`     TTFB: ${result.metrics.ttfb?.toFixed(2) || 'N/A'} ms`);
      
      if (result.failures.length > 0) {
        lines.push('   Failures:');
        result.failures.forEach(f => lines.push(`     - ${f}`));
      }
      
      if (result.warnings.length > 0) {
        lines.push('   Warnings:');
        result.warnings.forEach(w => lines.push(`     - ${w}`));
      }
      
      lines.push('');
    }
    
    lines.push('='.repeat(70));
    
    return lines.join('\n');
  }
  
  /**
   * Run E2E tests
   */
  async run(urls: string[]): Promise<void> {
    await this.init();
    
    try {
      const results = await this.testUrls(urls);
      const report = this.generateReport(results);
      
      console.log('\n' + report);
      
      // Exit with error if any tests failed
      const failed = results.filter(r => !r.passed).length;
      if (failed > 0) {
        console.error(`\n❌ ${failed} URL(s) failed Web Vitals tests`);
        process.exit(1);
      }
      
      console.log('\n✅ All Web Vitals tests passed!');
    } finally {
      await this.close();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  const urls = [
    `${baseUrl}`,
    `${baseUrl}/dashboard`,
    `${baseUrl}/integrations`,
    `${baseUrl}/analytics`,
    `${baseUrl}/content`,
  ];
  
  const tester = new WebVitalsE2ETester(baseUrl);
  tester.run(urls).catch((error) => {
    console.error('Error running Web Vitals E2E tests:', error);
    process.exit(1);
  });
}

export { WebVitalsE2ETester, WebVitalsMetrics, WebVitalsTestResult };
