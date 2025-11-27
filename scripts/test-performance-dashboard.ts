#!/usr/bin/env tsx

/**
 * Integration test script for Performance Dashboard
 * Tests the complete dashboard functionality including CloudWatch integration
 */

import { getDashboardService } from '../lib/monitoring/dashboard-service';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'Test passed',
      duration: Date.now() - startTime
    });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  console.log('🧪 Testing Performance Dashboard Integration\n');

  const dashboardService = getDashboardService();

  // Test 1: Fetch current metrics
  await runTest('Fetch current metrics', async () => {
    const metrics = await dashboardService.getCurrentMetrics();
    
    if (typeof metrics.lcp !== 'number') throw new Error('LCP is not a number');
    if (typeof metrics.fid !== 'number') throw new Error('FID is not a number');
    if (typeof metrics.cls !== 'number') throw new Error('CLS is not a number');
    if (typeof metrics.ttfb !== 'number') throw new Error('TTFB is not a number');
    
    console.log('  Metrics:', {
      lcp: `${metrics.lcp.toFixed(0)}ms`,
      fid: `${metrics.fid.toFixed(0)}ms`,
      cls: metrics.cls.toFixed(3),
      ttfb: `${metrics.ttfb.toFixed(0)}ms`
    });
  });

  // Test 2: Fetch active alerts
  await runTest('Fetch active alerts', async () => {
    const alerts = await dashboardService.getActiveAlerts();
    
    if (!Array.isArray(alerts)) throw new Error('Alerts is not an array');
    
    console.log(`  Found ${alerts.length} active alerts`);
    
    alerts.forEach(alert => {
      if (!alert.id) throw new Error('Alert missing id');
      if (!alert.metric) throw new Error('Alert missing metric');
      if (typeof alert.value !== 'number') throw new Error('Alert value is not a number');
      if (typeof alert.threshold !== 'number') throw new Error('Alert threshold is not a number');
      if (!alert.timestamp) throw new Error('Alert missing timestamp');
      if (!['warning', 'critical'].includes(alert.severity)) {
        throw new Error(`Invalid alert severity: ${alert.severity}`);
      }
    });
  });

  // Test 3: Fetch historical data
  await runTest('Fetch historical data (24 hours)', async () => {
    const historical = await dashboardService.getHistoricalData(24);
    
    if (!Array.isArray(historical)) throw new Error('Historical data is not an array');
    
    console.log(`  Found ${historical.length} historical data points`);
    
    // Verify data structure
    historical.forEach((point, index) => {
      if (!(point.timestamp instanceof Date)) {
        throw new Error(`Point ${index} has invalid timestamp`);
      }
      if (typeof point.lcp !== 'number') throw new Error(`Point ${index} LCP is not a number`);
      if (typeof point.fid !== 'number') throw new Error(`Point ${index} FID is not a number`);
      if (typeof point.cls !== 'number') throw new Error(`Point ${index} CLS is not a number`);
      if (typeof point.ttfb !== 'number') throw new Error(`Point ${index} TTFB is not a number`);
    });
    
    // Verify ordering
    for (let i = 1; i < historical.length; i++) {
      if (historical[i].timestamp.getTime() < historical[i - 1].timestamp.getTime()) {
        throw new Error('Historical data is not ordered by timestamp');
      }
    }
  });

  // Test 4: Get complete dashboard data
  await runTest('Get complete dashboard data', async () => {
    const dashboardData = await dashboardService.getDashboardData();
    
    // Verify structure
    if (!dashboardData.metrics) throw new Error('Missing metrics');
    if (!dashboardData.alerts) throw new Error('Missing alerts');
    if (!dashboardData.historical) throw new Error('Missing historical data');
    if (!dashboardData.grade) throw new Error('Missing grade');
    
    // Verify grade is valid
    if (!['A', 'B', 'C', 'D', 'F'].includes(dashboardData.grade)) {
      throw new Error(`Invalid grade: ${dashboardData.grade}`);
    }
    
    console.log('  Dashboard Data:', {
      grade: dashboardData.grade,
      metricsCount: Object.keys(dashboardData.metrics).length,
      alertsCount: dashboardData.alerts.length,
      historicalCount: dashboardData.historical.length
    });
  });

  // Test 5: Test API endpoint
  await runTest('Test dashboard API endpoint', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/performance/dashboard`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.metrics) throw new Error('API response missing metrics');
    if (!data.grade) throw new Error('API response missing grade');
    
    console.log('  API Response:', {
      grade: data.grade,
      status: response.status
    });
  });

  // Test 6: Test performance summary endpoint integration
  await runTest('Test performance summary endpoint', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/performance/summary`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Should have either CloudWatch or local metrics
    if (typeof data.lcp !== 'number') throw new Error('Missing LCP metric');
    if (typeof data.fid !== 'number') throw new Error('Missing FID metric');
    if (typeof data.cls !== 'number') throw new Error('Missing CLS metric');
    if (typeof data.ttfb !== 'number') throw new Error('Missing TTFB metric');
    
    console.log('  Summary Data:', {
      source: data.source,
      grade: data.grade,
      alertsCount: data.alerts?.length || 0
    });
  });

  // Print summary
  console.log('\n📊 Test Summary\n');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`Total duration: ${totalDuration}ms`);
  
  if (results.some(r => !r.passed)) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
