#!/usr/bin/env node

/**
 * Check if tw-v3-shims.css or bracket-style var() sneaks back
 * Intentionally fails when the shim/import still exists
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

let hasIssues = false;

// Check 1: tw-v3-shims.css should not exist
if (existsSync('app/styles/tw-v3-shims.css')) {
  log('❌ tw-v3-shims.css still exists!', 'red');
  hasIssues = true;
} else {
  log('✅ tw-v3-shims.css removed', 'green');
}

// Check 2: globals.css should not import tw-v3-shims.css
if (existsSync('app/globals.css')) {
  const globalsContent = readFileSync('app/globals.css', 'utf8');
  if (globalsContent.includes('tw-v3-shims.css')) {
    log('❌ globals.css still imports tw-v3-shims.css!', 'red');
    hasIssues = true;
  } else {
    log('✅ tw-v3-shims.css import removed from globals.css', 'green');
  }
}

// Check 3: No bracket-style var() should remain
try {
  const result = execSync('rg -n "\\[var\\(--[^)]+\\)\\]" --type ts --type tsx --type js --type jsx --type css 2>/dev/null || true', { encoding: 'utf8' });
  if (result.trim()) {
    log('❌ Found bracket-style var() usage:', 'red');
    log(result, 'yellow');
    hasIssues = true;
  } else {
    log('✅ No bracket-style var() usage found', 'green');
  }
} catch (error) {
  // Fallback if rg is not available
  log('⚠️ Could not check for bracket-style var() (ripgrep not available)', 'yellow');
}

// Summary
if (hasIssues) {
  log('\n❌ SHIMLESS CHECK FAILED', 'red');
  log('Please fix the issues above before proceeding.', 'red');
  process.exit(1);
} else {
  log('\n✅ SHIMLESS CHECK PASSED', 'green');
  log('All Tailwind v3 shims have been successfully removed!', 'green');
  process.exit(0);
}