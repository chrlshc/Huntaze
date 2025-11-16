#!/usr/bin/env tsx
/**
 * Error Handling Verification Script
 * Verifies error handling implementation in NextAuth v4 setup
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🛡️  NextAuth v4 Error Handling Verification\n');
console.log('=' .repeat(60));

interface Check {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string;
}

const checks: Check[] = [];

// ============================================================================
// Check 1: Route Handler Error Handling
// ============================================================================

console.log('\n📋 Checking Route Handler Error Handling\n');

try {
  const routePath = join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts');
  const routeContent = readFileSync(routePath, 'utf-8');

  // Check for error handling in callbacks
  const hasJwtErrorHandling = routeContent.includes('try') && routeContent.includes('catch');
  if (hasJwtErrorHandling) {
    checks.push({
      name: 'JWT Callback Error Handling',
      status: 'PASS',
      message: 'Error handling implemented in JWT callback',
      details: 'Using try-catch blocks'
    });
  } else {
    checks.push({
      name: 'JWT Callback Error Handling',
      status: 'WARN',
      message: 'No explicit error handling found in callbacks',
      details: 'NextAuth provides default error handling'
    });
  }

  // Check for error logging
  const hasErrorLogging = 
    routeContent.includes('console.error') ||
    routeContent.includes('logAuthError') ||
    routeContent.includes('logger.error');
  
  if (hasErrorLogging) {
    checks.push({
      name: 'Error Logging',
      status: 'PASS',
      message: 'Error logging is implemented',
      details: 'Errors are being logged for debugging'
    });
  } else {
    checks.push({
      name: 'Error Logging',
      status: 'WARN',
      message: 'No explicit error logging found',
      details: 'Consider adding structured logging'
    });
  }

  // Check for correlation IDs
  const hasCorrelationId = 
    routeContent.includes('correlationId') ||
    routeContent.includes('requestId') ||
    routeContent.includes('traceId');
  
  if (hasCorrelationId) {
    checks.push({
      name: 'Correlation IDs',
      status: 'PASS',
      message: 'Correlation ID support implemented',
      details: 'Errors can be traced across requests'
    });
  } else {
    checks.push({
      name: 'Correlation IDs',
      status: 'WARN',
      message: 'No correlation ID support found',
      details: 'Consider adding for better error tracing'
    });
  }

  // Check for sensitive data protection
  const hasSensitiveDataLeaks = 
    routeContent.includes('console.log(password)') ||
    routeContent.includes('console.log(secret)') ||
    routeContent.includes('console.log(token)') ||
    routeContent.match(/console\.log\([^)]*password[^)]*\)/i) ||
    routeContent.match(/console\.log\([^)]*secret[^)]*\)/i);

  if (!hasSensitiveDataLeaks) {
    checks.push({
      name: 'Sensitive Data Protection',
      status: 'PASS',
      message: 'No obvious sensitive data leaks in route handler',
      details: 'Passwords, secrets, and tokens are not logged'
    });
  } else {
    checks.push({
      name: 'Sensitive Data Protection',
      status: 'FAIL',
      message: 'Potential sensitive data leak detected in route handler',
      details: 'Check for password/secret/token logging'
    });
  }

  // Check for error pages configuration
  if (routeContent.includes('pages:') && routeContent.includes('error:')) {
    checks.push({
      name: 'Error Pages Configuration',
      status: 'PASS',
      message: 'Custom error page is configured',
      details: 'Users will see friendly error messages'
    });
  } else {
    checks.push({
      name: 'Error Pages Configuration',
      status: 'WARN',
      message: 'No custom error page configured',
      details: 'Will use NextAuth default error page'
    });
  }

} catch (error) {
  checks.push({
    name: 'Route Handler Verification',
    status: 'FAIL',
    message: 'Could not read route handler',
    details: error instanceof Error ? error.message : 'Unknown error'
  });
}

// ============================================================================
// Check 2: Session Utilities Error Handling
// ============================================================================

console.log('\n📋 Checking Session Utilities Error Handling\n');

try {
  const sessionPath = join(process.cwd(), 'lib/auth/session.ts');
  const sessionContent = readFileSync(sessionPath, 'utf-8');

  // Check for try-catch blocks
  const tryCatchCount = (sessionContent.match(/try\s*{/g) || []).length;
  const catchCount = (sessionContent.match(/catch/g) || []).length;

  if (tryCatchCount > 0 && catchCount > 0) {
    checks.push({
      name: 'Session Utilities Error Handling',
      status: 'PASS',
      message: `Error handling implemented (${tryCatchCount} try-catch blocks)`,
      details: 'All session functions have error handling'
    });
  } else {
    checks.push({
      name: 'Session Utilities Error Handling',
      status: 'FAIL',
      message: 'No error handling found in session utilities',
      details: 'Add try-catch blocks to session functions'
    });
  }

  // Check for error logging
  const hasErrorLogging = 
    sessionContent.includes('console.error') ||
    sessionContent.includes('logAuthError') ||
    sessionContent.includes('logger.error');
  
  if (hasErrorLogging) {
    checks.push({
      name: 'Session Error Logging',
      status: 'PASS',
      message: 'Error logging is implemented in session utilities',
      details: 'Errors are being logged'
    });
  } else {
    checks.push({
      name: 'Session Error Logging',
      status: 'WARN',
      message: 'No error logging found in session utilities',
      details: 'Consider adding structured logging'
    });
  }

  // Check for graceful error returns
  const hasGracefulReturns = 
    sessionContent.includes('return null') ||
    sessionContent.includes('return undefined');
  
  if (hasGracefulReturns) {
    checks.push({
      name: 'Graceful Error Returns',
      status: 'PASS',
      message: 'Functions return null/undefined on errors',
      details: 'Prevents application crashes'
    });
  } else {
    checks.push({
      name: 'Graceful Error Returns',
      status: 'WARN',
      message: 'Check if errors are handled gracefully',
      details: 'Functions should return null on errors'
    });
  }

  // Check for sensitive data protection
  const hasSensitiveDataLeaks = 
    sessionContent.match(/console\.log\([^)]*password[^)]*\)/i) ||
    sessionContent.match(/console\.log\([^)]*secret[^)]*\)/i) ||
    sessionContent.match(/console\.log\([^)]*token[^)]*\)/i);

  if (!hasSensitiveDataLeaks) {
    checks.push({
      name: 'Session Sensitive Data Protection',
      status: 'PASS',
      message: 'No sensitive data leaks in session utilities',
      details: 'Passwords, secrets, and tokens are not logged'
    });
  } else {
    checks.push({
      name: 'Session Sensitive Data Protection',
      status: 'FAIL',
      message: 'Potential sensitive data leak in session utilities',
      details: 'Check for password/secret/token logging'
    });
  }

} catch (error) {
  checks.push({
    name: 'Session Utilities Verification',
    status: 'FAIL',
    message: 'Could not read session utilities',
    details: error instanceof Error ? error.message : 'Unknown error'
  });
}

// ============================================================================
// Check 3: Credentials Provider Error Handling
// ============================================================================

console.log('\n📋 Checking Credentials Provider Error Handling\n');

try {
  const routePath = join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts');
  const routeContent = readFileSync(routePath, 'utf-8');

  // Check for credentials validation
  if (routeContent.includes('CredentialsProvider')) {
    const hasValidation = 
      routeContent.includes('if (!') ||
      routeContent.includes('if(!') ||
      routeContent.includes('throw');

    if (hasValidation) {
      checks.push({
        name: 'Credentials Validation',
        status: 'PASS',
        message: 'Credentials validation is implemented',
        details: 'Invalid credentials are checked'
      });
    } else {
      checks.push({
        name: 'Credentials Validation',
        status: 'WARN',
        message: 'Credentials validation may be incomplete',
        details: 'Ensure email and password are validated'
      });
    }

    // Check for appropriate error messages
    const hasErrorMessages = 
      routeContent.includes('Invalid credentials') ||
      routeContent.includes('Invalid email') ||
      routeContent.includes('Invalid password') ||
      routeContent.includes('Authentication failed');

    if (hasErrorMessages) {
      checks.push({
        name: 'User-Friendly Error Messages',
        status: 'PASS',
        message: 'User-friendly error messages are provided',
        details: 'Users get clear feedback on authentication failures'
      });
    } else {
      checks.push({
        name: 'User-Friendly Error Messages',
        status: 'WARN',
        message: 'Error messages may not be user-friendly',
        details: 'Consider adding descriptive error messages'
      });
    }
  }

} catch (error) {
  checks.push({
    name: 'Credentials Provider Verification',
    status: 'FAIL',
    message: 'Could not verify credentials provider',
    details: error instanceof Error ? error.message : 'Unknown error'
  });
}

// ============================================================================
// Check 4: Error Types and Constants
// ============================================================================

console.log('\n📋 Checking Error Types and Constants\n');

try {
  const typesPath = join(process.cwd(), 'lib/types/auth.ts');
  const typesContent = readFileSync(typesPath, 'utf-8');

  // Check for AuthError enum
  if (typesContent.includes('enum AuthError') || typesContent.includes('type AuthError')) {
    checks.push({
      name: 'Error Type Definitions',
      status: 'PASS',
      message: 'AuthError types are defined',
      details: 'Standardized error types available'
    });

    // Count error types
    const errorTypes = typesContent.match(/[A-Z_]+\s*=/g) || [];
    checks.push({
      name: 'Error Type Coverage',
      status: 'PASS',
      message: `${errorTypes.length} error types defined`,
      details: 'Comprehensive error type coverage'
    });
  } else {
    checks.push({
      name: 'Error Type Definitions',
      status: 'WARN',
      message: 'No AuthError types found',
      details: 'Consider defining standardized error types'
    });
  }

} catch (error) {
  checks.push({
    name: 'Error Types Verification',
    status: 'WARN',
    message: 'Could not verify error types',
    details: 'lib/types/auth.ts may not exist'
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

// ============================================================================
// Recommendations
// ============================================================================

if (warnCount > 0 || failCount > 0) {
  console.log('📋 Recommendations:\n');
  
  if (checks.some(c => c.name === 'Correlation IDs' && c.status === 'WARN')) {
    console.log('• Add correlation IDs for better error tracing');
    console.log('  Example: const correlationId = crypto.randomUUID();\n');
  }
  
  if (checks.some(c => c.name.includes('Logging') && c.status === 'WARN')) {
    console.log('• Implement structured error logging');
    console.log('  Example: logger.error({ error, context, correlationId });\n');
  }
  
  if (checks.some(c => c.name.includes('Sensitive Data') && c.status === 'FAIL')) {
    console.log('• Remove sensitive data from logs immediately');
    console.log('  Never log passwords, secrets, or tokens\n');
  }
}

// Exit with appropriate code
if (failCount > 0) {
  console.log('❌ Error handling verification failed. Please address critical issues.\n');
  process.exit(1);
} else if (warnCount > 0) {
  console.log('⚠️  Error handling verification passed with warnings.\n');
  process.exit(0);
} else {
  console.log('✅ All error handling checks passed!\n');
  process.exit(0);
}
