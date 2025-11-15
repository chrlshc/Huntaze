/**
 * Validation API - Test Fixtures
 * 
 * Provides test data for validation endpoint testing
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas for Response Validation
// ============================================================================

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

export const ValidationWarningSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

export const ValidationResponseSchema = z.object({
  platform: z.string(),
  isValid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
  warnings: z.array(ValidationWarningSchema),
  details: z.record(z.any()).optional(),
});

export const ValidationErrorResponseSchema = z.object({
  error: z.string(),
});

// ============================================================================
// Valid Credentials Fixtures
// ============================================================================

export const validInstagramCredentials = {
  platform: 'instagram',
  credentials: {
    appId: 'valid_app_id_123456789',
    appSecret: 'valid_app_secret_abcdef123456',
    redirectUri: 'https://example.com/auth/instagram/callback',
  },
};

export const validTikTokCredentials = {
  platform: 'tiktok',
  credentials: {
    clientKey: 'valid_client_key_123',
    clientSecret: 'valid_client_secret_abc',
    redirectUri: 'https://example.com/auth/tiktok/callback',
  },
};

export const validRedditCredentials = {
  platform: 'reddit',
  credentials: {
    clientId: 'valid_client_id_xyz',
    clientSecret: 'valid_client_secret_123',
    redirectUri: 'https://example.com/auth/reddit/callback',
    userAgent: 'TestApp/1.0.0',
  },
};

// ============================================================================
// Invalid Credentials Fixtures
// ============================================================================

export const invalidInstagramCredentials = {
  platform: 'instagram',
  credentials: {
    appId: '', // Empty app ID
    appSecret: 'short', // Too short
    redirectUri: 'not-a-url', // Invalid URL
  },
};

export const invalidTikTokCredentials = {
  platform: 'tiktok',
  credentials: {
    clientKey: '123', // Too short
    clientSecret: '', // Empty
    redirectUri: 'http://localhost', // HTTP not allowed
  },
};

export const invalidRedditCredentials = {
  platform: 'reddit',
  credentials: {
    clientId: 'abc', // Too short
    clientSecret: 'xyz', // Too short
    redirectUri: 'invalid-url',
    userAgent: '', // Empty
  },
};

// ============================================================================
// Malformed Request Fixtures
// ============================================================================

export const missingPlatform = {
  credentials: {
    appId: 'test',
    appSecret: 'test',
  },
};

export const missingCredentials = {
  platform: 'instagram',
};

export const emptyRequest = {};

export const invalidPlatform = {
  platform: 'unsupported_platform',
  credentials: {
    key: 'value',
  },
};

// ============================================================================
// Edge Cases Fixtures
// ============================================================================

export const credentialsWithSpecialChars = {
  platform: 'instagram',
  credentials: {
    appId: 'app_id_with_!@#$%',
    appSecret: 'secret_with_&*()_+',
    redirectUri: 'https://example.com/callback?param=value&other=test',
  },
};

export const credentialsWithUnicode = {
  platform: 'tiktok',
  credentials: {
    clientKey: 'key_with_émojis_🎉',
    clientSecret: 'secret_with_中文',
    redirectUri: 'https://example.com/callback',
  },
};

export const credentialsWithExtraFields = {
  platform: 'reddit',
  credentials: {
    clientId: 'valid_client_id',
    clientSecret: 'valid_client_secret',
    redirectUri: 'https://example.com/callback',
    userAgent: 'TestApp/1.0.0',
    extraField1: 'should_be_ignored',
    extraField2: 123,
  },
};

// ============================================================================
// Expected Responses
// ============================================================================

export const expectedValidResponse = {
  platform: 'instagram',
  isValid: true,
  errors: [],
  warnings: [],
};

export const expectedInvalidResponse = {
  platform: 'instagram',
  isValid: false,
  errors: [
    {
      field: 'appId',
      message: expect.stringContaining('required'),
    },
  ],
};

export const expectedMissingFieldsError = {
  error: 'Missing required fields',
};

// ============================================================================
// Rate Limiting Fixtures
// ============================================================================

export const rateLimitTestCredentials = Array.from({ length: 100 }, (_, i) => ({
  platform: 'instagram',
  credentials: {
    appId: `test_app_id_${i}`,
    appSecret: `test_app_secret_${i}`,
    redirectUri: `https://example.com/callback/${i}`,
  },
}));

// ============================================================================
// Concurrent Access Fixtures
// ============================================================================

export const concurrentTestCredentials = [
  validInstagramCredentials,
  validTikTokCredentials,
  validRedditCredentials,
  invalidInstagramCredentials,
  invalidTikTokCredentials,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate random valid credentials for a platform
 */
export function generateValidCredentials(platform: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  switch (platform) {
    case 'instagram':
      return {
        platform,
        credentials: {
          appId: `app_${timestamp}_${random}`,
          appSecret: `secret_${timestamp}_${random}`,
          redirectUri: `https://example.com/callback/${random}`,
        },
      };
    
    case 'tiktok':
      return {
        platform,
        credentials: {
          clientKey: `key_${timestamp}_${random}`,
          clientSecret: `secret_${timestamp}_${random}`,
          redirectUri: `https://example.com/callback/${random}`,
        },
      };
    
    case 'reddit':
      return {
        platform,
        credentials: {
          clientId: `id_${timestamp}_${random}`,
          clientSecret: `secret_${timestamp}_${random}`,
          redirectUri: `https://example.com/callback/${random}`,
          userAgent: `TestApp/${timestamp}`,
        },
      };
    
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Validate response against schema
 */
export function validateResponse(response: any, schema: z.ZodSchema) {
  const result = schema.safeParse(response);
  if (!result.success) {
    throw new Error(`Schema validation failed: ${JSON.stringify(result.error.errors)}`);
  }
  return result.data;
}

/**
 * Create test request body
 */
export function createTestRequest(platform: string, credentials: any) {
  return {
    platform,
    credentials,
  };
}

/**
 * Assert validation error structure
 */
export function assertValidationError(error: any) {
  expect(error).toHaveProperty('field');
  expect(error).toHaveProperty('message');
  expect(typeof error.field).toBe('string');
  expect(typeof error.message).toBe('string');
}

/**
 * Assert validation warning structure
 */
export function assertValidationWarning(warning: any) {
  expect(warning).toHaveProperty('field');
  expect(warning).toHaveProperty('message');
  expect(typeof warning.field).toBe('string');
  expect(typeof warning.message).toBe('string');
}
