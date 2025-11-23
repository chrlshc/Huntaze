/**
 * Setup file for API Integration Tests
 * 
 * Runs before each test file to configure the test environment.
 * 
 * Feature: production-critical-fixes
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Environment setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  
  // Set default test API URL if not provided
  if (!process.env.TEST_API_URL) {
    process.env.TEST_API_URL = 'http://localhost:3000';
  }
  
  // Disable console logs in CI
  if (process.env.CI) {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
  
  console.log('[Setup] API Integration Tests initialized');
  console.log(`[Setup] Test API URL: ${process.env.TEST_API_URL}`);
  console.log(`[Setup] Node Environment: ${process.env.NODE_ENV}`);
});

// Cleanup after all tests
afterAll(() => {
  console.log('[Teardown] API Integration Tests completed');
});

// Reset state before each test
beforeEach(() => {
  // Clear any cached data
  // Reset timers if needed
});

// Cleanup after each test
afterEach(() => {
  // Clean up any resources
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Setup] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Setup] Uncaught Exception:', error);
});
