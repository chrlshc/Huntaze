#!/usr/bin/env node

/**
 * Script de test pour le service AI optimisé
 * Exécute les tests et génère un rapport détaillé
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), colors.cyan);
  log(title, colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function checkPrerequisites() {
  logSection('Checking Prerequisites');

  // Check if test file exists
  if (!existsSync('tests/unit/ai-service-optimized.test.ts')) {
    logError('Test file not found: tests/unit/ai-service-optimized.test.ts');
    process.exit(1);
  }
  logSuccess('Test file found');

  // Check if source file exists
  if (!existsSync('lib/services/ai-service.ts')) {
    logError('Source file not found: lib/services/ai-service.ts');
    process.exit(1);
  }
  logSuccess('Source file found');

  // Check if vitest is available
  try {
    await runCommand('npx', ['vitest', '--version'], { stdio: 'pipe' });
    logSuccess('Vitest is available');
  } catch (error) {
    logError('Vitest not found. Please install dependencies: npm install');
    process.exit(1);
  }
}

async function runTests() {
  logSection('Running AI Service Tests');

  try {
    await runCommand('npx', [
      'vitest',
      'run',
      'tests/unit/ai-service-optimized.test.ts',
      '--reporter=verbose',
      '--reporter=json',
      '--outputFile=reports/ai-service-test-results.json',
    ]);
    logSuccess('All tests passed!');
    return true;
  } catch (error) {
    logError('Some tests failed');
    return false;
  }
}

async function runCoverage() {
  logSection('Running Coverage Analysis');

  try {
    await runCommand('npx', [
      'vitest',
      'run',
      'tests/unit/ai-service-optimized.test.ts',
      '--coverage',
      '--coverage.reporter=text',
      '--coverage.reporter=json-summary',
    ]);
    logSuccess('Coverage analysis completed');
    return true;
  } catch (error) {
    logError('Coverage analysis failed');
    return false;
  }
}

async function runTypeCheck() {
  logSection('Running TypeScript Type Check');

  try {
    await runCommand('npx', ['tsc', '--noEmit', 'lib/services/ai-service.ts']);
    logSuccess('Type check passed');
    return true;
  } catch (error) {
    logError('Type check failed');
    return false;
  }
}

async function generateReport(results) {
  logSection('Generating Test Report');

  const report = {
    timestamp: new Date().toISOString(),
    results: {
      tests: results.tests,
      typeCheck: results.typeCheck,
      coverage: results.coverage,
    },
    summary: {
      allPassed: results.tests && results.typeCheck && results.coverage,
      totalChecks: 3,
      passedChecks: [results.tests, results.typeCheck, results.coverage].filter(Boolean).length,
    },
  };

  try {
    await writeFile(
      'reports/ai-service-test-report.json',
      JSON.stringify(report, null, 2)
    );
    logSuccess('Report saved to reports/ai-service-test-report.json');
  } catch (error) {
    logError('Failed to save report: ' + error.message);
  }

  return report;
}

function printSummary(report) {
  logSection('Test Summary');

  log(`Timestamp: ${report.timestamp}`, colors.blue);
  log(`Total Checks: ${report.summary.totalChecks}`, colors.blue);
  log(`Passed: ${report.summary.passedChecks}`, colors.green);
  log(`Failed: ${report.summary.totalChecks - report.summary.passedChecks}`, colors.red);

  log('\nDetailed Results:', colors.cyan);
  log(`  Tests: ${report.results.tests ? '✅ PASS' : '❌ FAIL'}`, 
    report.results.tests ? colors.green : colors.red);
  log(`  Type Check: ${report.results.typeCheck ? '✅ PASS' : '❌ FAIL'}`, 
    report.results.typeCheck ? colors.green : colors.red);
  log(`  Coverage: ${report.results.coverage ? '✅ PASS' : '❌ FAIL'}`, 
    report.results.coverage ? colors.green : colors.red);

  if (report.summary.allPassed) {
    log('\n🎉 All checks passed! AI Service is ready for production.', 
      colors.green + colors.bright);
  } else {
    log('\n💥 Some checks failed. Please review the errors above.', 
      colors.red + colors.bright);
  }
}

async function main() {
  log('🚀 AI Service Test Suite', colors.cyan + colors.bright);
  log('Testing optimized AI service integration\n', colors.cyan);

  try {
    // Check prerequisites
    await checkPrerequisites();

    // Run tests
    const results = {
      tests: false,
      typeCheck: false,
      coverage: false,
    };

    // Type check
    results.typeCheck = await runTypeCheck();

    // Run tests
    results.tests = await runTests();

    // Run coverage (optional, don't fail if it doesn't work)
    try {
      results.coverage = await runCoverage();
    } catch (error) {
      logInfo('Coverage analysis skipped (optional)');
      results.coverage = true; // Don't fail on coverage
    }

    // Generate report
    const report = await generateReport(results);

    // Print summary
    printSummary(report);

    // Exit with appropriate code
    process.exit(report.summary.allPassed ? 0 : 1);
  } catch (error) {
    logError('Test suite failed: ' + error.message);
    process.exit(1);
  }
}

// Run the test suite
main();
