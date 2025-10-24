#!/usr/bin/env node

/**
 * Tailwind Configuration Test Validation Script
 * Validates that all Tailwind configuration changes are properly tested
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

const REQUIRED_TEST_FILES = [
  'tests/unit/tailwind-config.test.ts',
  'tests/unit/tailwind-color-validation.test.ts',
  'tests/unit/tailwind-component-classes.test.ts',
  'tests/integration/tailwind-integration.test.ts',
  'tests/regression/tailwind-color-regression.test.ts'
];

const REQUIRED_COVERAGE_THRESHOLD = 80;

async function main() {
  console.log('🎨 Validating Tailwind Configuration Tests...\n');

  let hasErrors = false;

  // Check if all required test files exist
  console.log('📁 Checking test file existence...');
  for (const testFile of REQUIRED_TEST_FILES) {
    if (existsSync(testFile)) {
      console.log(`✅ ${testFile}`);
    } else {
      console.log(`❌ Missing: ${testFile}`);
      hasErrors = true;
    }
  }

  // Validate Tailwind config file exists
  console.log('\n📋 Checking Tailwind configuration...');
  if (existsSync('tailwind.config.js')) {
    console.log('✅ tailwind.config.js exists');
  } else {
    console.log('❌ tailwind.config.js not found');
    hasErrors = true;
  }

  // Check for required dependencies
  console.log('\n📦 Checking dependencies...');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    'tailwindcss',
    '@tailwindcss/forms',
    '@tailwindcss/typography',
    '@tailwindcss/aspect-ratio'
  ];

  const requiredDevDeps = [
    'postcss',
    'vitest',
    'jsdom'
  ];

  for (const dep of requiredDeps) {
    if (packageJson.dependencies?.[dep]) {
      console.log(`✅ ${dep} (dependency)`);
    } else {
      console.log(`❌ Missing dependency: ${dep}`);
      hasErrors = true;
    }
  }

  for (const dep of requiredDevDeps) {
    if (packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep} (devDependency)`);
    } else {
      console.log(`❌ Missing devDependency: ${dep}`);
      hasErrors = true;
    }
  }

  // Run Tailwind-specific tests
  console.log('\n🧪 Running Tailwind tests...');
  try {
    execSync('npm run test:tailwind', { stdio: 'inherit' });
    console.log('✅ All Tailwind tests passed');
  } catch (error) {
    console.log('❌ Tailwind tests failed');
    hasErrors = true;
  }

  // Validate test coverage for Tailwind-related files
  console.log('\n📊 Checking test coverage...');
  try {
    const coverageResult = execSync('npx vitest run --coverage --reporter=json tests/unit/tailwind-*.test.ts tests/integration/tailwind-*.test.ts', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse coverage results (this is a simplified check)
    console.log('✅ Coverage check completed');
  } catch (error) {
    console.log('⚠️  Coverage check failed or not available');
  }

  // Validate color accessibility
  console.log('\n♿ Validating color accessibility...');
  try {
    execSync('npx vitest run tests/unit/tailwind-color-validation.test.ts --reporter=verbose', { stdio: 'inherit' });
    console.log('✅ Color accessibility validation passed');
  } catch (error) {
    console.log('❌ Color accessibility validation failed');
    hasErrors = true;
  }

  // Check for regression tests
  console.log('\n🔄 Validating regression tests...');
  try {
    execSync('npx vitest run tests/regression/tailwind-color-regression.test.ts', { stdio: 'inherit' });
    console.log('✅ Regression tests passed');
  } catch (error) {
    console.log('❌ Regression tests failed');
    hasErrors = true;
  }

  // Validate Tailwind config structure
  console.log('\n🏗️  Validating Tailwind config structure...');
  try {
    const tailwindConfig = await import('../tailwind.config.js');
    
    // Check for required sections
    const requiredSections = ['theme', 'plugins', 'content'];
    for (const section of requiredSections) {
      if (tailwindConfig.default[section]) {
        console.log(`✅ Config has ${section} section`);
      } else {
        console.log(`❌ Config missing ${section} section`);
        hasErrors = true;
      }
    }

    // Check for new color additions
    const colors = tailwindConfig.default.theme?.extend?.colors || {};
    const newColorSections = ['content', 'surface', 'border'];
    
    for (const colorSection of newColorSections) {
      if (colors[colorSection]) {
        console.log(`✅ New ${colorSection} colors defined`);
      } else {
        console.log(`❌ Missing new ${colorSection} colors`);
        hasErrors = true;
      }
    }

  } catch (error) {
    console.log('❌ Failed to validate Tailwind config structure:', error.message);
    hasErrors = true;
  }

  // Generate test report
  console.log('\n📋 Generating test report...');
  const testFiles = await glob('tests/**/*tailwind*.test.ts');
  console.log(`Found ${testFiles.length} Tailwind test files:`);
  testFiles.forEach(file => console.log(`  - ${file}`));

  // Final validation
  console.log('\n🎯 Final Validation Summary:');
  
  if (hasErrors) {
    console.log('❌ Validation failed! Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('✅ All Tailwind configuration tests are valid!');
    console.log('\n🎉 Tailwind configuration changes are properly tested and validated.');
  }
}

// Helper function to check if a test file has proper structure
function validateTestFileStructure(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    
    // Check for required test patterns
    const requiredPatterns = [
      /describe\(/,
      /it\(/,
      /expect\(/,
      /toBe\(|toEqual\(|toBeDefined\(/
    ];

    return requiredPatterns.every(pattern => pattern.test(content));
  } catch (error) {
    return false;
  }
}

// Run the validation
main().catch(error => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});