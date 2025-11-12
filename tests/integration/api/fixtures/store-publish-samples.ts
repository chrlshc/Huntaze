/**
 * Test Fixtures - Store Publish Endpoint
 * 
 * Sample data for testing /api/store/publish endpoint
 */

export const validPublishRequest = {
  confirmPublish: true,
  notifyCustomers: false,
}

export const invalidPublishRequest = {
  confirmPublish: 'not-a-boolean', // Invalid type
  invalidField: 'should-not-be-here',
}

export const successResponse = {
  success: true,
  message: 'Boutique publiée avec succès',
  storeUrl: 'https://test-user-123.huntaze.com',
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
}

export const gatingResponse = {
  error: 'PRECONDITION_REQUIRED',
  message: 'Vous devez configurer les paiements avant de publier votre boutique',
  missingStep: 'payments',
  action: {
    type: 'open_modal',
    modal: 'payments_setup',
    prefill: {
      returnUrl: '/api/store/publish',
      userId: 'test-user-123',
    },
  },
  correlationId: '550e8400-e29b-41d4-a716-446655440001',
}

export const unauthorizedResponse = {
  error: 'Unauthorized',
  correlationId: '550e8400-e29b-41d4-a716-446655440002',
}

export const internalErrorResponse = {
  error: 'Failed to publish store',
  details: 'Database connection failed',
  correlationId: '550e8400-e29b-41d4-a716-446655440003',
}

export const testUsers = {
  withPayments: {
    id: 'user-with-payments-123',
    email: 'user-with-payments@test.com',
    token: 'test-token-with-payments',
  },
  withoutPayments: {
    id: 'user-without-payments-456',
    email: 'user-without-payments@test.com',
    token: 'test-token-no-payments',
  },
  invalid: {
    id: 'invalid-user-789',
    email: 'invalid@test.com',
    token: 'invalid-token-12345',
  },
}

export const performanceBenchmarks = {
  maxResponseTime: 5000, // ms
  targetResponseTime: 2000, // ms
  concurrentRequests: 10,
}

export const rateLimitConfig = {
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
  burstSize: 10,
}

export const expectedHeaders = {
  'content-type': 'application/json',
  'x-content-type-options': 'nosniff',
}

export const securityPatterns = {
  xssVectors: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src=x onerror=alert("xss")>',
  ],
  sqlInjection: [
    "' OR '1'='1",
    '; DROP TABLE users--',
    "1' UNION SELECT * FROM users--",
  ],
  sensitiveData: [
    'password',
    'secret',
    'token',
    'api_key',
    'private_key',
  ],
}
