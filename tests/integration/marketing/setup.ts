/**
 * Marketing API Integration Tests - Setup
 * 
 * Test utilities and configuration for marketing API tests
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';

// Test configuration
export const TEST_CONFIG = {
  baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
  timeout: 10000,
  retries: 2,
};

// Mock session for authenticated requests
export const mockSession = {
  user: {
    id: 'test_creator_123',
    email: 'test@example.com',
    name: 'Test Creator',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Test creator IDs
export const TEST_CREATORS = {
  valid: 'test_creator_123',
  invalid: 'invalid_creator_456',
  unauthorized: 'other_creator_789',
};

// Helper to create authenticated request headers
export function createAuthHeaders(sessionToken?: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Cookie': `next-auth.session-token=${sessionToken || 'mock_session_token'}`,
    'X-Correlation-ID': `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  };
}

// Helper to make API requests
export async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...createAuthHeaders(),
      ...options.headers,
    },
  });

  return response;
}

// Helper to parse JSON response
export async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  
  if (!text) {
    throw new Error('Empty response body');
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${text}`);
  }
}

// Helper to wait for async operations
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Setup and teardown
let testServer: any;

beforeAll(async () => {
  console.log('[Test Setup] Starting test environment...');
  
  // Initialize test database if needed
  // await initTestDatabase();
  
  // Start test server if needed
  // testServer = await startTestServer();
});

afterAll(async () => {
  console.log('[Test Teardown] Cleaning up test environment...');
  
  // Cleanup test database
  // await cleanupTestDatabase();
  
  // Stop test server
  // if (testServer) {
  //   await testServer.close();
  // }
});

beforeEach(async () => {
  // Reset test data before each test
  // await resetTestData();
});

// Rate limiting helpers
export class RateLimitTester {
  private requestCount = 0;
  private resetTime = Date.now() + 60000; // 1 minute

  async makeRequest(endpoint: string): Promise<Response> {
    this.requestCount++;
    return makeRequest(endpoint);
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  reset(): void {
    this.requestCount = 0;
    this.resetTime = Date.now() + 60000;
  }
}

// Concurrent request helper
export async function makeConcurrentRequests(
  endpoint: string,
  count: number,
  options?: RequestInit
): Promise<Response[]> {
  const promises = Array.from({ length: count }, () =>
    makeRequest(endpoint, options)
  );
  
  return Promise.all(promises);
}

// Validation helpers
export function validateResponseHeaders(response: Response): void {
  // Check for security headers
  const headers = response.headers;
  
  // Should have correlation ID
  if (!headers.get('x-correlation-id') && !headers.get('X-Correlation-ID')) {
    console.warn('Missing correlation ID in response headers');
  }
}

export function validateErrorResponse(data: any): void {
  if (!data.error) {
    throw new Error('Error response missing "error" field');
  }
  
  if (typeof data.error !== 'string') {
    throw new Error('Error message should be a string');
  }
}

// Mock data generators
export function generateMockCampaign(overrides?: Partial<any>) {
  return {
    id: `camp_${Date.now()}`,
    name: 'Test Campaign',
    status: 'draft',
    channel: 'email',
    goal: 'engagement',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function generateMockCampaigns(count: number) {
  return Array.from({ length: count }, (_, i) =>
    generateMockCampaign({ id: `camp_${i + 1}`, name: `Campaign ${i + 1}` })
  );
}
