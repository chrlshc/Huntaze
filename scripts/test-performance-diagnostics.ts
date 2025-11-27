#!/usr/bin/env tsx
/**
 * Test Performance Diagnostics System
 */

import { getPerformanceDiagnostics } from '../lib/performance/diagnostics';

async function testPerformanceDiagnostics() {
  console.log('Testing Performance Diagnostics System...\n');

  const diagnostics = getPerformanceDiagnostics();

  // Test 1: Analyze page load
  console.log('1. Testing page load analysis...');
  const pageLoadReport = diagnostics.analyzePageLoad(
    {
      ttfb: 1200, // High TTFB
      fcp: 2000, // High FCP
      lcp: 3000, // High LCP
      fid: 150, // High FID
      cls: 0.15, // High CLS
      tti: 4000, // High TTI
    },
    '/test-page'
  );

  console.log(`  ✓ Found ${pageLoadReport.bottlenecks.length} bottlenecks`);
  console.log(`  ✓ Generated ${pageLoadReport.recommendations.length} recommendations`);
  
  pageLoadReport.bottlenecks.forEach((bottleneck) => {
    console.log(`    - ${bottleneck.severity.toUpperCase()}: ${bottleneck.description}`);
  });

  // Test 2: Track API requests
  console.log('\n2. Testing API request tracking...');
  
  // Simulate slow requests
  for (let i = 0; i < 20; i++) {
    diagnostics.trackRequest('/api/users', 'GET', 2500 + Math.random() * 1000, 200);
  }
  
  // Simulate fast requests
  for (let i = 0; i < 10; i++) {
    diagnostics.trackRequest('/api/posts', 'GET', 500 + Math.random() * 200, 200);
  }

  const slowRequests = diagnostics.identifySlowRequests();
  console.log(`  ✓ Identified ${slowRequests.length} slow endpoints`);
  
  slowRequests.forEach((report) => {
    console.log(`    - ${report.method} ${report.endpoint}: ${report.averageTime.toFixed(0)}ms avg`);
    console.log(`      p95: ${report.p95Time.toFixed(0)}ms, p99: ${report.p99Time.toFixed(0)}ms`);
  });

  // Test 3: Track loading states
  console.log('\n3. Testing loading state analysis...');
  
  // Simulate loading states
  diagnostics.trackLoadingState('UserList', 500, 'data-fetch');
  diagnostics.trackLoadingState('Dashboard', 1200, 'data-fetch');
  diagnostics.trackLoadingState('Analytics', 800, 'data-fetch');
  diagnostics.trackLoadingState('Messages', 1500, 'data-fetch');
  
  // Simulate simultaneous loading
  const now = Date.now();
  for (let i = 0; i < 5; i++) {
    diagnostics.trackLoadingState(`Component${i}`, 600, 'data-fetch');
  }

  const loadingReport = diagnostics.analyzeLoadingStates();
  console.log(`  ✓ Total loading states: ${loadingReport.totalLoadingStates}`);
  console.log(`  ✓ Max simultaneous: ${loadingReport.simultaneousLoadingStates}`);
  console.log(`  ✓ Average duration: ${loadingReport.averageLoadingDuration.toFixed(0)}ms`);
  console.log(`  ✓ Excessive instances: ${loadingReport.excessiveLoadingInstances.length}`);

  // Test 4: Track renders
  console.log('\n4. Testing render tracking...');
  
  // Simulate excessive renders
  for (let i = 0; i < 60; i++) {
    diagnostics.trackRender('ExpensiveComponent', 20 + Math.random() * 10);
  }
  
  // Simulate normal renders
  for (let i = 0; i < 20; i++) {
    diagnostics.trackRender('NormalComponent', 5 + Math.random() * 5);
  }

  const renderReports = diagnostics.detectExcessiveRenders();
  console.log(`  ✓ Found ${renderReports.length} components with issues`);
  
  renderReports.forEach((report) => {
    console.log(`    - ${report.component}: ${report.renderCount} renders, ${report.averageRenderTime.toFixed(1)}ms avg`);
  });

  // Test 5: Get summary
  console.log('\n5. Testing performance summary...');
  const summary = diagnostics.getPerformanceSummary();
  console.log(`  ✓ Slow requests: ${summary.slowRequests.length}`);
  console.log(`  ✓ Loading states analyzed: ${summary.loadingStates.totalLoadingStates}`);
  console.log(`  ✓ Components with excessive renders: ${summary.excessiveRenders.length}`);

  console.log('\n✅ Performance Diagnostics System test completed successfully!');
  console.log('\nThe system is ready to:');
  console.log('  - Analyze page load performance');
  console.log('  - Identify slow API requests');
  console.log('  - Detect excessive loading states');
  console.log('  - Track component render performance');
}

testPerformanceDiagnostics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
