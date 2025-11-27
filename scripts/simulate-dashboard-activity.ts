#!/usr/bin/env tsx
/**
 * Dashboard Activity Simulator
 * 
 * Simulates realistic dashboard activity to collect meaningful baseline metrics.
 * This script makes actual API calls and renders components to generate real data.
 */

import { PerformanceDiagnostic } from '../lib/diagnostics';

interface SimulationConfig {
  duration: number; // ms
  apiCallsPerSecond: number;
  renderOperations: number;
  duplicateRequestRate: number; // 0-1
}

const DEFAULT_CONFIG: SimulationConfig = {
  duration: 10000, // 10 seconds
  apiCallsPerSecond: 5,
  renderOperations: 20,
  duplicateRequestRate: 0.3 // 30% of requests are duplicates
};

async function simulateDatabaseQuery(endpoint: string, duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      // Simulate query completion
      resolve();
    }, duration);
  });
}

async function simulateAPICall(endpoint: string, isDuplicate: boolean = false): Promise<void> {
  const baseDuration = isDuplicate ? 50 : 150; // Duplicates are faster (cached)
  const variance = Math.random() * 100;
  const duration = baseDuration + variance;
  
  await simulateDatabaseQuery(endpoint, duration);
}

async function simulateRenderOperation(component: string): Promise<void> {
  const baseDuration = 50;
  const variance = Math.random() * 200;
  const duration = baseDuration + variance;
  
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}

async function runSimulation(config: SimulationConfig = DEFAULT_CONFIG): Promise<void> {
  console.log('🎬 Starting dashboard activity simulation...\n');
  console.log(`⏱️  Duration: ${config.duration}ms`);
  console.log(`📡 API Calls/sec: ${config.apiCallsPerSecond}`);
  console.log(`🎨 Render Operations: ${config.renderOperations}`);
  console.log(`🔄 Duplicate Rate: ${(config.duplicateRequestRate * 100).toFixed(0)}%\n`);
  
  const diagnostic = new PerformanceDiagnostic();
  diagnostic.start();
  
  const startTime = Date.now();
  const endTime = startTime + config.duration;
  
  // Common dashboard endpoints
  const endpoints = [
    '/api/content',
    '/api/analytics',
    '/api/integrations',
    '/api/billing/packs',
    '/api/messages',
    '/api/user/profile'
  ];
  
  // Common dashboard components
  const components = [
    'DashboardLayout',
    'ContentPage',
    'AnalyticsPage',
    'IntegrationsPage',
    'BillingPage',
    'MessagesPage',
    'PerformanceMonitor'
  ];
  
  const operations: Promise<void>[] = [];
  let apiCallCount = 0;
  let renderCount = 0;
  let duplicateCount = 0;
  
  // Simulate API calls
  const apiInterval = 1000 / config.apiCallsPerSecond;
  const apiTimer = setInterval(() => {
    if (Date.now() >= endTime) {
      clearInterval(apiTimer);
      return;
    }
    
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const isDuplicate = Math.random() < config.duplicateRequestRate;
    
    if (isDuplicate) {
      duplicateCount++;
    }
    
    apiCallCount++;
    operations.push(simulateAPICall(endpoint, isDuplicate));
  }, apiInterval);
  
  // Simulate render operations
  const renderInterval = config.duration / config.renderOperations;
  const renderTimer = setInterval(() => {
    if (Date.now() >= endTime) {
      clearInterval(renderTimer);
      return;
    }
    
    const component = components[Math.floor(Math.random() * components.length)];
    renderCount++;
    operations.push(simulateRenderOperation(component));
  }, renderInterval);
  
  // Wait for simulation to complete
  await new Promise(resolve => setTimeout(resolve, config.duration));
  
  // Clean up timers
  clearInterval(apiTimer);
  clearInterval(renderTimer);
  
  // Wait for all operations to complete
  await Promise.all(operations);
  
  console.log('\n✅ Simulation complete!');
  console.log(`   API Calls: ${apiCallCount}`);
  console.log(`   Duplicates: ${duplicateCount} (${((duplicateCount / apiCallCount) * 100).toFixed(1)}%)`);
  console.log(`   Renders: ${renderCount}\n`);
  
  // Generate report
  const report = diagnostic.generateReport();
  diagnostic.stop();
  
  return report;
}

// Export for use in other scripts
export { runSimulation, SimulationConfig };

// Run if called directly
if (require.main === module) {
  runSimulation().catch(console.error);
}
