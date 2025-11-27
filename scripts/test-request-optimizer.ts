/**
 * Test script for Request Optimizer
 * Tests deduplication, batching, debouncing, and retry logic
 */

import { requestOptimizer } from '../lib/optimization/request-optimizer';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Request Deduplication
async function testDeduplication() {
  log('\n📝 Test 1: Request Deduplication', 'blue');
  
  let callCount = 0;
  const fetcher = async () => {
    callCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: 'test', callCount };
  };

  // Make 3 identical requests simultaneously
  const [result1, result2, result3] = await Promise.all([
    requestOptimizer.deduplicate('test-key', fetcher),
    requestOptimizer.deduplicate('test-key', fetcher),
    requestOptimizer.deduplicate('test-key', fetcher),
  ]);

  if (callCount === 1) {
    log('✅ Deduplication works: Only 1 call made for 3 requests', 'green');
  } else {
    log(`❌ Deduplication failed: ${callCount} calls made instead of 1`, 'red');
  }

  return callCount === 1;
}

// Test 2: Request Batching
async function testBatching() {
  log('\n📝 Test 2: Request Batching', 'blue');
  
  const requests = [
    { id: '1', query: 'query1' },
    { id: '2', query: 'query2' },
    { id: '3', query: 'query3' },
  ];

  try {
    const results = await requestOptimizer.batch(requests);
    
    if (results.length === 3) {
      log('✅ Batching works: All 3 requests processed', 'green');
      return true;
    } else {
      log(`❌ Batching failed: Expected 3 results, got ${results.length}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Batching error: ${error}`, 'red');
    return false;
  }
}

// Test 3: Request Debouncing
async function testDebouncing() {
  log('\n📝 Test 3: Request Debouncing', 'blue');
  
  let callCount = 0;
  const fn = async () => {
    callCount++;
    return { callCount };
  };

  // Make rapid calls
  requestOptimizer.debounce('debounce-key', fn, 100);
  requestOptimizer.debounce('debounce-key', fn, 100);
  const result = await requestOptimizer.debounce('debounce-key', fn, 100);

  // Wait for debounce to complete
  await new Promise(resolve => setTimeout(resolve, 150));

  if (callCount === 1) {
    log('✅ Debouncing works: Only 1 call made for 3 rapid requests', 'green');
  } else {
    log(`❌ Debouncing failed: ${callCount} calls made instead of 1`, 'red');
  }

  return callCount === 1;
}

// Test 4: Exponential Backoff Retry
async function testRetryWithBackoff() {
  log('\n📝 Test 4: Exponential Backoff Retry', 'blue');
  
  let attemptCount = 0;
  const failingFn = async () => {
    attemptCount++;
    if (attemptCount < 3) {
      throw new Error('Temporary failure');
    }
    return { success: true, attempts: attemptCount };
  };

  try {
    const result = await requestOptimizer.retryWithBackoff(failingFn, {
      maxRetries: 3,
      initialDelay: 50,
      backoffMultiplier: 2,
    });

    if (attemptCount === 3 && result.success) {
      log('✅ Retry with backoff works: Succeeded after 3 attempts', 'green');
      return true;
    } else {
      log(`❌ Retry failed: Unexpected result`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Retry error: ${error}`, 'red');
    return false;
  }
}

// Test 5: Stats
async function testStats() {
  log('\n📝 Test 5: Statistics', 'blue');
  
  requestOptimizer.clear();
  
  // Create some pending operations
  const fetcher = () => new Promise(resolve => setTimeout(() => resolve('done'), 1000));
  requestOptimizer.deduplicate('stat-test-1', fetcher);
  requestOptimizer.deduplicate('stat-test-2', fetcher);

  const stats = requestOptimizer.getStats();
  
  log(`   Pending requests: ${stats.pendingRequests}`, 'yellow');
  log(`   Queued batch requests: ${stats.queuedBatchRequests}`, 'yellow');
  log(`   Active debounces: ${stats.activeDebounces}`, 'yellow');

  if (stats.pendingRequests === 2) {
    log('✅ Stats tracking works correctly', 'green');
    return true;
  } else {
    log('❌ Stats tracking failed', 'red');
    return false;
  }
}

// Run all tests
async function runTests() {
  log('\n🚀 Starting Request Optimizer Tests\n', 'blue');
  
  const results = {
    deduplication: await testDeduplication(),
    batching: await testBatching(),
    debouncing: await testDebouncing(),
    retry: await testRetryWithBackoff(),
    stats: await testStats(),
  };

  // Summary
  log('\n📊 Test Summary', 'blue');
  log('═══════════════════════════════════', 'blue');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([name, passed]) => {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${status} ${name}`, color);
  });
  
  log('\n═══════════════════════════════════', 'blue');
  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'green' : 'red');
  
  // Cleanup
  requestOptimizer.clear();
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error}`, 'red');
  process.exit(1);
});
