#!/usr/bin/env node

/**
 * Script d'exécution des tests pour les services simplifiés Huntaze
 * Exécute les tests unitaires et d'intégration avec validation complète
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration
const config = {
  testFiles: [
    'tests/unit/simple-user-service-complete.test.ts',
    'tests/unit/simple-billing-service.test.ts', 
    'tests/integration/user-billing-integration-complete.test.ts',
    'tests/unit/simple-services-validation.test.ts'
  ],
  coverageThreshold: {
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85
  },
  timeout: 300000, // 5 minutes
  retries: 2
};

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${message}`, colors.cyan + colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

// Vérifier les prérequis
async function checkPrerequisites() {
  logHeader('CHECKING PREREQUISITES');
  
  const checks = [
    {
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 18;
      },
      message: 'Node.js 18+ required'
    },
    {
      name: 'package.json',
      check: () => existsSync(join(rootDir, 'package.json')),
      message: 'package.json not found'
    },
    {
      name: 'Vitest config',
      check: () => existsSync(join(rootDir, 'vitest.simple-services.config.ts')),
      message: 'vitest.simple-services.config.ts not found'
    },
    {
      name: 'Test setup',
      check: () => existsSync(join(rootDir, 'tests/setup/simple-services-setup.ts')),
      message: 'Test setup file not found'
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      if (check.check()) {
        logSuccess(`${check.name}: OK`);
      } else {
        logError(`${check.name}: ${check.message}`);
        allPassed = false;
      }
    } catch (error) {
      logError(`${check.name}: ${error.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Vérifier que les fichiers de test existent
async function checkTestFiles() {
  logHeader('CHECKING TEST FILES');
  
  let allExist = true;

  for (const testFile of config.testFiles) {
    const fullPath = join(rootDir, testFile);
    if (existsSync(fullPath)) {
      logSuccess(`${testFile}: Found`);
    } else {
      logError(`${testFile}: Not found`);
      allExist = false;
    }
  }

  return allExist;
}

// Créer les répertoires nécessaires
async function createDirectories() {
  logHeader('CREATING DIRECTORIES');
  
  const dirs = [
    'reports',
    'coverage',
    'coverage/simple-services'
  ];

  for (const dir of dirs) {
    const fullPath = join(rootDir, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      logSuccess(`Created: ${dir}`);
    } else {
      logInfo(`Exists: ${dir}`);
    }
  }
}

// Exécuter une commande avec promesse
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      cwd: rootDir,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      if (options.showOutput) {
        process.stdout.write(data);
      }
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      if (options.showOutput) {
        process.stderr.write(data);
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject({ stdout, stderr, code });
      }
    });

    child.on('error', (error) => {
      reject({ error, stdout, stderr, code: -1 });
    });
  });
}

// Exécuter les tests TypeScript
async function runTypeCheck() {
  logHeader('TYPESCRIPT TYPE CHECKING');
  
  try {
    await runCommand('npx', ['tsc', '--noEmit'], { showOutput: true });
    logSuccess('TypeScript check passed');
    return true;
  } catch (error) {
    logError('TypeScript check failed');
    console.log(error.stdout);
    console.error(error.stderr);
    return false;
  }
}

// Exécuter les tests unitaires
async function runUnitTests() {
  logHeader('RUNNING UNIT TESTS');
  
  const unitTests = config.testFiles.filter(file => file.includes('/unit/'));
  
  try {
    const result = await runCommand('npx', [
      'vitest',
      'run',
      '--config', 'vitest.simple-services.config.ts',
      '--coverage',
      '--reporter=verbose',
      '--reporter=junit',
      '--outputFile.junit=reports/unit-tests-junit.xml',
      ...unitTests
    ], { showOutput: true });

    logSuccess(`Unit tests completed (${unitTests.length} files)`);
    return { success: true, output: result.stdout };
  } catch (error) {
    logError('Unit tests failed');
    console.log(error.stdout);
    console.error(error.stderr);
    return { success: false, output: error.stdout, error: error.stderr };
  }
}

// Exécuter les tests d'intégration
async function runIntegrationTests() {
  logHeader('RUNNING INTEGRATION TESTS');
  
  const integrationTests = config.testFiles.filter(file => file.includes('/integration/'));
  
  try {
    const result = await runCommand('npx', [
      'vitest',
      'run',
      '--config', 'vitest.simple-services.config.ts',
      '--reporter=verbose',
      '--reporter=junit',
      '--outputFile.junit=reports/integration-tests-junit.xml',
      ...integrationTests
    ], { showOutput: true });

    logSuccess(`Integration tests completed (${integrationTests.length} files)`);
    return { success: true, output: result.stdout };
  } catch (error) {
    logError('Integration tests failed');
    console.log(error.stdout);
    console.error(error.stderr);
    return { success: false, output: error.stdout, error: error.stderr };
  }
}

// Vérifier la couverture de code
async function checkCoverage() {
  logHeader('CHECKING CODE COVERAGE');
  
  const coverageFile = join(rootDir, 'coverage/simple-services/coverage-summary.json');
  
  if (!existsSync(coverageFile)) {
    logWarning('Coverage file not found, skipping coverage check');
    return true;
  }

  try {
    const coverageData = JSON.parse(readFileSync(coverageFile, 'utf8'));
    const total = coverageData.total;

    logInfo('Coverage Results:');
    console.log(`  Statements: ${total.statements.pct}% (threshold: ${config.coverageThreshold.statements}%)`);
    console.log(`  Branches:   ${total.branches.pct}% (threshold: ${config.coverageThreshold.branches}%)`);
    console.log(`  Functions:  ${total.functions.pct}% (threshold: ${config.coverageThreshold.functions}%)`);
    console.log(`  Lines:      ${total.lines.pct}% (threshold: ${config.coverageThreshold.lines}%)`);

    const passed = 
      total.statements.pct >= config.coverageThreshold.statements &&
      total.branches.pct >= config.coverageThreshold.branches &&
      total.functions.pct >= config.coverageThreshold.functions &&
      total.lines.pct >= config.coverageThreshold.lines;

    if (passed) {
      logSuccess('Coverage thresholds met');
    } else {
      logError('Coverage thresholds not met');
    }

    return passed;
  } catch (error) {
    logError(`Failed to check coverage: ${error.message}`);
    return false;
  }
}

// Générer le rapport final
async function generateReport(results) {
  logHeader('GENERATING FINAL REPORT');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    configuration: config,
    results: results,
    summary: {
      totalTests: config.testFiles.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      overallSuccess: results.every(r => r.success)
    }
  };

  const reportPath = join(rootDir, 'reports/simple-services-test-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logSuccess(`Report saved to: ${reportPath}`);
  
  // Afficher le résumé
  console.log('\n' + '='.repeat(60));
  log('TEST EXECUTION SUMMARY', colors.cyan + colors.bright);
  console.log('='.repeat(60));
  
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${colors.green}${report.summary.passed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${report.summary.failed}${colors.reset}`);
  
  if (report.summary.overallSuccess) {
    logSuccess('🎉 All tests passed successfully!');
  } else {
    logError('💥 Some tests failed!');
  }
  
  return report.summary.overallSuccess;
}

// Fonction principale
async function main() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('🧪 HUNTAZE SIMPLE SERVICES TEST RUNNER');
  console.log('=====================================');
  console.log(`${colors.reset}`);
  
  const startTime = Date.now();
  const results = [];

  try {
    // 1. Vérifier les prérequis
    if (!(await checkPrerequisites())) {
      process.exit(1);
    }

    // 2. Vérifier les fichiers de test
    if (!(await checkTestFiles())) {
      process.exit(1);
    }

    // 3. Créer les répertoires
    await createDirectories();

    // 4. Vérification TypeScript
    const typeCheckResult = await runTypeCheck();
    results.push({ name: 'TypeScript Check', success: typeCheckResult });

    if (!typeCheckResult) {
      logError('TypeScript check failed, stopping execution');
      process.exit(1);
    }

    // 5. Tests unitaires
    const unitTestResult = await runUnitTests();
    results.push({ name: 'Unit Tests', success: unitTestResult.success, ...unitTestResult });

    // 6. Tests d'intégration
    const integrationTestResult = await runIntegrationTests();
    results.push({ name: 'Integration Tests', success: integrationTestResult.success, ...integrationTestResult });

    // 7. Vérification de la couverture
    const coverageResult = await checkCoverage();
    results.push({ name: 'Coverage Check', success: coverageResult });

    // 8. Générer le rapport final
    const overallSuccess = await generateReport(results);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log(`\n⏱️  Total execution time: ${duration} seconds`);

    process.exit(overallSuccess ? 0 : 1);

  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Gestion des signaux
process.on('SIGINT', () => {
  logWarning('Test execution interrupted');
  process.exit(130);
});

process.on('SIGTERM', () => {
  logWarning('Test execution terminated');
  process.exit(143);
});

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

export { main, config };