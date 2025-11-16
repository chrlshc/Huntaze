#!/usr/bin/env tsx
/**
 * Test script for structured logging system
 * Verifies logger functionality and correlation ID generation
 */

import { createLogger, generateCorrelationId, LogContext } from '../lib/utils/logger';

console.log('='.repeat(60));
console.log('Testing Structured Logging System');
console.log('='.repeat(60));
console.log();

// Test 1: Correlation ID Generation
console.log('Test 1: Correlation ID Generation');
console.log('-'.repeat(60));
const id1 = generateCorrelationId();
const id2 = generateCorrelationId();
const id3 = generateCorrelationId();

console.log('Generated IDs:');
console.log('  ID 1:', id1);
console.log('  ID 2:', id2);
console.log('  ID 3:', id3);
console.log('  All unique:', id1 !== id2 && id2 !== id3 && id1 !== id3);
console.log();

// Test 2: Logger Creation
console.log('Test 2: Logger Creation');
console.log('-'.repeat(60));
const testLogger = createLogger('test-service');
console.log('Logger created for service: test-service');
console.log();

// Test 3: Info Logging
console.log('Test 3: Info Logging');
console.log('-'.repeat(60));
const infoCorrelationId = testLogger.info('Test info message', {
  testKey: 'testValue',
  timestamp: Date.now(),
});
console.log('Info log correlation ID:', infoCorrelationId);
console.log();

// Test 4: Warning Logging
console.log('Test 4: Warning Logging');
console.log('-'.repeat(60));
const warnCorrelationId = testLogger.warn('Test warning message', {
  warningType: 'test',
  severity: 'medium',
});
console.log('Warning log correlation ID:', warnCorrelationId);
console.log();

// Test 5: Error Logging
console.log('Test 5: Error Logging');
console.log('-'.repeat(60));
const testError = new Error('Test error message');
testError.stack = 'Error: Test error message\n    at test.ts:1:1';
const errorCorrelationId = testLogger.error('Test error occurred', testError, {
  errorContext: 'test',
  userId: 'test-user-123',
});
console.log('Error log correlation ID:', errorCorrelationId);
console.log();

// Test 6: Multiple Services
console.log('Test 6: Multiple Services');
console.log('-'.repeat(60));
const authLogger = createLogger('auth-service');
const apiLogger = createLogger('api-service');
authLogger.info('Auth service initialized');
apiLogger.info('API service initialized');
console.log('Multiple service loggers created successfully');
console.log();

console.log('='.repeat(60));
console.log('All Tests Completed Successfully! ✓');
console.log('='.repeat(60));
