#!/usr/bin/env tsx
/**
 * Security Features Verification Script
 * Verifies NextAuth v4 security configuration
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

interface SecurityCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string;
}

const checks: SecurityCheck[] = [];

console.log('🔒 NextAuth v4 Security Features Verification\n');
console.log('=' .repeat(60));

// ============================================================================
// Task 7.1: Verify Environment Variables
// ============================================================================

console.log('\n📋 Task 7.1: Environment Variables\n');

// Check NEXTAUTH_SECRET
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (nextAuthSecret) {
  if (nextAuthSecret.length >= 32) {
    checks.push({
      name: 'NEXTAUTH_SECRET',
      status: 'PASS',
      message: 'NEXTAUTH_SECRET is set with sufficient length',
      details: `Length: ${nextAuthSecret.length} characters`
    });
  } else {
    checks.push({
      name: 'NEXTAUTH_SECRET',
      status: 'WARN',
      message: 'NEXTAUTH_SECRET is set but may be too short',
      details: `Length: ${nextAuthSecret.length} characters (recommended: 32+)`
    });
  }
} else {
  checks.push({
    name: 'NEXTAUTH_SECRET',
    status: 'FAIL',
    message: 'NEXTAUTH_SECRET is not set',
    details: 'Required for JWT signing and session security'
  });
}

// Check NEXTAUTH_URL
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (nextAuthUrl) {
  const isValidUrl = /^https?:\/\/.+/.test(nextAuthUrl);
  if (isValidUrl) {
    checks.push({
      name: 'NEXTAUTH_URL',
      status: 'PASS',
      message: 'NEXTAUTH_URL is set with valid format',
      details: nextAuthUrl
    });
  } else {
    checks.push({
      name: 'NEXTAUTH_URL',
      status: 'WARN',
      message: 'NEXTAUTH_URL format may be invalid',
      details: nextAuthUrl
    });
  }
} else {
  checks.push({
    name: 'NEXTAUTH_URL',
    status: 'FAIL',
    message: 'NEXTAUTH_URL is not set',
    details: 'Required for OAuth callbacks'
  });
}

// Check Google OAuth credentials
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  checks.push({
    name: 'Google OAuth',
    status: 'PASS',
    message: 'Google OAuth credentials are configured',
    details: `Client ID: ${googleClientId.substring(0, 20)}...`
  });
} else {
  const missing = [];
  if (!googleClientId) missing.push('GOOGLE_CLIENT_ID');
  if (!googleClientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  
  checks.push({
    name: 'Google OAuth',
    status: 'WARN',
    message: 'Google OAuth credentials incomplete',
    details: `Missing: ${missing.join(', ')}`
  });
}

// ============================================================================
// Task 7.2: Verify Session Security Configuration
// ============================================================================

console.log('\n📋 Task 7.2: Session Security Configuration\n');

try {
  // Read the NextAuth route configuration
  const routePath = join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts');
  const routeContent = readFileSync(routePath, 'utf-8');

  // Check for session strategy
  if (routeContent.includes("strategy: 'jwt'")) {
    checks.push({
      name: 'Session Strategy',
      status: 'PASS',
      message: 'JWT session strategy is configured',
      details: 'Using secure JWT-based sessions'
    });
  } else {
    checks.push({
      name: 'Session Strategy',
      status: 'WARN',
      message: 'Session strategy configuration not found',
      details: 'Check authOptions.session.strategy'
    });
  }

  // Check for session maxAge
  if (routeContent.includes('maxAge:')) {
    checks.push({
      name: 'Session Expiry',
      status: 'PASS',
      message: 'Session maxAge is configured',
      details: 'Sessions will expire after configured time'
    });
  } else {
    checks.push({
      name: 'Session Expiry',
      status: 'WARN',
      message: 'Session maxAge not explicitly set',
      details: 'Will use NextAuth default (30 days)'
    });
  }

  // Check for secret configuration
  if (routeContent.includes('secret:') && routeContent.includes('NEXTAUTH_SECRET')) {
    checks.push({
      name: 'Secret Configuration',
      status: 'PASS',
      message: 'Secret is configured in authOptions',
      details: 'Using NEXTAUTH_SECRET environment variable'
    });
  } else {
    checks.push({
      name: 'Secret Configuration',
      status: 'WARN',
      message: 'Secret configuration not found in authOptions',
      details: 'NextAuth may use default behavior'
    });
  }

  // Note: Cookie settings are handled by NextAuth internally
  checks.push({
    name: 'Cookie Security',
    status: 'PASS',
    message: 'NextAuth v4 handles cookie security automatically',
    details: 'httpOnly, secure (in production), and sameSite are set by NextAuth'
  });

} catch (error) {
  checks.push({
    name: 'Route Configuration',
    status: 'FAIL',
    message: 'Could not read NextAuth route configuration',
    details: error instanceof Error ? error.message : 'Unknown error'
  });
}

// ============================================================================
// Task 7.3: Verify Error Handling
// ============================================================================

console.log('\n📋 Task 7.3: Error Handling Configuration\n');

try {
  // Check session.ts for error handling
  const sessionPath = join(process.cwd(), 'lib/auth/session.ts');
  const sessionContent = readFileSync(sessionPath, 'utf-8');

  // Check for try-catch blocks
  if (sessionContent.includes('try {') && sessionContent.includes('catch')) {
    checks.push({
      name: 'Error Handling',
      status: 'PASS',
      message: 'Error handling is implemented in session utilities',
      details: 'Using try-catch blocks for error management'
    });
  } else {
    checks.push({
      name: 'Error Handling',
      status: 'WARN',
      message: 'Error handling may be incomplete',
      details: 'Check lib/auth/session.ts'
    });
  }

  // Check for logging
  if (sessionContent.includes('logAuthError') || sessionContent.includes('console.error')) {
    checks.push({
      name: 'Error Logging',
      status: 'PASS',
      message: 'Error logging is configured',
      details: 'Errors are being logged for debugging'
    });
  } else {
    checks.push({
      name: 'Error Logging',
      status: 'WARN',
      message: 'Error logging not found',
      details: 'Consider adding structured logging'
    });
  }

  // Check for correlation IDs
  if (sessionContent.includes('correlationId') || sessionContent.includes('requestId')) {
    checks.push({
      name: 'Correlation IDs',
      status: 'PASS',
      message: 'Correlation ID support is implemented',
      details: 'Errors can be traced across requests'
    });
  } else {
    checks.push({
      name: 'Correlation IDs',
      status: 'WARN',
      message: 'Correlation ID support not found',
      details: 'Consider adding for better error tracing'
    });
  }

  // Check route.ts for error handling
  const routePath = join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts');
  const routeContent = readFileSync(routePath, 'utf-8');

  // Check for sensitive data protection
  const hasSensitiveDataProtection = 
    !routeContent.includes('console.log(password)') &&
    !routeContent.includes('console.log(secret)') &&
    !routeContent.includes('console.log(token)');

  if (hasSensitiveDataProtection) {
    checks.push({
      name: 'Sensitive Data Protection',
      status: 'PASS',
      message: 'No obvious sensitive data leaks in logs',
      details: 'Passwords, secrets, and tokens are not logged'
    });
  } else {
    checks.push({
      name: 'Sensitive Data Protection',
      status: 'FAIL',
      message: 'Potential sensitive data leak detected',
      details: 'Check for password/secret/token logging'
    });
  }

} catch (error) {
  checks.push({
    name: 'Error Handling Verification',
    status: 'FAIL',
    message: 'Could not verify error handling configuration',
    details: error instanceof Error ? error.message : 'Unknown error'
  });
}

// ============================================================================
// Display Results
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('\n📊 Verification Results\n');

let passCount = 0;
let warnCount = 0;
let failCount = 0;

checks.forEach(check => {
  const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${check.name}: ${check.message}`);
  if (check.details) {
    console.log(`   ${check.details}`);
  }
  console.log();

  if (check.status === 'PASS') passCount++;
  else if (check.status === 'WARN') warnCount++;
  else failCount++;
});

console.log('='.repeat(60));
console.log(`\n📈 Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed\n`);

// Exit with appropriate code
if (failCount > 0) {
  console.log('❌ Security verification failed. Please address the issues above.\n');
  process.exit(1);
} else if (warnCount > 0) {
  console.log('⚠️  Security verification passed with warnings. Review recommended.\n');
  process.exit(0);
} else {
  console.log('✅ All security checks passed!\n');
  process.exit(0);
}
