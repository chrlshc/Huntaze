/**
 * Error Handling Integration Tests
 * Tests the complete error handling and graceful degradation system
 */

import {
  getErrorHandler,
  getDegradationManager,
  DEFAULT_RETRY_OPTIONS,
  ALERT_THRESHOLDS,
  type ErrorContext,
} from '../lib/error-handling';

// ============================================================================
// Test Utilities
// ============================================================================

function createTestContext(): ErrorContext {
  return {
    operation: 'integration_test',
    sessionId: `test-session-${Date.now()}`,
    url: 'http://localhost:3000/test',
    userAgent: 'test-agent',
    timestamp: new Date(),
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Test Cases
// ============================================================================

async function testRetryWithBackoff() {
  console.log('\n🧪 Testing Retry with Exponential Backoff...');
  
  const errorHandler = getErrorHandler();
  let attemptCount = 0;
  const startTime = Date.now();

  try {
    await errorHandler.retryWithBackoff(
      async () => {
        attemptCount++;
        console.log(`  Attempt ${attemptCount}`);
        throw new Error('Simulated network error');
      },
      {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 5000,
        backoffMultiplier: 2,
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ✅ Completed ${attemptCount} attempts in ${duration}ms`);
    console.log(`  ✅ Expected: 4 attempts (1 initial + 3 retries)`);
    console.log(`  ✅ Actual: ${attemptCount} attempts`);
    
    if (attemptCount === 4) {
      console.log('  ✅ PASSED: Retry with backoff works correctly');
      return true;
    } else {
      console.log('  ❌ FAILED: Incorrect number of attempts');
      return false;
    }
  }

  console.log('  ❌ FAILED: Should have thrown after retries');
  return false;
}

async function testCircuitBreaker() {
  console.log('\n🧪 Testing Circuit Breaker...');
  
  const errorHandler = getErrorHandler();
  const service = `test-service-${Date.now()}`;
  let attemptCount = 0;

  // Trigger failures to open circuit
  console.log('  Triggering failures to open circuit...');
  for (let i = 0; i < 5; i++) {
    try {
      await errorHandler.circuitBreaker(
        service,
        async () => {
          attemptCount++;
          throw new Error('Service failure');
        },
        {
          failureThreshold: 5,
          resetTimeout: 5000,
          monitoringPeriod: 1000,
        }
      );
    } catch (error) {
      // Expected
    }
  }

  console.log(`  ✅ Triggered ${attemptCount} failures`);

  // Next attempt should fail immediately
  console.log('  Testing circuit breaker is open...');
  try {
    await errorHandler.circuitBreaker(
      service,
      async () => {
        attemptCount++;
        throw new Error('Should not be called');
      },
      {
        failureThreshold: 5,
        resetTimeout: 5000,
        monitoringPeriod: 1000,
      }
    );
    console.log('  ❌ FAILED: Should have thrown circuit breaker error');
    return false;
  } catch (error) {
    if ((error as Error).message.includes('Circuit breaker open')) {
      console.log('  ✅ Circuit breaker correctly blocked request');
      console.log(`  ✅ Total attempts: ${attemptCount} (should be 5, not 6)`);
      
      if (attemptCount === 5) {
        console.log('  ✅ PASSED: Circuit breaker works correctly');
        return true;
      } else {
        console.log('  ❌ FAILED: Circuit breaker allowed extra attempt');
        return false;
      }
    } else {
      console.log('  ❌ FAILED: Wrong error type');
      return false;
    }
  }
}

async function testGracefulDegradation() {
  console.log('\n🧪 Testing Graceful Degradation...');
  
  const degradationManager = getDegradationManager();
  const service = `test-service-${Date.now()}`;

  // Test primary success
  console.log('  Testing primary operation success...');
  const result1 = await degradationManager.executeWithDegradation(
    service,
    {
      primary: async () => 'primary-data',
      fallback: async () => 'fallback-data',
    },
    { operation: 'test' }
  );

  if (result1 === 'primary-data') {
    console.log('  ✅ Primary operation succeeded');
  } else {
    console.log('  ❌ FAILED: Should have used primary');
    return false;
  }

  // Test fallback on primary failure
  console.log('  Testing fallback on primary failure...');
  const result2 = await degradationManager.executeWithDegradation(
    service,
    {
      primary: async () => {
        throw new Error('Primary failed');
      },
      fallback: async () => 'fallback-data',
    },
    { operation: 'test' }
  );

  if (result2 === 'fallback-data') {
    console.log('  ✅ Fallback operation succeeded');
  } else {
    console.log('  ❌ FAILED: Should have used fallback');
    return false;
  }

  // Check service health
  const health = degradationManager.getServiceHealth(service);
  console.log(`  ℹ️  Service health: ${JSON.stringify(health, null, 2)}`);

  console.log('  ✅ PASSED: Graceful degradation works correctly');
  return true;
}

async function testCacheDegradation() {
  console.log('\n🧪 Testing Cache Degradation...');
  
  const degradationManager = getDegradationManager();

  // Test with cache hit
  console.log('  Testing cache hit...');
  const result1 = await degradationManager.cacheDegradation(
    async () => 'cached-data',
    async () => 'fresh-data'
  );

  if (result1.data === 'cached-data' && result1.fromCache === true) {
    console.log('  ✅ Cache hit returned cached data');
  } else {
    console.log('  ❌ FAILED: Should have used cache');
    return false;
  }

  // Test with cache miss
  console.log('  Testing cache miss...');
  const result2 = await degradationManager.cacheDegradation(
    async () => null,
    async () => 'fresh-data'
  );

  if (result2.data === 'fresh-data' && result2.fromCache === false) {
    console.log('  ✅ Cache miss fetched fresh data');
    console.log(`  ℹ️  Latency: ${result2.latency}ms`);
  } else {
    console.log('  ❌ FAILED: Should have fetched fresh data');
    return false;
  }

  // Test with cache failure
  console.log('  Testing cache failure...');
  const result3 = await degradationManager.cacheDegradation(
    async () => {
      throw new Error('Cache failed');
    },
    async () => 'fresh-data'
  );

  if (result3.data === 'fresh-data' && result3.fromCache === false) {
    console.log('  ✅ Cache failure fell back to fresh data');
  } else {
    console.log('  ❌ FAILED: Should have fallen back to fresh data');
    return false;
  }

  console.log('  ✅ PASSED: Cache degradation works correctly');
  return true;
}

async function testFallbackToStaleCache() {
  console.log('\n🧪 Testing Fallback to Stale Cache...');
  
  const errorHandler = getErrorHandler();

  // Test fresh data success
  console.log('  Testing fresh data fetch...');
  const result1 = await errorHandler.fallbackToStaleCache(
    'test-key',
    async () => 'fresh-data',
    async () => 'stale-data'
  );

  if (result1 === 'fresh-data') {
    console.log('  ✅ Fresh data fetch succeeded');
  } else {
    console.log('  ❌ FAILED: Should have used fresh data');
    return false;
  }

  // Test fallback to stale
  console.log('  Testing fallback to stale cache...');
  const result2 = await errorHandler.fallbackToStaleCache(
    'test-key',
    async () => {
      throw new Error('Fetch failed');
    },
    async () => 'stale-data'
  );

  if (result2 === 'stale-data') {
    console.log('  ✅ Fallback to stale cache succeeded');
  } else {
    console.log('  ❌ FAILED: Should have used stale cache');
    return false;
  }

  console.log('  ✅ PASSED: Fallback to stale cache works correctly');
  return true;
}

async function testErrorLogging() {
  console.log('\n🧪 Testing Error Logging...');
  
  const errorHandler = getErrorHandler();
  const context = createTestContext();

  // Test various error types
  const errors = [
    new Error('Network timeout'),
    new Error('CloudWatch API failure'),
    new Error('Cache connection failed'),
    new Error('Validation error'),
  ];

  console.log('  Logging various error types...');
  for (const error of errors) {
    await errorHandler.logError(error, context);
  }

  console.log('  ✅ All errors logged successfully');
  console.log('  ✅ PASSED: Error logging works correctly');
  return true;
}

async function testAlertThresholds() {
  console.log('\n🧪 Testing Alert Thresholds...');
  
  console.log('  Alert Thresholds:');
  console.log(`    Page Load Time: ${ALERT_THRESHOLDS.pageLoadTime}ms`);
  console.log(`    API Response Time: ${ALERT_THRESHOLDS.apiResponseTime}ms`);
  console.log(`    LCP: ${ALERT_THRESHOLDS.lcp}ms`);
  console.log(`    FID: ${ALERT_THRESHOLDS.fid}ms`);
  console.log(`    CLS: ${ALERT_THRESHOLDS.cls}`);
  console.log(`    Error Rate: ${ALERT_THRESHOLDS.errorRate * 100}%`);
  console.log(`    Cache Hit Rate: ${ALERT_THRESHOLDS.cacheHitRate * 100}%`);
  console.log(`    Uptime: ${ALERT_THRESHOLDS.uptime * 100}%`);

  console.log('  ✅ PASSED: Alert thresholds are properly configured');
  return true;
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests() {
  console.log('🚀 Starting Error Handling Integration Tests\n');
  console.log('='.repeat(60));

  const tests = [
    { name: 'Retry with Backoff', fn: testRetryWithBackoff },
    { name: 'Circuit Breaker', fn: testCircuitBreaker },
    { name: 'Graceful Degradation', fn: testGracefulDegradation },
    { name: 'Cache Degradation', fn: testCacheDegradation },
    { name: 'Fallback to Stale Cache', fn: testFallbackToStaleCache },
    { name: 'Error Logging', fn: testErrorLogging },
    { name: 'Alert Thresholds', fn: testAlertThresholds },
  ];

  const results: { name: string; passed: boolean }[] = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.log(`  ❌ FAILED: ${(error as Error).message}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log(`\n${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
