#!/usr/bin/env tsx

/**
 * Visual Baseline Setup Validation Script
 * 
 * Validates that all visual regression testing components are properly set up.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: ValidationResult[] = [];

function validate(name: string, check: () => boolean, successMsg: string, failMsg: string) {
  try {
    const passed = check();
    results.push({
      name,
      passed,
      message: passed ? successMsg : failMsg
    });
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: `${failMsg}: ${error}`
    });
  }
}

console.log('🔍 Validating Visual Baseline Setup...\n');

// Check test file exists
validate(
  'Test Suite',
  () => fs.existsSync('tests/visual/design-system-baseline.spec.ts'),
  '✅ Test suite file exists',
  '❌ Test suite file not found'
);

// Check README exists
validate(
  'Documentation',
  () => fs.existsSync('tests/visual/README.md'),
  '✅ Visual testing documentation exists',
  '❌ Documentation not found'
);

// Check capture script exists
validate(
  'Capture Script',
  () => fs.existsSync('scripts/capture-visual-baseline.ts'),
  '✅ Baseline capture script exists',
  '❌ Capture script not found'
);

// Check guide exists
validate(
  'Usage Guide',
  () => fs.existsSync('.kiro/specs/design-system-unification/VISUAL-BASELINE-GUIDE.md'),
  '✅ Visual baseline guide exists',
  '❌ Usage guide not found'
);

// Check Playwright config
validate(
  'Playwright Config',
  () => {
    const config = fs.readFileSync('playwright.config.ts', 'utf-8');
    return config.includes('toHaveScreenshot') && config.includes('maxDiffPixels');
  },
  '✅ Playwright configured for visual testing',
  '❌ Playwright config missing visual settings'
);

// Check NPM scripts
validate(
  'NPM Scripts',
  () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    return pkg.scripts['test:visual'] && 
           pkg.scripts['test:visual:update'] &&
           pkg.scripts['test:visual:baseline'];
  },
  '✅ NPM scripts configured',
  '❌ NPM scripts not configured'
);

// Check Playwright installation
validate(
  'Playwright Installation',
  () => {
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },
  '✅ Playwright is installed',
  '❌ Playwright is not installed'
);

// Check test file syntax
validate(
  'Test File Syntax',
  () => {
    const testFile = fs.readFileSync('tests/visual/design-system-baseline.spec.ts', 'utf-8');
    return testFile.includes('test.describe') && 
           testFile.includes('toHaveScreenshot') &&
           testFile.includes('Feature: design-system-unification');
  },
  '✅ Test file has correct structure',
  '❌ Test file structure invalid'
);

// Check test coverage
validate(
  'Test Coverage',
  () => {
    const testFile = fs.readFileSync('tests/visual/design-system-baseline.spec.ts', 'utf-8');
    const hasComponents = testFile.includes('Core UI Components');
    const hasPages = testFile.includes('Dashboard Pages');
    const hasResponsive = testFile.includes('Responsive Design');
    const hasInteractive = testFile.includes('Interactive States');
    return hasComponents && hasPages && hasResponsive && hasInteractive;
  },
  '✅ Test coverage is comprehensive',
  '❌ Test coverage is incomplete'
);

// Print results
console.log('Validation Results:\n');

let allPassed = true;
for (const result of results) {
  console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  console.log(`   ${result.message}\n`);
  if (!result.passed) allPassed = false;
}

// Summary
console.log('─'.repeat(60));
const passedCount = results.filter(r => r.passed).length;
const totalCount = results.length;
console.log(`\nSummary: ${passedCount}/${totalCount} checks passed\n`);

if (allPassed) {
  console.log('✨ Visual baseline setup is complete and valid!\n');
  console.log('Next steps:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Capture baselines: npm run test:visual:update');
  console.log('3. Review screenshots: tests/visual/__screenshots__/');
  console.log('4. Run tests: npm run test:visual\n');
  process.exit(0);
} else {
  console.log('❌ Some validation checks failed. Please fix the issues above.\n');
  process.exit(1);
}
