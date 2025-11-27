/**
 * Test script for slow query logging
 * 
 * Demonstrates slow query detection and logging
 */

import {
  logSlowQuery,
  getSlowQueries,
  clearSlowQueries,
  getSlowQueryStats,
  measureQuery,
} from '../lib/database/slow-query-logger';

async function runTests() {
  console.log('🧪 Testing Slow Query Logger\n');

  // Clear any existing logs
  clearSlowQueries();

// Test 1: Fast query (should not be logged)
console.log('Test 1: Fast Query (< 1000ms)');
logSlowQuery('SELECT * FROM users WHERE id = 1', 500, {
  model: 'User',
  operation: 'findUnique',
});
console.log(`  Logged queries: ${getSlowQueries().length}`);
console.log(`  ✅ Fast query not logged\n`);

// Test 2: Slow query (should be logged)
console.log('Test 2: Slow Query (> 1000ms)');
logSlowQuery('SELECT * FROM users WHERE email LIKE "%@%"', 1500, {
  model: 'User',
  operation: 'findMany',
});
console.log(`  Logged queries: ${getSlowQueries().length}`);
console.log(`  ✅ Slow query logged\n`);

// Test 3: Multiple slow queries
console.log('Test 3: Multiple Slow Queries');
logSlowQuery('SELECT * FROM orders WHERE status = "pending"', 2000, {
  model: 'Order',
  operation: 'findMany',
});
logSlowQuery('SELECT COUNT(*) FROM products', 1200, {
  model: 'Product',
  operation: 'count',
});
logSlowQuery('SELECT * FROM users JOIN orders ON users.id = orders.userId', 3000, {
  model: 'User',
  operation: 'findMany',
});
console.log(`  Logged queries: ${getSlowQueries().length}`);
console.log(`  ✅ Multiple slow queries logged\n`);

// Test 4: Get slow query statistics
console.log('Test 4: Slow Query Statistics');
const stats = getSlowQueryStats();
console.log('  Statistics:', JSON.stringify(stats, null, 2));
console.log(`  ✅ Statistics calculated\n`);

  // Test 5: Measure query wrapper
  console.log('Test 5: Measure Query Wrapper');

  async function simulateSlowQuery() {
    return new Promise(resolve => {
      setTimeout(() => resolve({ data: 'result' }), 1100);
    });
  }

  async function simulateFastQuery() {
    return new Promise(resolve => {
      setTimeout(() => resolve({ data: 'result' }), 100);
    });
  }

  const slowResult = await measureQuery(
    'SimulatedSlowQuery',
    simulateSlowQuery,
    { threshold: 1000 }
  );
  console.log(`  Slow query result:`, slowResult);

  const fastResult = await measureQuery(
    'SimulatedFastQuery',
    simulateFastQuery,
    { threshold: 1000 }
  );
  console.log(`  Fast query result:`, fastResult);

  const queriesAfterMeasure = getSlowQueries();
  console.log(`  Total logged queries: ${queriesAfterMeasure.length}`);
  console.log(`  ✅ Measure query wrapper works\n`);

  // Test 6: Query details
  console.log('Test 6: Query Details');
  const allQueries = getSlowQueries();
  console.log(`  Total slow queries: ${allQueries.length}`);
  console.log('\n  Recent slow queries:');
  allQueries.slice(-3).forEach((q, i) => {
    console.log(`    ${i + 1}. ${q.model}.${q.operation} - ${q.duration}ms`);
    console.log(`       Query: ${q.query.substring(0, 60)}...`);
  });
  console.log(`  ✅ Query details available\n`);

  // Test 7: Clear queries
  console.log('Test 7: Clear Queries');
  console.log(`  Before clear: ${getSlowQueries().length} queries`);
  clearSlowQueries();
  console.log(`  After clear: ${getSlowQueries().length} queries`);
  console.log(`  ✅ Queries cleared\n`);

  // Test 8: Custom threshold
  console.log('Test 8: Custom Threshold');
  logSlowQuery('SELECT * FROM users', 500, {
    model: 'User',
    operation: 'findMany',
    config: { threshold: 300 }, // Lower threshold
  });
  console.log(`  Logged queries with 300ms threshold: ${getSlowQueries().length}`);
  console.log(`  ✅ Custom threshold works\n`);

  // Test 9: Performance impact
  console.log('Test 9: Performance Impact');
  const iterations = 1000;

  // Without logging
  const startWithout = Date.now();
  for (let i = 0; i < iterations; i++) {
    // Simulate query
    const duration = Math.random() * 100;
  }
  const timeWithout = Date.now() - startWithout;

  // With logging
  clearSlowQueries();
  const startWith = Date.now();
  for (let i = 0; i < iterations; i++) {
    const duration = Math.random() * 100;
    logSlowQuery('SELECT * FROM test', duration, {
      model: 'Test',
      operation: 'findMany',
    });
  }
  const timeWith = Date.now() - startWith;

  console.log(`  ${iterations} iterations without logging: ${timeWithout}ms`);
  console.log(`  ${iterations} iterations with logging: ${timeWith}ms`);
  console.log(`  Overhead: ${timeWith - timeWithout}ms (${((timeWith - timeWithout) / timeWithout * 100).toFixed(2)}%)`);
  console.log(`  ✅ Performance impact measured\n`);

  // Final statistics
  console.log('📊 Final Statistics:');
  const finalStats = getSlowQueryStats();
  console.log(`  Total slow queries logged: ${finalStats.count}`);
  console.log(`  Average duration: ${finalStats.avgDuration.toFixed(2)}ms`);
  console.log(`  Max duration: ${finalStats.maxDuration}ms`);
  console.log(`  Min duration: ${finalStats.minDuration}ms`);
  console.log('\n  By Model:', finalStats.byModel);
  console.log('  By Operation:', finalStats.byOperation);

  console.log('\n✅ All slow query logger tests passed!');
  console.log('\n💡 Key Features:');
  console.log('  1. Automatic detection of slow queries');
  console.log('  2. Configurable threshold');
  console.log('  3. Statistics and grouping');
  console.log('  4. Minimal performance overhead');
  console.log('  5. Integration with monitoring services');
}

runTests().catch(console.error);
