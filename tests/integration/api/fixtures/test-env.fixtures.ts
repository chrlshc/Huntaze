/**
 * Test Environment API - Test Fixtures
 * 
 * Mock data and helpers for test-env endpoint tests
 */

import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

export const TestEnvResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string().datetime(),
  correlationId: z.string(),
  duration: z.number().positive(),
  env: z.object({
    nodeEnv: z.string(),
    hasNextAuthSecret: z.boolean(),
    nextAuthSecretLength: z.number().min(0),
    hasNextAuthUrl: z.boolean(),
    nextAuthUrl: z.string().optional(),
    hasDatabaseUrl: z.boolean(),
  }).optional(),
  error: z.string().optional(),
});

export const TestEnvSuccessSchema = TestEnvResponseSchema.extend({
  status: z.literal('ok'),
  env: z.object({
    nodeEnv: z.string(),
    hasNextAuthSecret: z.boolean(),
    nextAuthSecretLength: z.number().min(0),
    hasNextAuthUrl: z.boolean(),
    nextAuthUrl: z.string().optional(),
    hasDatabaseUrl: z.boolean(),
  }),
});

export const TestEnvErrorSchema = TestEnvResponseSchema.extend({
  status: z.literal('error'),
  error: z.string(),
});

// ============================================================================
// Types
// ============================================================================

export type TestEnvResponse = z.infer<typeof TestEnvResponseSchema>;
export type TestEnvSuccess = z.infer<typeof TestEnvSuccessSchema>;
export type TestEnvError = z.infer<typeof TestEnvErrorSchema>;

// ============================================================================
// Mock Data
// ============================================================================

export const mockTestEnvSuccess: TestEnvSuccess = {
  status: 'ok',
  timestamp: '2025-11-14T10:30:45.123Z',
  correlationId: 'test-env-1736159823400-abc123def',
  duration: 12,
  env: {
    nodeEnv: 'test',
    hasNextAuthSecret: true,
    nextAuthSecretLength: 64,
    hasNextAuthUrl: true,
    nextAuthUrl: 'http://localhost:3000',
    hasDatabaseUrl: true,
  },
};

export const mockTestEnvError: TestEnvError = {
  status: 'error',
  timestamp: '2025-11-14T10:30:45.123Z',
  correlationId: 'test-env-1736159823400-abc123def',
  duration: 5,
  error: 'Internal server error',
};

export const mockTestEnvDevelopment: TestEnvSuccess = {
  ...mockTestEnvSuccess,
  env: {
    ...mockTestEnvSuccess.env,
    nodeEnv: 'development',
  },
};

export const mockTestEnvProduction: TestEnvSuccess = {
  ...mockTestEnvSuccess,
  env: {
    ...mockTestEnvSuccess.env,
    nodeEnv: 'production',
  },
};

export const mockTestEnvMissingSecret: TestEnvSuccess = {
  ...mockTestEnvSuccess,
  env: {
    ...mockTestEnvSuccess.env,
    hasNextAuthSecret: false,
    nextAuthSecretLength: 0,
  },
};

export const mockTestEnvMissingUrl: TestEnvSuccess = {
  ...mockTestEnvSuccess,
  env: {
    ...mockTestEnvSuccess.env,
    hasNextAuthUrl: false,
    nextAuthUrl: undefined,
  },
};

export const mockTestEnvMissingDatabase: TestEnvSuccess = {
  ...mockTestEnvSuccess,
  env: {
    ...mockTestEnvSuccess.env,
    hasDatabaseUrl: false,
  },
};

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Validate correlation ID format
 */
export function isValidCorrelationId(correlationId: string): boolean {
  return /^test-env-\d{13}-[a-z0-9]{9}$/.test(correlationId);
}

/**
 * Validate timestamp is recent (within specified ms)
 */
export function isRecentTimestamp(timestamp: string, maxAgeMs: number = 5000): boolean {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.abs(now.getTime() - date.getTime());
  return diff < maxAgeMs;
}

/**
 * Validate ISO 8601 timestamp format
 */
export function isValidISO8601(timestamp: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp);
}

/**
 * Check if response contains sensitive data
 */
export function containsSensitiveData(response: TestEnvResponse): boolean {
  const responseText = JSON.stringify(response);
  
  // Check for common sensitive patterns
  const sensitivePatterns = [
    /[a-f0-9]{64}/,           // Hex secrets (64 chars)
    /postgres:\/\//,          // Database connection strings
    /mysql:\/\//,
    /mongodb:\/\//,
    /sk_live_/,               // Stripe live keys
    /pk_live_/,
    /-----BEGIN/,             // Private keys
    /password/i,              // Password fields
    /secret.*:/i,             // Secret fields
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(responseText));
}

/**
 * Validate environment consistency
 */
export function validateEnvConsistency(env: TestEnvSuccess['env']): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // If hasNextAuthSecret is true, length should be > 0
  if (env.hasNextAuthSecret && env.nextAuthSecretLength === 0) {
    errors.push('hasNextAuthSecret is true but nextAuthSecretLength is 0');
  }
  
  // If hasNextAuthSecret is false, length should be 0
  if (!env.hasNextAuthSecret && env.nextAuthSecretLength > 0) {
    errors.push('hasNextAuthSecret is false but nextAuthSecretLength > 0');
  }
  
  // If hasNextAuthUrl is true, nextAuthUrl should be defined
  if (env.hasNextAuthUrl && !env.nextAuthUrl) {
    errors.push('hasNextAuthUrl is true but nextAuthUrl is undefined');
  }
  
  // If hasNextAuthUrl is false, nextAuthUrl should be undefined
  if (!env.hasNextAuthUrl && env.nextAuthUrl) {
    errors.push('hasNextAuthUrl is false but nextAuthUrl is defined');
  }
  
  // nextAuthUrl should be a valid URL if present
  if (env.nextAuthUrl) {
    try {
      new URL(env.nextAuthUrl);
    } catch {
      errors.push('nextAuthUrl is not a valid URL');
    }
  }
  
  // nodeEnv should be one of the expected values
  if (!['development', 'production', 'test'].includes(env.nodeEnv)) {
    errors.push(`Invalid nodeEnv: ${env.nodeEnv}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate mock correlation ID
 */
export function generateMockCorrelationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `test-env-${timestamp}-${random}`;
}

/**
 * Generate mock timestamp
 */
export function generateMockTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create mock test-env response
 */
export function createMockTestEnvResponse(
  overrides?: Partial<TestEnvSuccess>
): TestEnvSuccess {
  return {
    ...mockTestEnvSuccess,
    timestamp: generateMockTimestamp(),
    correlationId: generateMockCorrelationId(),
    ...overrides,
  };
}

// ============================================================================
// Test Scenarios
// ============================================================================

export const testScenarios = {
  // Happy path
  allEnvVarsPresent: mockTestEnvSuccess,
  
  // Missing env vars
  missingSecret: mockTestEnvMissingSecret,
  missingUrl: mockTestEnvMissingUrl,
  missingDatabase: mockTestEnvMissingDatabase,
  
  // Different environments
  development: mockTestEnvDevelopment,
  production: mockTestEnvProduction,
  test: mockTestEnvSuccess,
  
  // Error cases
  internalError: mockTestEnvError,
};

// ============================================================================
// Performance Thresholds
// ============================================================================

export const performanceThresholds = {
  maxResponseTime: 100,        // ms
  maxDuration: 50,             // ms (internal duration)
  maxConcurrentRequests: 100,
  maxSequentialRequests: 100,
  maxTimestampAge: 5000,       // ms
};

// ============================================================================
// Security Checks
// ============================================================================

export const securityChecks = {
  shouldNotExposeSecrets: true,
  shouldNotExposeDbUrl: true,
  shouldNotRequireAuth: true,
  shouldHaveNoCacheHeaders: true,
};

// ============================================================================
// Expected Response Structure
// ============================================================================

export const expectedResponseKeys = [
  'status',
  'timestamp',
  'correlationId',
  'duration',
  'env',
];

export const expectedEnvKeys = [
  'nodeEnv',
  'hasNextAuthSecret',
  'nextAuthSecretLength',
  'hasNextAuthUrl',
  'nextAuthUrl',
  'hasDatabaseUrl',
];

// ============================================================================
// HTTP Method Tests
// ============================================================================

export const unsupportedMethods = ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

export const expectedMethodResponses = {
  GET: 200,
  POST: 405,
  PUT: 405,
  DELETE: 405,
  PATCH: 405,
  OPTIONS: 405,
};
