/**
 * Dashboard API Test Setup
 * 
 * Utilities and helpers for dashboard integration tests
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { mockUserId } from './fixtures';

// Mock fetch globally
let originalFetch: typeof fetch;
let mockFetchResponses: Map<string, any> = new Map();

export function setupDashboardTests() {
  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    mockFetchResponses.clear();
    setupMockFetch();
  });

  afterEach(() => {
    mockFetchResponses.clear();
  });
}

/**
 * Setup mock fetch for testing
 */
function setupMockFetch() {
  global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Check if we have a mock response for this URL
    const mockResponse = mockFetchResponses.get(urlString);
    
    if (mockResponse) {
      if (mockResponse.error) {
        throw mockResponse.error;
      }
      
      return new Response(JSON.stringify(mockResponse.data), {
        status: mockResponse.status || 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Default: return empty success response
    return new Response(JSON.stringify({ success: true, data: null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };
}

/**
 * Mock a fetch response for a specific URL
 */
export function mockFetchResponse(url: string, data: any, status = 200) {
  mockFetchResponses.set(url, { data, status });
}

/**
 * Mock a fetch error for a specific URL
 */
export function mockFetchError(url: string, error: Error) {
  mockFetchResponses.set(url, { error });
}

/**
 * Create a mock request with headers
 */
export function createMockRequest(
  url: string,
  options: {
    userId?: string;
    method?: string;
    headers?: Record<string, string>;
  } = {}
): Request {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  if (options.userId) {
    headers.set('x-user-id', options.userId);
  }

  return new Request(url, {
    method: options.method || 'GET',
    headers,
  });
}

/**
 * Parse response body
 */
export async function parseResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create mock NextRequest
 */
export function createNextRequest(
  url: string,
  options: {
    userId?: string;
    method?: string;
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
  
  if (options.userId) {
    headers.set('x-user-id', options.userId);
  }

  return {
    url: fullUrl.toString(),
    method: options.method || 'GET',
    headers: {
      get: (key: string) => headers.get(key) || null,
      set: (key: string, value: string) => headers.set(key, value),
      has: (key: string) => headers.has(key),
    },
    nextUrl: fullUrl,
  };
}
