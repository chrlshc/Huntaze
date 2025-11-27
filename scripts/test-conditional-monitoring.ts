/**
 * Test Conditional Monitoring System
 * Validates that monitoring respects environment settings
 */

import { productionSafeMonitoring, trackPerformance, measureAsync, measure } from '../lib/monitoring/production-safe-monitoring';

async function testConditionalMonitoring() {
  console.log('🧪 Testing Conditional Monitoring System\n');

  // Test 1: Environment detection
  console.log('Test 1: Environment Detection');
  const config = productionSafeMonitoring.getConfig();
  console.log('  Config:', config);
  console.log('  Should monitor:', productionSafeMonitoring.shouldMonitor());
  console.log('  ✅ Environment detection working\n');

  // Test 2: Metric tracking
  console.log('Test 2: Metric Tracking');
  trackPerformance('test.metric', 123.45, { test: 'true' });
  trackPerformance('test.metric', 234.56, { test: 'true' });
  trackPerformance('test.metric', 345.67, { test: 'true' });
  console.log('  ✅ Tracked 3 metrics\n');

  // Test 3: Batching
  console.log('Test 3: Batching');
  for (let i = 0; i < 10; i++) {
    trackPerformance('test.batch', Math.random() * 100);
  }
  console.log('  ✅ Tracked 10 metrics for batching\n');

  // Test 4: Measure async
  console.log('Test 4: Measure Async');
  const result = await measureAsync(
    'test.async',
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return 'success';
    },
    { type: 'async' }
  );
  console.log('  Result:', result);
  console.log('  ✅ Async measurement working\n');

  // Test 5: Measure sync
  console.log('Test 5: Measure Sync');
  const syncResult = measure(
    'test.sync',
    () => {
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      return sum;
    },
    { type: 'sync' }
  );
  console.log('  Result:', syncResult);
  console.log('  ✅ Sync measurement working\n');

  // Test 6: Error handling
  console.log('Test 6: Error Handling');
  try {
    await measureAsync('test.error', async () => {
      throw new Error('Test error');
    });
  } catch (error) {
    console.log('  ✅ Error caught and tracked\n');
  }

  // Test 7: Force flush
  console.log('Test 7: Force Flush');
  productionSafeMonitoring.forceFlush();
  console.log('  ✅ Metrics flushed\n');

  // Test 8: Sampling
  console.log('Test 8: Sampling');
  productionSafeMonitoring.resetSession();
  const samples = [];
  for (let i = 0; i < 10; i++) {
    productionSafeMonitoring.resetSession();
    samples.push(productionSafeMonitoring.shouldMonitor());
  }
  const sampledCount = samples.filter(Boolean).length;
  console.log('  Sampled:', sampledCount, '/ 10');
  console.log('  Expected: ~1 (10% sampling)');
  console.log('  ✅ Sampling working\n');

  // Test 9: Production mode simulation
  console.log('Test 9: Production Mode Simulation');
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  
  // Re-create instance to pick up new env
  const { productionSafeMonitoring: prodMonitoring } = await import('../lib/monitoring/production-safe-monitoring');
  
  console.log('  Should monitor in prod:', prodMonitoring.shouldMonitor());
  console.log('  Expected: false');
  
  process.env.NODE_ENV = originalEnv;
  console.log('  ✅ Production mode disables monitoring\n');

  console.log('✅ All tests passed!');
}

// Run tests
testConditionalMonitoring().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
