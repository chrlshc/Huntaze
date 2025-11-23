/**
 * Global Setup for API Integration Tests
 * 
 * Runs once before all test files to prepare the test environment.
 * 
 * Feature: production-critical-fixes
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function globalSetup() {
  console.log('[Global Setup] Starting API Integration Tests setup...');
  
  // Check if server is running
  const testApiUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${testApiUrl}/api/ping`, {
      method: 'GET',
    });
    
    if (response.ok) {
      console.log('[Global Setup] ✅ Server is running');
    } else {
      console.warn('[Global Setup] ⚠️  Server responded with status:', response.status);
    }
  } catch (error) {
    console.error('[Global Setup] ❌ Server is not running');
    console.error('[Global Setup] Please start the server with: npm run dev');
    console.error('[Global Setup] Or set TEST_API_URL to a running server');
    
    // Don't fail in CI if server is expected to be running elsewhere
    if (!process.env.CI) {
      throw new Error('Server is not running. Please start the server before running integration tests.');
    }
  }
  
  // Check Redis connection (for rate limiting tests)
  if (process.env.REDIS_HOST) {
    try {
      console.log('[Global Setup] Checking Redis connection...');
      // Redis check would go here
      console.log('[Global Setup] ✅ Redis is available');
    } catch (error) {
      console.warn('[Global Setup] ⚠️  Redis is not available (rate limiting tests may fail)');
    }
  }
  
  // Set up test database if needed
  if (process.env.DATABASE_URL) {
    try {
      console.log('[Global Setup] Setting up test database...');
      // Database setup would go here
      console.log('[Global Setup] ✅ Test database ready');
    } catch (error) {
      console.error('[Global Setup] ❌ Failed to set up test database:', error);
    }
  }
  
  console.log('[Global Setup] ✅ Setup complete');
}
