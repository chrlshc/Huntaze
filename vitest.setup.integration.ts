/**
 * Vitest Setup for Integration Tests
 * 
 * This file runs before each test file
 * 
 * NOTE: We use a REAL database for integration tests, not mocks.
 * Tests connect to the AWS RDS database specified in .env.test
 */

import { vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { mockFetch } from '@/tests/integration/setup/api-test-client';

// Store original fetch
let originalFetch: typeof global.fetch;

// Setup mock fetch before all tests
// This allows tests to call API routes directly without starting a server
beforeAll(() => {
  originalFetch = global.fetch;
  global.fetch = mockFetch as any;
  
  console.log('✅ Integration tests setup complete');
  console.log('📊 Using real database:', process.env.DATABASE_URL?.split('@')[1] || 'unknown');
});

// Restore original fetch after all tests
afterAll(() => {
  global.fetch = originalFetch;
  console.log('✅ Integration tests teardown complete');
});

// Clean up test data before each test
beforeEach(async () => {
  // Test cleanup is handled by individual test files
  // Each test should clean up its own data in beforeEach/afterEach
});
