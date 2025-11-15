/**
 * Global Setup for Integration Tests
 * 
 * Runs once before all integration tests
 */

import { MockRedis } from './mock-redis';
import { spawn, ChildProcess } from 'child_process';

export let mockRedis: MockRedis;
let devServer: ChildProcess | null = null;

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

export async function setup() {
  console.log('[Global Setup] Initializing integration test environment...');

  // Initialize mock Redis
  mockRedis = new MockRedis();
  console.log('[Global Setup] Mock Redis initialized');

  // Verify environment variables
  if (!process.env.TEST_BASE_URL) {
    process.env.TEST_BASE_URL = 'http://localhost:3000';
  }

  const baseUrl = process.env.TEST_BASE_URL;
  console.log('[Global Setup] Base URL:', baseUrl);

  // Check if server is already running
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) {
      console.log('[Global Setup] ✅ Server already running');
      console.log('[Global Setup] Setup complete');
      return;
    }
  } catch {
    // Server not running
    console.warn('[Global Setup] ⚠️  Server not running on', baseUrl);
    console.warn('[Global Setup] ⚠️  Please start manually: npm run dev');
    console.warn('[Global Setup] ⚠️  Tests requiring server will be skipped');
  }

  console.log('[Global Setup] Setup complete');
}

export async function teardown() {
  console.log('[Global Teardown] Cleaning up integration test environment...');
  
  if (mockRedis) {
    mockRedis.clear();
  }

  // Stop dev server if we started it
  if (devServer) {
    console.log('[Global Teardown] Stopping dev server...');
    devServer.kill('SIGTERM');
    
    // Wait a bit for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force kill if still running
    if (!devServer.killed) {
      devServer.kill('SIGKILL');
    }
  }
  
  console.log('[Global Teardown] Cleanup complete');
}
