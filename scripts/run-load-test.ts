#!/usr/bin/env tsx

/**
 * Script de test de charge pour valider les performances de l'API
 * Usage: npm run load-test [smoke|load|stress|spike]
 */

import { LoadTestingService, LoadTestConfigs } from '../tests/load/load-testing-service';

async function main() {
  const testType = process.argv[2] || 'smoke';
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  console.log(`🚀 Starting ${testType} test against ${baseUrl}`);
  
  const loadTester = new LoadTestingService();
  
  let config;
  switch (testType) {
    case 'smoke':
      config = LoadTestConfigs.smokeTest(baseUrl);
      break;
    case 'load':
      config = LoadTestConfigs.loadTest(baseUrl);
      break;
    case 'stress':
      config = LoadTestConfigs.stressTest(baseUrl);
      break;
    case 'spike':
      config = LoadTestConfigs.spikeTest(baseUrl);
      break;
    default:
      console.error('Invalid test type. Use: smoke, load, stress, or spike');
      process.exit(1);
  }

  try {
    const result = await loadTester.runLoadTest(config);
    
    console.log('\n📊 Load Test Results:');
    console.log('='.repeat(50));
    console.log(`Total Requests: ${result.metrics.totalRequests}`);
    console.log(`Success Rate: ${(100 - result.metrics.errorRate).toFixed(2)}%`);
    console.log(`Average Response Time: ${result.metrics.averageResponseTime.toFixed(0)}ms`);
    console.log(`P95 Response Time: ${result.metrics.p95ResponseTime}ms`);
    console.log(`P99 Response Time: ${result.metrics.p99ResponseTime}ms`);
    console.log(`Requests/Second: ${result.metrics.requestsPerSecond.toFixed(2)}`);
    console.log(`Concurrent Users: ${result.metrics.concurrentUsers}`);
    
    if (result.errors.length > 0) {
      console.log(`\n❌ Errors: ${result.errors.length}`);
      console.log('Top errors:');
      const errorCounts = result.errors.reduce((acc, error) => {
        acc[error.error] = (acc[error.error] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(errorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([error, count]) => {
          console.log(`  - ${error}: ${count} times`);
        });
    }
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    
    // Déterminer le statut de sortie
    const isSuccess = result.metrics.errorRate < 5 && result.metrics.p95ResponseTime < 2000;
    
    if (isSuccess) {
      console.log('\n✅ Load test passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Load test failed - performance targets not met');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping load test...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping load test...');
  process.exit(0);
});

main().catch(console.error);