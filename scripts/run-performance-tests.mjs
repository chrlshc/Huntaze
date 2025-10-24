#!/usr/bin/env node

/**
 * Performance Test Runner
 * Runs all performance-related tests with appropriate configuration
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const PERFORMANCE_TEST_PATTERNS = [
  'tests/unit/circuit-breaker.test.ts',
  'tests/unit/request-coalescer.test.ts', 
  'tests/unit/graceful-degradation.test.ts',
  'tests/unit/load-testing-service.test.ts',
  'tests/unit/performance-optimization.test.ts',
  'tests/unit/api-monitoring-service.test.ts',
  'tests/integration/performance-integration.test.ts',
  'tests/regression/performance-optimization-regression.test.ts'
];

const PERFORMANCE_THRESHOLDS = {
  statements: 85,
  branches: 80,
  functions: 85,
  lines: 85
};

function runCommand(command, options = {}) {
  try {
    console.log(`🔄 Running: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkTestFiles() {
  console.log('📋 Checking performance test files...');
  
  const missingFiles = PERFORMANCE_TEST_PATTERNS.filter(pattern => {
    const exists = existsSync(pattern);
    if (!exists) {
      console.log(`⚠️  Missing: ${pattern}`);
    } else {
      console.log(`✅ Found: ${pattern}`);
    }
    return !exists;
  });

  if (missingFiles.length > 0) {
    console.error(`❌ Missing ${missingFiles.length} performance test files`);
    process.exit(1);
  }

  console.log('✅ All performance test files found');
}

function runPerformanceTests() {
  console.log('\n🧪 Running Performance Tests...');
  
  const testCommand = [
    'npx vitest run',
    '--reporter=verbose',
    '--reporter=json',
    '--outputFile=test-results/performance-results.json',
    '--coverage',
    '--coverage.reporter=text',
    '--coverage.reporter=json-summary',
    '--coverage.outputFile=coverage/performance-coverage.json',
    `--coverage.thresholds.statements=${PERFORMANCE_THRESHOLDS.statements}`,
    `--coverage.thresholds.branches=${PERFORMANCE_THRESHOLDS.branches}`,
    `--coverage.thresholds.functions=${PERFORMANCE_THRESHOLDS.functions}`,
    `--coverage.thresholds.lines=${PERFORMANCE_THRESHOLDS.lines}`,
    PERFORMANCE_TEST_PATTERNS.join(' ')
  ].join(' ');

  runCommand(testCommand);
}

function runLoadTests() {
  console.log('\n🚀 Running Load Tests...');
  
  // Check if load test service is available
  if (!existsSync('tests/load/load-testing-service.ts')) {
    console.log('⚠️  Load testing service not found, skipping load tests');
    return;
  }

  const loadTestCommand = [
    'npx vitest run',
    '--reporter=verbose',
    'tests/unit/load-testing-service.test.ts'
  ].join(' ');

  runCommand(loadTestCommand);
}

function runCircuitBreakerTests() {
  console.log('\n⚡ Running Circuit Breaker Tests...');
  
  const circuitBreakerCommand = [
    'npx vitest run',
    '--reporter=verbose',
    'tests/unit/circuit-breaker.test.ts'
  ].join(' ');

  runCommand(circuitBreakerCommand);
}

function runCoalescingTests() {
  console.log('\n🔄 Running Request Coalescing Tests...');
  
  const coalescingCommand = [
    'npx vitest run',
    '--reporter=verbose', 
    'tests/unit/request-coalescer.test.ts'
  ].join(' ');

  runCommand(coalescingCommand);
}

function runDegradationTests() {
  console.log('\n🛡️  Running Graceful Degradation Tests...');
  
  const degradationCommand = [
    'npx vitest run',
    '--reporter=verbose',
    'tests/unit/graceful-degradation.test.ts'
  ].join(' ');

  runCommand(degradationCommand);
}

function runMonitoringTests() {
  console.log('\n📊 Running API Monitoring Tests...');
  
  const monitoringCommand = [
    'npx vitest run',
    '--reporter=verbose',
    'tests/unit/api-monitoring-service.test.ts'
  ].join(' ');

  runCommand(monitoringCommand);
}

function runIntegrationTests() {
  console.log('\n🔗 Running Performance Integration Tests...');
  
  const integrationCommand = [
    'npx vitest run',
    '--reporter=verbose',
    'tests/integration/performance-integration.test.ts'
  ].join(' ');

  runCommand(integrationCommand);
}

function runRegressionTests() {
  console.log('\n🔍 Running Performance Regression Tests...');
  
  const regressionCommand = [
    'npx vitest run',
    '--reporter=verbose',
    'tests/regression/performance-optimization-regression.test.ts'
  ].join(' ');

  runCommand(regressionCommand);
}

function generatePerformanceReport() {
  console.log('\n📈 Generating Performance Test Report...');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    testSuites: {
      circuitBreaker: 'Circuit Breaker Pattern Tests',
      requestCoalescing: 'Request Coalescing Tests', 
      gracefulDegradation: 'Graceful Degradation Tests',
      loadTesting: 'Load Testing Service Tests',
      apiMonitoring: 'API Monitoring Tests',
      integration: 'Performance Integration Tests',
      regression: 'Performance Regression Tests'
    },
    thresholds: PERFORMANCE_THRESHOLDS,
    status: 'completed'
  };

  try {
    const fs = await import('fs/promises');
    await fs.writeFile(
      'test-results/performance-test-report.json', 
      JSON.stringify(reportData, null, 2)
    );
    console.log('✅ Performance test report generated');
  } catch (error) {
    console.warn('⚠️  Could not generate performance report:', error.message);
  }
}

async function main() {
  console.log('🚀 Performance Test Suite Runner');
  console.log('==================================\n');

  const args = process.argv.slice(2);
  const runAll = args.length === 0 || args.includes('--all');
  const runSpecific = args.filter(arg => !arg.startsWith('--'));

  try {
    // Check test files exist
    checkTestFiles();

    if (runAll) {
      console.log('🎯 Running all performance tests...\n');
      
      // Run individual test suites
      runCircuitBreakerTests();
      runCoalescingTests();
      runDegradationTests();
      runMonitoringTests();
      runLoadTests();
      runIntegrationTests();
      runRegressionTests();
      
      // Run comprehensive test suite
      runPerformanceTests();
      
    } else {
      // Run specific test suites
      if (runSpecific.includes('circuit-breaker')) {
        runCircuitBreakerTests();
      }
      if (runSpecific.includes('coalescing')) {
        runCoalescingTests();
      }
      if (runSpecific.includes('degradation')) {
        runDegradationTests();
      }
      if (runSpecific.includes('monitoring')) {
        runMonitoringTests();
      }
      if (runSpecific.includes('load')) {
        runLoadTests();
      }
      if (runSpecific.includes('integration')) {
        runIntegrationTests();
      }
      if (runSpecific.includes('regression')) {
        runRegressionTests();
      }
    }

    // Generate report
    await generatePerformanceReport();

    console.log('\n🎉 Performance tests completed successfully!');
    console.log('\n📊 Performance Test Summary:');
    console.log('- Circuit Breaker: Pattern implementation and resilience');
    console.log('- Request Coalescing: Duplicate request optimization');
    console.log('- Graceful Degradation: Service fallback strategies');
    console.log('- API Monitoring: Metrics collection and alerting');
    console.log('- Load Testing: Performance under load simulation');
    console.log('- Integration: End-to-end performance validation');
    console.log('- Regression: SLI/SLO compliance verification');

  } catch (error) {
    console.error('\n❌ Performance tests failed:', error.message);
    process.exit(1);
  }
}

// Handle CLI usage
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Performance Test Runner

Usage:
  npm run test:performance                    # Run all performance tests
  npm run test:performance -- circuit-breaker # Run circuit breaker tests only
  npm run test:performance -- coalescing     # Run request coalescing tests only
  npm run test:performance -- degradation    # Run graceful degradation tests only
  npm run test:performance -- monitoring     # Run API monitoring tests only
  npm run test:performance -- load           # Run load testing tests only
  npm run test:performance -- integration    # Run integration tests only
  npm run test:performance -- regression     # Run regression tests only

Options:
  --all                                       # Run all test suites (default)
  --help, -h                                  # Show this help message

Examples:
  npm run test:performance
  npm run test:performance -- circuit-breaker coalescing
  npm run test:performance -- --all
`);
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});