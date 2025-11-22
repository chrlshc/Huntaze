/**
 * Global Setup for Integration Tests
 * 
 * This file runs once before all integration tests
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { setupMockFetch } from './api-test-client';

export async function setup() {
  // Setup code that runs before all tests
  console.log('Setting up integration tests...');
  
  // Load .env.test file with override to ensure test values take precedence
  const envPath = resolve(process.cwd(), '.env.test');
  const result = config({ path: envPath, override: true });
  
  if (result.error) {
    console.warn('Failed to load .env.test:', result.error.message);
  } else {
    console.log('Loaded .env.test successfully');
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
  }
  
  // Setup mock fetch for API tests
  console.log('Setting up mock fetch for API tests...');
  const cleanupFetch = setupMockFetch();
  
  return () => {
    // Teardown code that runs after all tests
    console.log('Tearing down integration tests...');
    cleanupFetch();
  };
}
