/**
 * Test Setup - Messages API Integration Tests
 * 
 * Setup utilities and helpers for messages tests
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Mock session for authenticated requests
export const mockSession = {
  user: {
    id: 'creator_test_123',
    email: 'test@example.com',
    name: 'Test Creator',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock unauthorized session
export const mockUnauthorizedSession = null;

// Mock different creator session (for forbidden tests)
export const mockDifferentCreatorSession = {
  user: {
    id: 'creator_different_456',
    email: 'different@example.com',
    name: 'Different Creator',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Setup function to run before all tests
export function setupMessagesTests() {
  beforeAll(() => {
    console.log('🧪 Starting Messages API Integration Tests');
  });

  afterAll(() => {
    console.log('✅ Messages API Integration Tests Complete');
  });

  beforeEach(() => {
    // Reset any test state
  });

  afterEach(() => {
    // Cleanup after each test
  });
}

// Helper to create authenticated request headers
export function createAuthHeaders(session = mockSession) {
  return {
    'Content-Type': 'application/json',
    'Cookie': `next-auth.session-token=${session ? 'valid-token' : 'invalid-token'}`,
  };
}

// Helper to create request with query params
export function createRequestUrl(
  baseUrl: string,
  params: Record<string, string | number | boolean>
): string {
  const url = new URL(baseUrl, 'http://localhost:3000');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  return url.toString();
}

// Helper to wait for async operations
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to retry failed requests
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await wait(delay * attempt);
      }
    }
  }

  throw lastError;
}

// Helper to mock fetch responses
export function mockFetchResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  } as Response;
}

// Helper to validate response schema
export function validateResponseSchema(
  response: any,
  requiredFields: string[]
): boolean {
  return requiredFields.every(field => {
    const hasField = field.split('.').reduce((obj, key) => obj?.[key], response) !== undefined;
    if (!hasField) {
      console.error(`Missing required field: ${field}`);
    }
    return hasField;
  });
}

// Helper to generate correlation ID
export function generateCorrelationId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Helper to measure response time
export async function measureResponseTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// Helper to test concurrent requests
export async function testConcurrentRequests<T>(
  requests: (() => Promise<T>)[],
  maxConcurrent = 5
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);
  }
  
  return results;
}

// Helper to simulate rate limiting
export class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);
    
    if (this.requests.length >= this.limit) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  reset(): void {
    this.requests = [];
  }
}

// Helper to create test database records (if needed)
export async function createTestThread(data: Partial<any> = {}) {
  // This would interact with your test database
  // For now, return mock data
  return {
    id: `thread_test_${Date.now()}`,
    creatorId: mockSession.user.id,
    ...data,
  };
}

// Helper to cleanup test data
export async function cleanupTestData(ids: string[]) {
  // This would clean up test database records
  console.log(`Cleaning up test data: ${ids.join(', ')}`);
}

// Helper to assert error response
export function assertErrorResponse(
  response: any,
  expectedStatus: number,
  expectedError?: string
) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}`
    );
  }

  if (expectedError && response.error !== expectedError) {
    throw new Error(
      `Expected error "${expectedError}", got "${response.error}"`
    );
  }
}

// Helper to assert success response
export function assertSuccessResponse(response: any, requiredFields: string[]) {
  if (!response) {
    throw new Error('Response is null or undefined');
  }

  const isValid = validateResponseSchema(response, requiredFields);
  if (!isValid) {
    throw new Error('Response schema validation failed');
  }
}

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  GET_MESSAGES: 500, // ms
  SEND_MESSAGE: 1000, // ms
  GET_THREAD: 300, // ms
};

// Test timeouts
export const TEST_TIMEOUTS = {
  UNIT: 5000, // 5s
  INTEGRATION: 10000, // 10s
  E2E: 30000, // 30s
};
