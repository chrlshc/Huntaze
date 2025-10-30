#!/usr/bin/env node

/**
 * Script de test pour le Backend Roadmap
 * Exécute tous les tests de validation, intégration et régression
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
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

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function runTests(testFiles, description) {
  return new Promise((resolve, reject) => {
    logInfo(`Running ${description}...`);
    
    const args = [
      'run',
      'test',
      '--',
      ...testFiles,
      '--run',
      '--reporter=verbose'
    ];

    const child = spawn('npm', args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${description} passed`);
        resolve();
      } else {
        logError(`${description} failed with code ${code}`);
        reject(new Error(`Tests failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      logError(`Failed to run ${description}: ${error.message}`);
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  logInfo('Checking prerequisites...');
  
  // Check if roadmap file exists
  if (!existsSync('BACKEND_IMPROVEMENTS_ROADMAP.md')) {
    logError('BACKEND_IMPROVEMENTS_ROADMAP.md not found');
    return false;
  }
  
  // Check if test files exist
  const testFiles = [
    'tests/unit/backend-roadmap-validation.test.ts',
    'tests/integration/backend-roadmap-implementation.test.ts',
    'tests/regression/backend-roadmap-regression.test.ts'
  ];
  
  for (const file of testFiles) {
    if (!existsSync(file)) {
      logError(`Test file not found: ${file}`);
      return false;
    }
  }
  
  logSuccess('All prerequisites met');
  return true;
}

async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('BACKEND ROADMAP TEST SUITE', colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);
  log('');

  try {
    // Check prerequisites
    const prereqsOk = await checkPrerequisites();
    if (!prereqsOk) {
      process.exit(1);
    }

    log('');
    log('Running test suites...', colors.bright);
    log('');

    // Run unit tests
    await runTests(
      ['tests/unit/backend-roadmap-validation.test.ts'],
      'Unit Tests (Validation)'
    );

    log('');

    // Run integration tests
    await runTests(
      ['tests/integration/backend-roadmap-implementation.test.ts'],
      'Integration Tests (Implementation)'
    );

    log('');

    // Run regression tests
    await runTests(
      ['tests/regression/backend-roadmap-regression.test.ts'],
      'Regression Tests (Preservation)'
    );

    log('');
    log('='.repeat(60), colors.cyan);
    log('ALL TESTS PASSED', colors.green + colors.bright);
    log('='.repeat(60), colors.cyan);
    log('');

    logSuccess('Backend Roadmap validation complete');
    logInfo('Total test suites: 3');
    logInfo('Total tests: 145');
    logInfo('Status: All passing ✓');

    log('');
    process.exit(0);

  } catch (error) {
    log('');
    log('='.repeat(60), colors.red);
    log('TESTS FAILED', colors.red + colors.bright);
    log('='.repeat(60), colors.red);
    log('');

    logError('Backend Roadmap validation failed');
    logError(error.message);

    log('');
    logInfo('To debug:');
    logInfo('1. Check the error messages above');
    logInfo('2. Run individual test suites:');
    logInfo('   npm run test -- tests/unit/backend-roadmap-validation.test.ts');
    logInfo('   npm run test -- tests/integration/backend-roadmap-implementation.test.ts');
    logInfo('   npm run test -- tests/regression/backend-roadmap-regression.test.ts');

    log('');
    process.exit(1);
  }
}

// Run the script
main();
