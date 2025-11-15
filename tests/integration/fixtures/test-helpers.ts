/**
 * Test Helper Functions
 * 
 * Reusable utilities for integration tests
 */

import { createTestUser, createTestSession, TestUser, TestSession } from './factories';
import { getTestDatabase, cleanupUserData } from '../setup/test-database';

export interface TestContext {
  user: TestUser;
  session: TestSession;
  cleanup: () => Promise<void>;
}

/**
 * Create authenticated test context
 */
export async function createAuthenticatedContext(
  userOverrides?: Partial<TestUser>
): Promise<TestContext> {
  const user = createTestUser(userOverrides);
  const session = createTestSession({ userId: user.id });
  
  // Store in test database
  const db = getTestDatabase();
  db.users.set(user.id, user);
  db.sessions.set(session.id, session);
  
  return {
    user,
    session,
    cleanup: async () => {
      await cleanupUserData(user.id);
    },
  };
}

/**
 * Create authenticated request with headers
 */
export function createAuthenticatedRequest(
  url: string,
  sessionToken: string,
  options?: RequestInit
): Request {
  const headers = new Headers(options?.headers);
  headers.set('Authorization', `Bearer ${sessionToken}`);
  headers.set('Content-Type', 'application/json');
  
  return new Request(url, {
    ...options,
    headers,
  });
}

/**
 * Create Next.js API request mock
 */
export function createNextRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    searchParams?: Record<string, string>;
  } = {}
): any {
  const fullUrl = new URL(url, 'http://localhost:3000');
  
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      fullUrl.searchParams.set(key, value);
    });
  }
  
  const headers = new Map<string, string>();
  headers.set('Content-Type', 'application/json');
  
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  return {
    url: fullUrl.toString(),
    method: options.method || 'GET',
    headers: {
      get: (key: string) => headers.get(key) || null,
      set: (key: string, value: string) => headers.set(key, value),
      has: (key: string) => headers.has(key),
      entries: () => headers.entries(),
    },
    nextUrl: fullUrl,
    json: async () => options.body,
  };
}

/**
 * Parse response body
 */
export async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
  } = {}
): Promise<void> {
  const timeout = options.timeout || 5000;
  const interval = options.interval || 100;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await sleep(interval);
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock external API response
 */
export function mockExternalAPI(
  service: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans',
  endpoint: string,
  response: any
): void {
  // This would integrate with MSW or similar mocking library
  // For now, it's a placeholder
  console.log(`[Mock API] ${service} ${endpoint}`, response);
}

/**
 * Assert response status
 */
export function assertResponseStatus(
  response: Response,
  expectedStatus: number
): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}`
    );
  }
}

/**
 * Assert response has JSON content type
 */
export function assertJsonResponse(response: Response): void {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(
      `Expected JSON response, got content-type: ${contentType}`
    );
  }
}

/**
 * Create mock fetch response
 */
export function createMockResponse(
  data: any,
  options: {
    status?: number;
    headers?: Record<string, string>;
  } = {}
): Response {
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Extract error message from response
 */
export async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await parseResponse(response);
    return data.error || data.message || 'Unknown error';
  } catch {
    return 'Failed to parse error response';
  }
}

/**
 * Retry async operation
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts || 3;
  const delay = options.delay || 1000;
  const backoff = options.backoff || false;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * attempt : delay;
        await sleep(waitTime);
      }
    }
  }
  
  throw lastError!;
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random number in range
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random item from array
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Make test request to API endpoint
 */
export async function testRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}${path}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Expect valid response with status and JSON
 */
export async function expectValidResponse(
  response: Response,
  expectedStatus: number = 200
): Promise<any> {
  expect(response.status).toBe(expectedStatus);
  assertJsonResponse(response);
  return await parseResponse(response);
}
