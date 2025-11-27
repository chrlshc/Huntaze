#!/usr/bin/env tsx

/**
 * Test script to validate routing test infrastructure
 * Verifies that fast-check and Playwright are properly configured
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

function checkFileExists(filePath: string, description: string): boolean {
  const exists = existsSync(filePath);
  addResult(
    `File: ${description}`,
    exists,
    exists ? 'Found' : 'Missing'
  );
  return exists;
}

function checkDependency(packageName: string): boolean {
  try {
    require.resolve(packageName);
    addResult(
      `Dependency: ${packageName}`,
      true,
      'Installed'
    );
    return true;
  } catch {
    addResult(
      `Dependency: ${packageName}`,
      false,
      'Not installed'
    );
    return false;
  }
}

function runTests(testPath: string, description: string): boolean {
  try {
    console.log(`\nRunning ${description}...`);
    execSync(`npm run test ${testPath}`, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    addResult(
      `Tests: ${description}`,
      true,
      'All tests passed'
    );
    return true;
  } catch (error) {
    addResult(
      `Tests: ${description}`,
      false,
      'Some tests failed'
    );
    return false;
  }
}

async function main() {
  console.log('🔍 Validating Routing Test Infrastructure\n');
  console.log('=' .repeat(50));
  console.log('\n📦 Checking Dependencies...\n');

  // Check dependencies
  const hasFastCheck = checkDependency('fast-check');
  const hasVitest = checkDependency('vitest');
  const hasPlaywright = checkDependency('@playwright/test');

  console.log('\n📁 Checking Test Files...\n');

  // Check test files
  const testFiles = [
    {
      path: 'tests/unit/routing/route-resolution.property.test.ts',
      desc: 'Route Resolution Tests',
    },
    {
      path: 'tests/unit/routing/navigation-active-state.property.test.ts',
      desc: 'Navigation Active State Tests',
    },
    {
      path: 'tests/unit/routing/z-index-hierarchy.property.test.ts',
      desc: 'Z-Index Hierarchy Tests',
    },
    {
      path: 'tests/e2e/routing.spec.ts',
      desc: 'E2E Routing Tests',
    },
    {
      path: 'tests/unit/routing/README.md',
      desc: 'Test Documentation',
    },
  ];

  let allFilesExist = true;
  for (const { path, desc } of testFiles) {
    if (!checkFileExists(path, desc)) {
      allFilesExist = false;
    }
  }

  // Run tests if everything is set up
  if (hasFastCheck && hasVitest && allFilesExist) {
    console.log('\n🧪 Running Property-Based Tests...\n');
    runTests('tests/unit/routing', 'Routing Property Tests');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`Total Checks: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${percentage}%`);

  if (passed === total) {
    console.log('\n✅ All checks passed! Routing test infrastructure is ready.');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks failed. Please review the results above.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error running validation:', error);
  process.exit(1);
});
