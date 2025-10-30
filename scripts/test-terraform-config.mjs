#!/usr/bin/env node

/**
 * Test script for Terraform configuration validation
 * Runs tests without PostCSS/React dependencies
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🧪 Running Terraform Configuration Tests...\n');

// Test files to run
const testFiles = [
  'tests/unit/terraform-tfvars-validation.test.ts',
  'tests/regression/terraform-tfvars-regression.test.ts'
];

let allTestsPassed = true;
const results = [];

for (const testFile of testFiles) {
  const testPath = join(rootDir, testFile);
  
  if (!fs.existsSync(testPath)) {
    console.log(`⚠️  Test file not found: ${testFile}`);
    continue;
  }

  console.log(`\n📝 Running: ${testFile}`);
  console.log('─'.repeat(80));

  try {
    const output = execSync(
      `npx vitest run ${testFile} --config vitest.node.config.ts --reporter=verbose`,
      {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      }
    );

    console.log(output);
    results.push({ file: testFile, status: 'PASSED', output });
    console.log(`✅ ${testFile} - PASSED`);
  } catch (error) {
    allTestsPassed = false;
    results.push({ file: testFile, status: 'FAILED', error: error.message });
    console.error(`❌ ${testFile} - FAILED`);
    console.error(error.stdout || error.message);
  }
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 Test Summary');
console.log('='.repeat(80));

results.forEach(result => {
  const icon = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} ${result.file}: ${result.status}`);
});

console.log('\n' + '='.repeat(80));

if (allTestsPassed) {
  console.log('✅ All Terraform configuration tests passed!');
  process.exit(0);
} else {
  console.error('❌ Some tests failed. Please review the output above.');
  process.exit(1);
}
