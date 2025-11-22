/**
 * Test Data Fixtures
 * 
 * Centralized test data fixtures for integration tests.
 * Provides consistent, reusable test data across all test files.
 * 
 * Usage:
 * ```typescript
 * import { TEST_USERS, MOCK_INTEGRATIONS, MOCK_STATS } from '@/tests/integration/fixtures/test-data';
 * 
 * const user = await createTestUser(TEST_USERS.STANDARD);
 * const integration = await createTestIntegration(user.id, MOCK_INTEGRATIONS.INSTAGRAM);
 * ```
 */

// ============================================================================
// User Fixtures
// ============================================================================

export const TEST_USERS = {
  /**
   * Standard test user with all fields
   */
  STANDARD: {
    email: 'test-standard@example.com',
    name: 'Test User',
    password: 'TestPassword123!',
    emailVerified: true,
    onboardingCompleted: true,
  },
  
  /**
   * User with unverified email
   */
  UNVERIFIED: {
    email: 'test-unverified@example.com',
    name: 'Unverified User',
    password: 'TestPassword123!',
    emailVerified: false,
    onboardingCompleted: false,
  },
  
  /**
   * User without name
   */
  NO_NAME: {
    email: 'test-no-name@example.com',
    password: 'TestPassword123!',
    emailVerified: true,
    onboardingCompleted: true,
  },
  
  /**
   * User with special characters in name
   */
  SPECIAL_CHARS: {
    email: 'test-special@example.com',
    name: '测试用户 🎉',
    password: 'TestPassword123!',
    emailVerified: true,
    onboardingCompleted: true,
  },
  
  /**
   * User for concurrent testing
   */
  CONCURRENT: (index: number) => ({
    email: `test-concurrent-${index}@example.com`,
    name: `Concurrent User ${index}`,
    password: 'TestPassword123!',
    emailVerified: true,
    onboardingCompleted: true,
  }),
};

// ============================================================================
// Integration Fixtures
// ============================================================================

export const MOCK_INTEGRATIONS = {
  /**
   * Instagram integration
   */
  INSTAGRAM: {
    provider: 'instagram' as const,
    providerAccountId: '123456789',
    accessToken: 'encrypted_instagram_access_token',
    refreshToken: 'encrypted_instagram_refresh_token',
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    metadata: {
      username: '@testcreator',
      displayName: 'Test Creator',
      ig_business_id: '123456789',
    },
  },
  
  /**
   * TikTok integration
   */
  TIKTOK: {
    provider: 'tiktok' as const,
    providerAccountId: '987654321',
    accessToken: 'encrypted_tiktok_access_token',
    refreshToken: 'encrypted_tiktok_refresh_token',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    metadata: {
      username: '@testcreator_tt',
      displayName: 'Test Creator TT',
      open_id: '987654321',
    },
  },
  
  /**
   * Reddit integration
   */
  REDDIT: {
    provider: 'reddit' as const,
    providerAccountId: 'reddit_user_123',
    accessToken: 'encrypted_reddit_access_token',
    refreshToken: 'encrypted_reddit_refresh_token',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
    metadata: {
      username: 'testcreator_reddit',
    },
  },
  
  /**
   * OnlyFans integration
   */
  ONLYFANS: {
    provider: 'onlyfans' as const,
    providerAccountId: 'of_user_456',
    accessToken: 'encrypted_onlyfans_access_token',
    refreshToken: 'encrypted_onlyfans_refresh_token',
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    metadata: {
      username: '@testcreator_of',
      displayName: 'Test Creator OF',
    },
  },
  
  /**
   * Expired integration
   */
  EXPIRED: {
    provider: 'instagram' as const,
    providerAccountId: 'expired_account',
    accessToken: 'expired_token',
    refreshToken: 'expired_refresh',
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago (expired)
    metadata: {
      username: '@expired_account',
    },
  },
};

// ============================================================================
// Stats Fixtures
// ============================================================================

export const MOCK_STATS = {
  /**
   * Standard stats with positive trends
   */
  STANDARD: {
    messagesSent: 1247,
    messagesTrend: 12.5,
    responseRate: 94.2,
    responseRateTrend: 3.1,
    revenue: 8450,
    revenueTrend: 15.8,
    activeChats: 42,
    activeChatsTrend: -2.3,
  },
  
  /**
   * High performance stats
   */
  HIGH_PERFORMANCE: {
    messagesSent: 5000,
    messagesTrend: 25.0,
    responseRate: 98.5,
    responseRateTrend: 5.0,
    revenue: 25000,
    revenueTrend: 30.0,
    activeChats: 150,
    activeChatsTrend: 10.0,
  },
  
  /**
   * Low performance stats
   */
  LOW_PERFORMANCE: {
    messagesSent: 50,
    messagesTrend: -10.0,
    responseRate: 60.0,
    responseRateTrend: -5.0,
    revenue: 500,
    revenueTrend: -15.0,
    activeChats: 5,
    activeChatsTrend: -20.0,
  },
  
  /**
   * Default stats (all zeros)
   */
  DEFAULT: {
    messagesSent: 0,
    messagesTrend: 0,
    responseRate: 0,
    responseRateTrend: 0,
    revenue: 0,
    revenueTrend: 0,
    activeChats: 0,
    activeChatsTrend: 0,
  },
  
  /**
   * Edge case stats (boundary values)
   */
  EDGE_CASE: {
    messagesSent: 999999,
    messagesTrend: 100.0,
    responseRate: 100.0,
    responseRateTrend: 100.0,
    revenue: 999999.99,
    revenueTrend: 100.0,
    activeChats: 9999,
    activeChatsTrend: 100.0,
  },
};

// ============================================================================
// Metrics Fixtures
// ============================================================================

export const MOCK_METRICS = {
  /**
   * Standard metrics
   */
  STANDARD: {
    metrics: {
      requests: {
        total: 1247,
        averageLatency: 145,
        errorRate: 0.5,
      },
      connections: {
        active: 42,
      },
      cache: {
        hits: 850,
        misses: 150,
      },
      database: {
        queries: 320,
        averageLatency: 25,
        successRate: 99.8,
      },
    },
    alarms: [
      {
        name: 'HighErrorRate',
        state: 'ALARM',
        reason: 'Error rate exceeded threshold',
        updatedAt: new Date().toISOString(),
      },
    ],
    timestamp: new Date().toISOString(),
  },
  
  /**
   * Healthy metrics (no alarms)
   */
  HEALTHY: {
    metrics: {
      requests: {
        total: 1000,
        averageLatency: 100,
        errorRate: 0.1,
      },
      connections: {
        active: 50,
      },
      cache: {
        hits: 900,
        misses: 100,
      },
      database: {
        queries: 300,
        averageLatency: 20,
        successRate: 99.9,
      },
    },
    alarms: [],
    timestamp: new Date().toISOString(),
  },
  
  /**
   * Critical metrics (multiple alarms)
   */
  CRITICAL: {
    metrics: {
      requests: {
        total: 5000,
        averageLatency: 500,
        errorRate: 5.0,
      },
      connections: {
        active: 200,
      },
      cache: {
        hits: 500,
        misses: 500,
      },
      database: {
        queries: 1000,
        averageLatency: 100,
        successRate: 95.0,
      },
    },
    alarms: [
      {
        name: 'HighErrorRate',
        state: 'ALARM',
        reason: 'Error rate exceeded threshold',
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'HighLatency',
        state: 'ALARM',
        reason: 'Average latency exceeded threshold',
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'LowCacheHitRate',
        state: 'ALARM',
        reason: 'Cache hit rate below threshold',
        updatedAt: new Date().toISOString(),
      },
    ],
    timestamp: new Date().toISOString(),
  },
};

// ============================================================================
// Validation Test Cases
// ============================================================================

export const INVALID_INPUTS = {
  /**
   * Invalid email formats
   */
  EMAILS: [
    'invalid',
    '@example.com',
    'test@',
    'test @example.com',
    'test@example',
    '',
    ' ',
  ],
  
  /**
   * Invalid passwords
   */
  PASSWORDS: [
    'short',      // Too short
    '1234567',    // Too short
    '',           // Empty
    ' ',          // Whitespace only
  ],
  
  /**
   * Invalid providers
   */
  PROVIDERS: [
    'facebook',
    'twitter',
    'youtube',
    'invalid',
    '',
  ],
  
  /**
   * Invalid account IDs
   */
  ACCOUNT_IDS: [
    '',
    ' ',
    null,
    undefined,
  ],
};

// ============================================================================
// Edge Case Test Data
// ============================================================================

export const EDGE_CASES = {
  /**
   * Very long strings
   */
  LONG_PASSWORD: 'a'.repeat(1000),
  LONG_EMAIL: `${'a'.repeat(100)}@example.com`,
  LONG_NAME: 'a'.repeat(500),
  
  /**
   * Special characters
   */
  SPECIAL_PASSWORD: 'Test!@#$%^&*()_+-=[]{}|;:,.<>?123',
  UNICODE_NAME: '测试用户 🎉 Тест',
  UNICODE_EMAIL: 'test@例え.com',
  
  /**
   * Whitespace
   */
  WHITESPACE_EMAIL: '  test@example.com  ',
  WHITESPACE_PASSWORD: '  TestPassword123!  ',
  
  /**
   * Boundary values
   */
  MAX_INT: 2147483647,
  MIN_INT: -2147483648,
  MAX_FLOAT: Number.MAX_SAFE_INTEGER,
  MIN_FLOAT: Number.MIN_SAFE_INTEGER,
};

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ============================================================================
// Cache Configuration
// ============================================================================

export const CACHE_CONFIG = {
  /**
   * Cache TTLs (in seconds)
   */
  TTL: {
    MONITORING_METRICS: 30,
    HOME_STATS: 60,
    INTEGRATIONS_STATUS: 300,
    CSRF_TOKEN: 3600,
  },
  
  /**
   * Cache keys
   */
  KEYS: {
    monitoringMetrics: () => 'monitoring:metrics:summary',
    homeStats: (userId: number) => `home:stats:${userId}`,
    integrationsStatus: (userId: number) => `integrations:status:${userId}`,
    csrfToken: (sessionId: string) => `csrf:token:${sessionId}`,
  },
};

// ============================================================================
// Performance Targets
// ============================================================================

export const PERFORMANCE_TARGETS = {
  /**
   * Response time targets (in milliseconds)
   */
  RESPONSE_TIME: {
    UNCACHED: 500,
    CACHED: 100,
    AUTH: 500,
    MUTATION: 500,
  },
  
  /**
   * Concurrent request targets
   */
  CONCURRENT: {
    SMALL: 10,
    MEDIUM: 20,
    LARGE: 50,
  },
  
  /**
   * Load test targets
   */
  LOAD_TEST: {
    REQUESTS: 50,
    P95_TARGET: 500,
  },
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  /**
   * Authentication errors
   */
  AUTH: {
    UNAUTHORIZED: 'Unauthorized',
    INVALID_CREDENTIALS: 'Invalid credentials',
    SESSION_EXPIRED: 'Session expired',
  },
  
  /**
   * Validation errors
   */
  VALIDATION: {
    EMAIL_REQUIRED: 'Email is required',
    PASSWORD_REQUIRED: 'Password is required',
    INVALID_EMAIL: 'Invalid email format',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    INVALID_PROVIDER: 'Invalid provider',
    ACCOUNT_ID_REQUIRED: 'Account ID is required',
  },
  
  /**
   * Resource errors
   */
  RESOURCE: {
    USER_NOT_FOUND: 'User not found',
    INTEGRATION_NOT_FOUND: 'Integration not found',
    USER_ALREADY_EXISTS: 'User already exists',
  },
  
  /**
   * CSRF errors
   */
  CSRF: {
    TOKEN_MISSING: 'CSRF token missing',
    TOKEN_INVALID: 'CSRF token invalid',
    TOKEN_EXPIRED: 'CSRF token expired',
  },
};

// ============================================================================
// Export All
// ============================================================================

export default {
  TEST_USERS,
  MOCK_INTEGRATIONS,
  MOCK_STATS,
  MOCK_METRICS,
  INVALID_INPUTS,
  EDGE_CASES,
  HTTP_STATUS,
  CACHE_CONFIG,
  PERFORMANCE_TARGETS,
  ERROR_MESSAGES,
};
