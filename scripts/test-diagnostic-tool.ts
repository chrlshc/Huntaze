#!/usr/bin/env tsx
/**
 * Test script for the performance diagnostic tool
 */

import { performanceDiagnostic } from '../lib/diagnostics';

async function simulateSlowQuery() {
  // Simulate a slow database query
  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function simulateFastQuery() {
  // Simulate a fast database query
  await new Promise((resolve) => setTimeout(resolve, 20));
}

async function simulateAPICall(endpoint: string) {
  // Simulate an API call
  await new Promise((resolve) => setTimeout(resolve, 50));
}

async function testDiagnosticTool() {
  console.log('Starting performance diagnostic test...\n');

  // Start diagnostic
  performanceDiagnostic.start();

  // Simulate page load
  performanceDiagnostic.setCurrentPage('/dashboard');

  // Simulate multiple queries
  console.log('Simulating database queries...');
  await simulateSlowQuery();
  await simulateFastQuery();
  await simulateFastQuery();
  await simulateSlowQuery();

  // Simulate duplicate API calls
  console.log('Simulating API calls...');
  await simulateAPICall('/api/content');
  await simulateAPICall('/api/content'); // Duplicate
  await simulateAPICall('/api/stats');
  await simulateAPICall('/api/content'); // Duplicate

  // Simulate another page
  performanceDiagnostic.setCurrentPage('/analytics');
  await simulateAPICall('/api/analytics');
  await simulateAPICall('/api/content'); // Duplicate across pages

  // Stop and generate report
  console.log('\nGenerating diagnostic report...\n');
  const report = performanceDiagnostic.stop();

  // Display report
  console.log(performanceDiagnostic.formatReport(report));

  // Display raw metrics
  console.log('\n=== RAW METRICS ===\n');
  console.log('Database Queries:', report.rawMetrics.database.totalQueries);
  console.log(
    'Avg Query Time:',
    report.rawMetrics.database.avgDuration.toFixed(2),
    'ms'
  );
  console.log('Total Renders:', report.rawMetrics.rendering.totalRenders);
  console.log('Total Requests:', report.rawMetrics.requests.totalRequests);
  console.log(
    'Unique Endpoints:',
    report.rawMetrics.requests.uniqueEndpoints
  );
  console.log(
    'Duplicate Requests:',
    report.rawMetrics.requests.duplicateRequests.length
  );
  console.log(
    'Monitoring Overhead:',
    report.rawMetrics.monitoring.avgOverheadPerRequest.toFixed(2),
    'ms'
  );

  console.log('\n✅ Diagnostic tool test completed!');
}

// Run test
testDiagnosticTool().catch(console.error);
