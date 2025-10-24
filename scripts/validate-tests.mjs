#!/usr/bin/env node

/**
 * Test Validation Script
 * Validates test coverage and quality across the entire test suite
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

const REQUIRED_COVERAGE = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

const CRITICAL_FILES = [
  'lib/services/content-generation-service.ts',
  'lib/services/content-idea-generator.ts',
  'lib/services/message-personalization.ts',
  'lib/services/optimization-engine.ts',
  'lib/middleware/api-auth.ts',
  'lib/middleware/api-validation.ts',
];

async function main() {
  console.log('🧪 Starting test validation...\n');

  try {
    // 1. Run unit tests with coverage
    console.log('📊 Running unit tests with coverage...');
    execSync('npm run test:coverage', { stdio: 'inherit' });

    // 2. Validate coverage thresholds
    console.log('\n📈 Validating coverage thresholds...');
    await validateCoverage();

    // 3. Check test file coverage
    console.log('\n📝 Checking test file coverage...');
    await validateTestFiles();

    // 4. Run integration tests
    console.log('\n🔗 Running integration tests...');
    execSync('npm run test:integration', { stdio: 'inherit' });

    // 5. Run smoke E2E tests
    console.log('\n🎭 Running smoke E2E tests...');
    execSync('npm run e2e:smoke', { stdio: 'inherit' });

    // 6. Validate test quality
    console.log('\n✨ Validating test quality...');
    await validateTestQuality();

    console.log('\n✅ All tests passed validation!');
    console.log('\n📋 Test Summary:');
    console.log('   ✓ Unit tests with coverage');
    console.log('   ✓ Integration tests');
    console.log('   ✓ E2E smoke tests');
    console.log('   ✓ Test file coverage');
    console.log('   ✓ Test quality checks');

  } catch (error) {
    console.error('\n❌ Test validation failed:', error.message);
    process.exit(1);
  }
}

async function validateCoverage() {
  const coverageFile = 'coverage/coverage-summary.json';
  
  if (!existsSync(coverageFile)) {
    throw new Error('Coverage report not found. Run tests with coverage first.');
  }

  const coverage = JSON.parse(readFileSync(coverageFile, 'utf-8'));
  const total = coverage.total;

  const failures = [];

  Object.entries(REQUIRED_COVERAGE).forEach(([metric, threshold]) => {
    const actual = total[metric].pct;
    if (actual < threshold) {
      failures.push(`${metric}: ${actual}% < ${threshold}%`);
    } else {
      console.log(`   ✓ ${metric}: ${actual}% >= ${threshold}%`);
    }
  });

  if (failures.length > 0) {
    throw new Error(`Coverage thresholds not met:\n${failures.map(f => `   ❌ ${f}`).join('\n')}`);
  }
}

async function validateTestFiles() {
  const sourceFiles = await glob('lib/**/*.ts', { 
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts'] 
  });
  
  const testFiles = await glob('tests/**/*.test.ts');
  const testFileNames = testFiles.map(file => 
    path.basename(file, '.test.ts')
  );

  const missingTests = [];

  CRITICAL_FILES.forEach(file => {
    const baseName = path.basename(file, '.ts');
    if (!testFileNames.includes(baseName)) {
      missingTests.push(baseName);
    } else {
      console.log(`   ✓ ${baseName} has tests`);
    }
  });

  if (missingTests.length > 0) {
    throw new Error(`Missing tests for critical files:\n${missingTests.map(f => `   ❌ ${f}`).join('\n')}`);
  }

  console.log(`   ✓ All ${CRITICAL_FILES.length} critical files have tests`);
}

async function validateTestQuality() {
  const testFiles = await glob('tests/**/*.test.ts');
  const issues = [];

  for (const testFile of testFiles) {
    const content = readFileSync(testFile, 'utf-8');
    
    // Check for required patterns
    if (!content.includes('describe(')) {
      issues.push(`${testFile}: Missing describe blocks`);
    }
    
    if (!content.includes('it(')) {
      issues.push(`${testFile}: Missing it blocks`);
    }
    
    if (!content.includes('expect(')) {
      issues.push(`${testFile}: Missing expect assertions`);
    }
    
    // Check for cleanup
    if ((content.includes('vi.fn()') || content.includes('mock')) && !content.includes('beforeEach')) {
      issues.push(`${testFile}: Missing beforeEach cleanup for mocks`);
    }
    
    // Check for focused tests (should not be committed)
    if (content.match(/it\.only|describe\.only|test\.only/)) {
      issues.push(`${testFile}: Contains focused tests (.only)`);
    }
  }

  if (issues.length > 0) {
    throw new Error(`Test quality issues found:\n${issues.map(i => `   ❌ ${i}`).join('\n')}`);
  }

  console.log(`   ✓ All ${testFiles.length} test files pass quality checks`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}