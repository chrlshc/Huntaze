/**
 * Test Fixtures for Admin Feature Flags API Integration Tests
 * 
 * Provides reusable test data and helper functions for feature flags testing.
 * 
 * Feature: production-critical-fixes
 */

import { z } from 'zod';

/**
 * Zod schemas for response validation
 */
export const OnboardingFlagsSchema = z.object({
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100),
  markets: z.array(z.string()),
  userWhitelist: z.array(z.string()),
});

export const FeatureFlagsResponseSchema = z.object({
  flags: OnboardingFlagsSchema,
  correlationId: z.string().uuid(),
});

export const UpdateFeatureFlagsResponseSchema = z.object({
  success: z.boolean(),
  flags: OnboardingFlagsSchema,
  correlationId: z.string().uuid(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.string().optional(),
  correlationId: z.string().uuid(),
});

/**
 * Valid feature flag update examples
 */
export const VALID_FEATURE_FLAG_UPDATES = {
  enableAll: {
    enabled: true,
    rolloutPercentage: 100,
    markets: ['*'],
    userWhitelist: [],
  },
  disableAll: {
    enabled: false,
    rolloutPercentage: 0,
    markets: [],
    userWhitelist: [],
  },
  partialRollout: {
    enabled: true,
    rolloutPercentage: 50,
    markets: ['FR', 'US'],
    userWhitelist: [],
  },
  specificUsers: {
    enabled: true,
    rolloutPercentage: 0,
    markets: [],
    userWhitelist: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
  },
  onlyEnabled: {
    enabled: true,
  },
  onlyRollout: {
    rolloutPercentage: 75,
  },
  onlyMarkets: {
    markets: ['FR', 'US', 'GB', 'DE'],
  },
  onlyWhitelist: {
    userWhitelist: ['123e4567-e89b-12d3-a456-426614174000'],
  },
};

/**
 * Invalid feature flag update examples
 */
export const INVALID_FEATURE_FLAG_UPDATES = {
  rolloutTooLow: {
    rolloutPercentage: -10,
  },
  rolloutTooHigh: {
    rolloutPercentage: 150,
  },
  invalidMarketCodes: {
    markets: ['FRANCE', 'USA', 'UK'],
  },
  invalidMarketFormat: {
    markets: ['F', 'US', 'GBR'],
  },
  invalidUserIds: {
    userWhitelist: ['not-a-uuid', '12345', 'invalid'],
  },
  emptyUpdate: {},
  invalidJSON: 'not json{',
  nullValues: {
    enabled: null,
    rolloutPercentage: null,
  },
  wrongTypes: {
    enabled: 'true',
    rolloutPercentage: '50',
  },
};

/**
 * Test admin users (mock data)
 */
export const TEST_ADMIN_USERS = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@huntaze.com',
    role: 'admin',
    sessionToken: 'admin-session-token-1',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'superadmin@huntaze.com',
    role: 'admin',
    sessionToken: 'admin-session-token-2',
  },
];

/**
 * Test regular users (mock data)
 */
export const TEST_REGULAR_USERS = [
  {
    id: '223e4567-e89b-12d3-a456-426614174000',
    email: 'user@huntaze.com',
    role: 'user',
    sessionToken: 'user-session-token-1',
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    email: 'creator@huntaze.com',
    role: 'user',
    sessionToken: 'user-session-token-2',
  },
];

/**
 * Helper function to create auth headers
 */
export function createAuthHeaders(sessionToken: string): Record<string, string> {
  return {
    'Cookie': `next-auth.session-token=${sessionToken}`,
  };
}

/**
 * Helper function to create CSRF headers
 */
export function createCsrfHeaders(token: string): Record<string, string> {
  return {
    'X-CSRF-Token': token,
    'Cookie': `csrf-token=${token}`,
  };
}

/**
 * Helper function to get CSRF token
 */
export async function getCsrfToken(baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/csrf/token`);
  if (!response.ok) {
    throw new Error('Failed to get CSRF token');
  }
  const { token } = await response.json();
  return token;
}

/**
 * Helper function to make concurrent requests
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
 * Helper function to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performance benchmarks
 */
export const PERFORMANCE_BENCHMARKS = {
  getRequest: {
    maxDuration: 100, // ms
    description: 'GET request should complete within 100ms',
  },
  postRequest: {
    maxDuration: 200, // ms
    description: 'POST request should complete within 200ms',
  },
  concurrentRequests: {
    maxDuration: 500, // ms
    description: '10 concurrent requests should complete within 500ms',
  },
};

/**
 * Rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  get: {
    maxRequests: 60,
    windowMs: 60000, // 1 minute
    description: 'GET: 60 requests per minute',
  },
  post: {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    description: 'POST: 20 requests per minute',
  },
};

/**
 * Test scenarios
 */
export const TEST_SCENARIOS = {
  adminEnablesFeature: {
    description: 'Admin enables feature for all users',
    update: VALID_FEATURE_FLAG_UPDATES.enableAll,
    expectedStatus: 200,
  },
  adminDisablesFeature: {
    description: 'Admin disables feature',
    update: VALID_FEATURE_FLAG_UPDATES.disableAll,
    expectedStatus: 200,
  },
  adminSetsPartialRollout: {
    description: 'Admin sets 50% rollout in specific markets',
    update: VALID_FEATURE_FLAG_UPDATES.partialRollout,
    expectedStatus: 200,
  },
  adminWhitelistsUsers: {
    description: 'Admin whitelists specific users',
    update: VALID_FEATURE_FLAG_UPDATES.specificUsers,
    expectedStatus: 200,
  },
  invalidRolloutPercentage: {
    description: 'Admin tries to set invalid rollout percentage',
    update: INVALID_FEATURE_FLAG_UPDATES.rolloutTooHigh,
    expectedStatus: 400,
  },
  invalidMarketCodes: {
    description: 'Admin tries to set invalid market codes',
    update: INVALID_FEATURE_FLAG_UPDATES.invalidMarketCodes,
    expectedStatus: 400,
  },
  invalidUserIds: {
    description: 'Admin tries to whitelist invalid user IDs',
    update: INVALID_FEATURE_FLAG_UPDATES.invalidUserIds,
    expectedStatus: 400,
  },
  emptyUpdate: {
    description: 'Admin sends empty update',
    update: INVALID_FEATURE_FLAG_UPDATES.emptyUpdate,
    expectedStatus: 400,
  },
};

/**
 * Helper to validate response schema
 */
export function validateResponseSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; error?: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}

/**
 * Helper to extract correlation ID from response
 */
export async function extractCorrelationId(response: Response): Promise<string | null> {
  try {
    const body = await response.json();
    return body.correlationId || null;
  } catch {
    return null;
  }
}

/**
 * Helper to check if response has rate limit headers
 */
export function hasRateLimitHeaders(response: Response): boolean {
  return (
    response.headers.has('X-RateLimit-Limit') ||
    response.headers.has('X-RateLimit-Remaining') ||
    response.headers.has('Retry-After')
  );
}

/**
 * Helper to parse rate limit headers
 */
export function parseRateLimitHeaders(response: Response): {
  limit?: number;
  remaining?: number;
  retryAfter?: number;
  reset?: string;
} {
  return {
    limit: response.headers.get('X-RateLimit-Limit')
      ? parseInt(response.headers.get('X-RateLimit-Limit')!)
      : undefined,
    remaining: response.headers.get('X-RateLimit-Remaining')
      ? parseInt(response.headers.get('X-RateLimit-Remaining')!)
      : undefined,
    retryAfter: response.headers.get('Retry-After')
      ? parseInt(response.headers.get('Retry-After')!)
      : undefined,
    reset: response.headers.get('X-RateLimit-Reset') || undefined,
  };
}
