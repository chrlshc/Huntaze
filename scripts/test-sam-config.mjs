#!/usr/bin/env node

/**
 * Script de test pour la configuration SAM
 * Exécute tous les tests liés à sam/samconfig.toml
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

// Colors for console output
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

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(message, colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);
}

// Test files to run
const testFiles = [
  {
    name: 'SAM Config Validation (Unit)',
    path: 'tests/unit/sam-config-validation.test.ts',
    required: true
  },
  {
    name: 'SAM Config Regression',
    path: 'tests/regression/sam-config-regression.test.ts',
    required: true
  },
  {
    name: 'SAM Config Integration',
    path: 'tests/integration/sam-config-integration.test.ts',
    required: false
  }
];

// Check if required files exist
function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  const requiredFiles = [
    'sam/samconfig.toml',
    'sam/template.yaml',
    'package.json'
  ];
  
  let allExist = true;
  
  requiredFiles.forEach(file => {
    if (existsSync(file)) {
      logSuccess(`Found: ${file}`);
    } else {
      logError(`Missing: ${file}`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Run a single test file
function runTest(testFile) {
  return new Promise((resolve, reject) => {
    logSection(`Running: ${testFile.name}`);
    
    if (!existsSync(testFile.path)) {
      if (testFile.required) {
        logError(`Test file not found: ${testFile.path}`);
        reject(new Error(`Missing required test file: ${testFile.path}`));
      } else {
        logInfo(`Skipping optional test: ${testFile.path}`);
        resolve({ skipped: true });
      }
      return;
    }
    
    const args = ['run', 'test', testFile.path, '--reporter=verbose'];
    
    const testProcess = spawn('npm', args, {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${testFile.name} passed`);
        resolve({ passed: true });
      } else {
        logError(`${testFile.name} failed with code ${code}`);
        reject(new Error(`Test failed: ${testFile.name}`));
      }
    });
    
    testProcess.on('error', (error) => {
      logError(`Failed to run ${testFile.name}: ${error.message}`);
      reject(error);
    });
  });
}

// Run all tests sequentially
async function runAllTests() {
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: testFiles.length
  };
  
  for (const testFile of testFiles) {
    try {
      const result = await runTest(testFile);
      if (result.skipped) {
        results.skipped++;
      } else if (result.passed) {
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      if (testFile.required) {
        // Stop on required test failure
        break;
      }
    }
  }
  
  return results;
}

// Print summary
function printSummary(results) {
  logSection('Test Summary');
  
  log(`Total Tests: ${results.total}`, colors.blue);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
  log(`Skipped: ${results.skipped}`, colors.yellow);
  
  const successRate = ((results.passed / (results.total - results.skipped)) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate === '100.0' ? colors.green : colors.yellow);
  
  if (results.failed === 0) {
    log('\n🎉 All SAM config tests passed!', colors.green + colors.bright);
  } else {
    log('\n💥 Some SAM config tests failed!', colors.red + colors.bright);
  }
}

// Main execution
async function main() {
  try {
    log('🔍 SAM Configuration Test Suite', colors.blue + colors.bright);
    
    // Check prerequisites
    if (!checkPrerequisites()) {
      logError('Prerequisites check failed. Please ensure all required files exist.');
      process.exit(1);
    }
    
    // Run all tests
    const results = await runAllTests();
    
    // Print summary
    printSummary(results);
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
SAM Configuration Test Suite

Usage:
  node scripts/test-sam-config.mjs [options]

Options:
  --help, -h     Show this help message
  --coverage     Run tests with coverage
  --watch        Run tests in watch mode

Examples:
  node scripts/test-sam-config.mjs
  node scripts/test-sam-config.mjs --coverage
  `);
  process.exit(0);
}

if (args.includes('--coverage')) {
  logInfo('Running with coverage enabled');
  // Add coverage flag to test commands
}

if (args.includes('--watch')) {
  logInfo('Watch mode not supported for this script. Use npm run test:watch instead.');
  process.exit(1);
}

// Run main function
main();
