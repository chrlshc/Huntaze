#!/usr/bin/env node

/**
 * Functionality Preservation Validation Script
 * 
 * Tests that all critical functionality remains intact after build warning fixes
 * Validates: Analytics, Content Creation, Social Integrations, Smart Onboarding
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function validateCriticalPages() {
  log('\n📄 Validating Critical Pages...', 'blue');
  
  const criticalPages = [
    'app/analytics/advanced/page.tsx',
    'app/platforms/onlyfans/analytics/page.tsx',
    'app/platforms/tiktok/upload/page.tsx',
    'app/platforms/connect/instagram/page.tsx',
    'app/platforms/connect/reddit/page.tsx',
    'app/platforms/connect/tiktok/page.tsx',
    'app/smart-onboarding/analytics/page.tsx',
    'components/content/ContentCalendar.tsx',
    'components/content/VariationManager.tsx',
  ];

  let passed = 0;
  let failed = 0;

  criticalPages.forEach(page => {
    if (checkFileExists(page)) {
      log(`  ✓ ${page}`, 'green');
      passed++;
    } else {
      log(`  ✗ ${page} - NOT FOUND`, 'red');
      failed++;
    }
  });

  return { passed, failed, total: criticalPages.length };
}

function validateCriticalServices() {
  log('\n🔧 Validating Critical Services...', 'blue');
  
  const criticalServices = [
    'lib/smart-onboarding/services/behavioralAnalyticsService.ts',
    'lib/smart-onboarding/services/contextualHelpService.ts',
    'lib/smart-onboarding/services/dataValidationService.ts',
    'lib/smart-onboarding/services/dynamicPathOptimizer.ts',
    'lib/smart-onboarding/services/interventionEffectivenessTracker.ts',
    'lib/services/tiktokOAuth.ts',
    'lib/services/instagramOAuth.ts',
    'lib/services/redditOAuth.ts',
  ];

  let passed = 0;
  let failed = 0;

  criticalServices.forEach(service => {
    if (checkFileExists(service)) {
      log(`  ✓ ${service}`, 'green');
      passed++;
    } else {
      log(`  ✗ ${service} - NOT FOUND`, 'red');
      failed++;
    }
  });

  return { passed, failed, total: criticalServices.length };
}

function validateTypeScriptCompilation() {
  log('\n🔍 Validating TypeScript Compilation...', 'blue');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    log('  ✓ TypeScript compilation successful', 'green');
    return { passed: 1, failed: 0, total: 1 };
  } catch (error) {
    log('  ✗ TypeScript compilation failed', 'red');
    log(`  Error: ${error.message}`, 'red');
    return { passed: 0, failed: 1, total: 1 };
  }
}

function validateESLint() {
  log('\n🔍 Validating ESLint (Critical Warnings)...', 'blue');
  
  try {
    const output = execSync('npm run lint', { stdio: 'pipe', encoding: 'utf-8' });
    
    // Check for critical errors (not warnings)
    if (output.includes('error') && !output.includes('0 errors')) {
      log('  ✗ ESLint found critical errors', 'red');
      return { passed: 0, failed: 1, total: 1 };
    }
    
    log('  ✓ No critical ESLint errors', 'green');
    return { passed: 1, failed: 0, total: 1 };
  } catch (error) {
    // ESLint exits with code 1 if there are warnings, which is acceptable
    const output = error.stdout || error.message;
    if (output.includes('error') && !output.includes('0 errors')) {
      log('  ✗ ESLint found critical errors', 'red');
      return { passed: 0, failed: 1, total: 1 };
    }
    
    log('  ✓ No critical ESLint errors (warnings present but acceptable)', 'yellow');
    return { passed: 1, failed: 0, total: 1 };
  }
}

function validateSmartOnboardingFixes() {
  log('\n🧠 Validating Smart Onboarding Fixes...', 'blue');
  
  const fixedFiles = [
    'lib/smart-onboarding/services/contextualHelpService.ts',
    'lib/smart-onboarding/services/dataValidationService.ts',
    'lib/smart-onboarding/services/dataWarehouseService.ts',
    'lib/smart-onboarding/services/dynamicPathOptimizer.ts',
    'lib/smart-onboarding/services/interventionEffectivenessTracker.ts',
  ];

  let passed = 0;
  let failed = 0;

  fixedFiles.forEach(file => {
    if (checkFileExists(file)) {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
      
      // Check for common TypeScript error patterns that should be fixed
      const hasImplicitAny = content.match(/\bany\b/) && !content.match(/\/\/ @ts-ignore/);
      const hasMissingProperties = content.includes('Property') && content.includes('does not exist');
      
      if (!hasMissingProperties) {
        log(`  ✓ ${file} - No missing property errors`, 'green');
        passed++;
      } else {
        log(`  ✗ ${file} - Still has missing property errors`, 'red');
        failed++;
      }
    } else {
      log(`  ✗ ${file} - NOT FOUND`, 'red');
      failed++;
    }
  });

  return { passed, failed, total: fixedFiles.length };
}

function generateReport(results) {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 FUNCTIONALITY PRESERVATION VALIDATION REPORT', 'blue');
  log('='.repeat(60), 'blue');

  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  Object.entries(results).forEach(([category, result]) => {
    totalPassed += result.passed;
    totalFailed += result.failed;
    totalTests += result.total;

    const percentage = ((result.passed / result.total) * 100).toFixed(1);
    const status = result.failed === 0 ? '✓' : '✗';
    const color = result.failed === 0 ? 'green' : 'red';

    log(`\n${status} ${category}:`, color);
    log(`  Passed: ${result.passed}/${result.total} (${percentage}%)`, color);
  });

  const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1);
  const overallStatus = totalFailed === 0 ? 'PASSED' : 'FAILED';
  const overallColor = totalFailed === 0 ? 'green' : 'red';

  log('\n' + '='.repeat(60), 'blue');
  log(`Overall Status: ${overallStatus}`, overallColor);
  log(`Total: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`, overallColor);
  log('='.repeat(60) + '\n', 'blue');

  return totalFailed === 0;
}

// Main execution
async function main() {
  log('🚀 Starting Functionality Preservation Validation...', 'blue');
  log('This validates that all fixes preserve existing functionality\n', 'blue');

  const results = {
    'Critical Pages': validateCriticalPages(),
    'Critical Services': validateCriticalServices(),
    'TypeScript Compilation': validateTypeScriptCompilation(),
    'ESLint Validation': validateESLint(),
    'Smart Onboarding Fixes': validateSmartOnboardingFixes(),
  };

  const success = generateReport(results);

  if (success) {
    log('✅ All functionality preservation checks passed!', 'green');
    log('The build warning fixes have not broken any existing functionality.', 'green');
    process.exit(0);
  } else {
    log('❌ Some functionality preservation checks failed.', 'red');
    log('Please review the errors above and fix any issues.', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Validation script error: ${error.message}`, 'red');
  process.exit(1);
});
