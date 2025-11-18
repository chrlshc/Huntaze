/**
 * Test Fixtures for Integrations API
 * 
 * Provides sample data for integration tests
 */

import crypto from 'crypto';

// ============================================================================
// Integration Fixtures
// ============================================================================

export const validIntegration = {
  provider: 'instagram',
  accountId: 'test-instagram-123',
  accountName: '@testcreator',
  accessToken: 'encrypted_access_token_data',
  refreshToken: 'encrypted_refresh_token_data',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
};

export const expiredIntegration = {
  provider: 'tiktok',
  accountId: 'test-tiktok-456',
  accountName: '@expiredcreator',
  accessToken: 'encrypted_access_token_data',
  refreshToken: 'encrypted_refresh_token_data',
  expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
};

export const noExpiryIntegration = {
  provider: 'reddit',
  accountId: 'test-reddit-789',
  accountName: 'u/testuser',
  accessToken: 'encrypted_access_token_data',
  refreshToken: 'encrypted_refresh_token_data',
  expiresAt: null,
};

export const onlyfansIntegration = {
  provider: 'onlyfans',
  accountId: 'test-onlyfans-101',
  accountName: '@ofcreator',
  accessToken: 'encrypted_access_token_data',
  refreshToken: null, // OnlyFans doesn't use refresh tokens
  expiresAt: null,
};

// ============================================================================
// Response Fixtures
// ============================================================================

export const successResponseEmpty = {
  success: true,
  data: {
    integrations: [],
  },
  duration: 45,
};

export const successResponseWithIntegrations = {
  success: true,
  data: {
    integrations: [
      {
        id: 1,
        provider: 'instagram',
        accountId: 'test-instagram-123',
        accountName: '@testcreator',
        status: 'connected' as const,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        provider: 'tiktok',
        accountId: 'test-tiktok-456',
        accountName: '@expiredcreator',
        status: 'expired' as const,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  duration: 78,
};

export const errorResponseUnauthorized = {
  success: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
  },
  duration: 12,
};

export const errorResponseInvalidUserId = {
  success: false,
  error: {
    code: 'INVALID_USER_ID',
    message: 'Invalid user ID',
  },
  duration: 8,
};

export const errorResponseDatabaseError = {
  success: false,
  error: {
    code: 'DATABASE_ERROR',
    message: 'Failed to fetch integrations',
  },
  duration: 156,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a random integration for testing
 */
export function generateRandomIntegration(provider: string, expired = false) {
  const randomId = crypto.randomBytes(8).toString('hex');
  
  return {
    provider,
    accountId: `test-${provider}-${randomId}`,
    accountName: `@test${provider}${randomId.substring(0, 6)}`,
    accessToken: `encrypted_token_${randomId}`,
    refreshToken: `encrypted_refresh_${randomId}`,
    expiresAt: expired
      ? new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  };
}

/**
 * Generate multiple integrations for testing
 */
export function generateMultipleIntegrations(count: number, providers?: string[]) {
  const defaultProviders = ['instagram', 'tiktok', 'reddit', 'onlyfans'];
  const useProviders = providers || defaultProviders;
  
  return Array.from({ length: count }, (_, i) => {
    const provider = useProviders[i % useProviders.length];
    const expired = i % 3 === 0; // Every 3rd integration is expired
    
    return generateRandomIntegration(provider, expired);
  });
}

/**
 * Create test user data
 */
export function generateTestUser() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  
  return {
    email: `test-${timestamp}-${random}@example.com`,
    fullName: `Test User ${random}`,
    password: 'SecurePassword123!',
  };
}

/**
 * Generate mock session cookie
 */
export function generateMockSessionCookie(userId: string) {
  return `next-auth.session-token=test-session-${userId}-${Date.now()}`;
}

// ============================================================================
// Database Query Fixtures
// ============================================================================

export const createIntegrationQuery = `
  INSERT INTO oauth_accounts (
    user_id, provider, account_id, account_name,
    access_token, refresh_token, expires_at,
    created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
  RETURNING id
`;

export const deleteIntegrationQuery = `
  DELETE FROM oauth_accounts WHERE id = $1
`;

export const deleteUserIntegrationsQuery = `
  DELETE FROM oauth_accounts WHERE user_id = $1
`;

export const getIntegrationsQuery = `
  SELECT 
    id, provider, account_id, account_name,
    expires_at, created_at, updated_at
  FROM oauth_accounts
  WHERE user_id = $1
  ORDER BY created_at DESC
`;

// ============================================================================
// Rate Limit Fixtures
// ============================================================================

export const rateLimitHeaders = {
  'x-ratelimit-limit': '60',
  'x-ratelimit-remaining': '59',
  'x-ratelimit-reset': Math.floor(Date.now() / 1000 + 60).toString(),
};

export const rateLimitExceededHeaders = {
  'x-ratelimit-limit': '60',
  'x-ratelimit-remaining': '0',
  'x-ratelimit-reset': Math.floor(Date.now() / 1000 + 60).toString(),
  'retry-after': '60',
};

// ============================================================================
// Correlation ID Fixtures
// ============================================================================

export function generateCorrelationId() {
  return crypto.randomUUID();
}

// ============================================================================
// Export All
// ============================================================================

export default {
  validIntegration,
  expiredIntegration,
  noExpiryIntegration,
  onlyfansIntegration,
  successResponseEmpty,
  successResponseWithIntegrations,
  errorResponseUnauthorized,
  errorResponseInvalidUserId,
  errorResponseDatabaseError,
  generateRandomIntegration,
  generateMultipleIntegrations,
  generateTestUser,
  generateMockSessionCookie,
  createIntegrationQuery,
  deleteIntegrationQuery,
  deleteUserIntegrationsQuery,
  getIntegrationsQuery,
  rateLimitHeaders,
  rateLimitExceededHeaders,
  generateCorrelationId,
};
