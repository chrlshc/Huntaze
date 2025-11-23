/**
 * Test Fixtures for CSRF Token API Integration Tests
 * 
 * Provides reusable test data and helper functions for CSRF token testing.
 * 
 * Feature: production-critical-fixes
 */

/**
 * Valid CSRF token examples (64-character hex strings)
 */
export const VALID_CSRF_TOKENS = [
  'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
  'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
];

/**
 * Invalid CSRF token examples
 */
export const INVALID_CSRF_TOKENS = [
  '', // Empty
  'short', // Too short
  'a'.repeat(63), // One character short
  'a'.repeat(65), // One character too long
  'g'.repeat(64), // Invalid hex character
  'ABCDEF'.repeat(10) + 'ABCD', // Uppercase (should be lowercase)
  '!@#$%^&*()_+'.repeat(5) + '1234', // Special characters
  ' '.repeat(64), // Whitespace
  '\x00'.repeat(64), // Null bytes
];

/**
 * Test user agents for different clients
 */
export const TEST_USER_AGENTS = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  bot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

/**
 * Test IP addresses for rate limiting tests
 */
export const TEST_IP_ADDRESSES = {
  localhost: '127.0.0.1',
  private: '192.168.1.100',
  public: '203.0.113.42',
  cloudflare: '104.16.0.1',
  aws: '52.94.76.1',
  multiple: [
    '203.0.113.1',
    '203.0.113.2',
    '203.0.113.3',
    '203.0.113.4',
    '203.0.113.5',
  ],
};

/**
 * Cookie configuration for different environments
 */
export const COOKIE_CONFIGS = {
  production: {
    domain: '.huntaze.com',
    secure: true,
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 86400,
    path: '/',
  },
  development: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 86400,
    path: '/',
  },
  test: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 86400,
    path: '/',
  },
};

/**
 * Expected response schemas
 */
export const RESPONSE_SCHEMAS = {
  success: {
    token: 'string (64 hex characters)',
  },
  error: {
    error: 'string',
  },
  methodNotAllowed: {
    error: 'string',
  },
};

/**
 * Helper function to generate a valid CSRF token
 */
export function generateValidToken(): string {
  const chars = '0123456789abcdef';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/**
 * Helper function to parse Set-Cookie header
 */
export function parseCookie(setCookieHeader: string): {
  name: string;
  value: string;
  attributes: Record<string, string | boolean>;
} {
  const parts = setCookieHeader.split(';').map((p) => p.trim());
  const [nameValue, ...attributeParts] = parts;
  const [name, value] = nameValue.split('=');

  const attributes: Record<string, string | boolean> = {};
  for (const attr of attributeParts) {
    if (attr.includes('=')) {
      const [key, val] = attr.split('=');
      attributes[key.toLowerCase()] = val;
    } else {
      attributes[attr.toLowerCase()] = true;
    }
  }

  return { name, value, attributes };
}

/**
 * Helper function to validate token format
 */
export function isValidTokenFormat(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * Helper function to extract token from cookie header
 */
export function extractTokenFromCookie(setCookieHeader: string): string | null {
  const match = setCookieHeader.match(/csrf-token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Helper function to create request headers with CSRF token
 */
export function createCsrfHeaders(token: string): Record<string, string> {
  return {
    'X-CSRF-Token': token,
    'Cookie': `csrf-token=${token}`,
  };
}

/**
 * Helper function to simulate concurrent requests
 */
export async function makeConcurrentRequests(
  url: string,
  count: number,
  options?: RequestInit
): Promise<Response[]> {
  const requests = Array.from({ length: count }, () => fetch(url, options));
  return Promise.all(requests);
}

/**
 * Helper function to measure request duration
 */
export async function measureRequestDuration(
  url: string,
  options?: RequestInit
): Promise<{ response: Response; duration: number }> {
  const startTime = Date.now();
  const response = await fetch(url, options);
  const duration = Date.now() - startTime;
  return { response, duration };
}

/**
 * Helper function to wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper function to retry a request with exponential backoff
 */
export async function retryRequest(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
      lastError = new Error(`Request failed with status ${response.status}`);
    } catch (error) {
      lastError = error as Error;
    }

    if (attempt < maxRetries - 1) {
      await wait(Math.pow(2, attempt) * 100);
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Test scenarios for different use cases
 */
export const TEST_SCENARIOS = {
  normalUser: {
    description: 'Normal user requesting CSRF token',
    headers: {
      'User-Agent': TEST_USER_AGENTS.chrome,
    },
    expectedStatus: 200,
  },
  mobileUser: {
    description: 'Mobile user requesting CSRF token',
    headers: {
      'User-Agent': TEST_USER_AGENTS.mobile,
    },
    expectedStatus: 200,
  },
  bot: {
    description: 'Bot requesting CSRF token',
    headers: {
      'User-Agent': TEST_USER_AGENTS.bot,
    },
    expectedStatus: 200, // Bots can get tokens too
  },
  noUserAgent: {
    description: 'Request without User-Agent header',
    headers: {},
    expectedStatus: 200,
  },
  withReferer: {
    description: 'Request with Referer header',
    headers: {
      'Referer': 'https://huntaze.com/auth/login',
    },
    expectedStatus: 200,
  },
  withOrigin: {
    description: 'Request with Origin header',
    headers: {
      'Origin': 'https://huntaze.com',
    },
    expectedStatus: 200,
  },
};

/**
 * Performance benchmarks
 */
export const PERFORMANCE_BENCHMARKS = {
  singleRequest: {
    maxDuration: 100, // ms
    description: 'Single request should complete within 100ms',
  },
  tenSequential: {
    maxDuration: 500, // ms
    description: '10 sequential requests should complete within 500ms',
  },
  tenConcurrent: {
    maxDuration: 200, // ms
    description: '10 concurrent requests should complete within 200ms',
  },
  fiftyConcurrent: {
    maxDuration: 500, // ms
    description: '50 concurrent requests should complete within 500ms',
  },
  averageLatency: {
    maxDuration: 50, // ms
    description: 'Average latency should be under 50ms',
  },
};

/**
 * Rate limiting test configurations
 */
export const RATE_LIMIT_CONFIGS = {
  burst: {
    requests: 100,
    duration: 1000, // ms
    description: 'Burst of 100 requests in 1 second',
  },
  sustained: {
    requests: 500,
    duration: 60000, // ms
    description: 'Sustained 500 requests over 1 minute',
  },
  distributed: {
    requests: 50,
    ips: 10,
    description: '50 requests from 10 different IPs',
  },
};

/**
 * Error scenarios for testing error handling
 */
export const ERROR_SCENARIOS = {
  malformedHeaders: {
    description: 'Request with malformed headers',
    headers: {
      'X-Malformed': '\x00\x01\x02',
    },
  },
  largeHeaders: {
    description: 'Request with very large headers',
    headers: {
      'X-Large-Header': 'x'.repeat(10000),
    },
  },
  invalidContentType: {
    description: 'Request with invalid Content-Type',
    headers: {
      'Content-Type': 'invalid/type',
    },
  },
  missingHost: {
    description: 'Request without Host header',
    headers: {
      // Host header is required by HTTP/1.1
    },
  },
};
