/**
 * Health Check Tests - Test Fixtures
 */

import type { HealthResponse } from './setup';

/**
 * Valid health response fixture
 */
export const validHealthResponse: HealthResponse = {
  status: 'ok',
  timestamp: new Date().toISOString(),
};

/**
 * Expected response schema
 */
export const healthResponseSchema = {
  type: 'object',
  required: ['status', 'timestamp'],
  properties: {
    status: {
      type: 'string',
      enum: ['ok'],
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
    },
  },
  additionalProperties: false,
};

/**
 * Test scenarios
 */
export const testScenarios = {
  basic: {
    name: 'Basic health check',
    method: 'GET',
    path: '/api/health',
    expectedStatus: 200,
    expectedResponse: validHealthResponse,
  },
  withQueryParams: {
    name: 'Health check with query parameters (should ignore)',
    method: 'GET',
    path: '/api/health?foo=bar&baz=qux',
    expectedStatus: 200,
  },
  withCustomHeaders: {
    name: 'Health check with custom headers',
    method: 'GET',
    path: '/api/health',
    headers: {
      'X-Custom-Header': 'test-value',
      'X-Request-ID': 'test-123',
    },
    expectedStatus: 200,
  },
  crossOrigin: {
    name: 'Cross-origin health check',
    method: 'GET',
    path: '/api/health',
    headers: {
      'Origin': 'https://example.com',
    },
    expectedStatus: 200,
  },
};

/**
 * Invalid request scenarios
 */
export const invalidScenarios = {
  post: {
    name: 'POST request (not allowed)',
    method: 'POST',
    path: '/api/health',
    body: { test: 'data' },
    expectedStatus: 405,
  },
  put: {
    name: 'PUT request (not allowed)',
    method: 'PUT',
    path: '/api/health',
    body: { test: 'data' },
    expectedStatus: 405,
  },
  delete: {
    name: 'DELETE request (not allowed)',
    method: 'DELETE',
    path: '/api/health',
    expectedStatus: 405,
  },
  patch: {
    name: 'PATCH request (not allowed)',
    method: 'PATCH',
    path: '/api/health',
    body: { test: 'data' },
    expectedStatus: 405,
  },
};

/**
 * Performance test configurations
 */
export const performanceTests = {
  light: {
    name: 'Light load test',
    sequential: 10,
    concurrent: 5,
    maxResponseTime: 100, // ms
  },
  medium: {
    name: 'Medium load test',
    sequential: 50,
    concurrent: 20,
    maxResponseTime: 150, // ms
  },
  heavy: {
    name: 'Heavy load test',
    sequential: 100,
    concurrent: 50,
    maxResponseTime: 200, // ms
  },
};

/**
 * Expected response headers
 */
export const expectedHeaders = {
  contentType: 'application/json',
  cacheControl: /no-cache|no-store|max-age=0/,
};

/**
 * Monitoring check configuration
 */
export const monitoringConfig = {
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  retries: 3,
  expectedStatus: 200,
  expectedResponseTime: 100, // ms
};

/**
 * Security test cases
 */
export const securityTests = {
  noSensitiveData: {
    name: 'Response should not contain sensitive data',
    forbiddenStrings: [
      'password',
      'secret',
      'token',
      'key',
      'api_key',
      'apiKey',
      'private',
      'credential',
    ],
  },
  noVersionExposure: {
    name: 'Should not expose detailed version information',
    forbiddenStrings: [
      'node_modules',
      'package.json',
      'npm',
      'yarn',
    ],
  },
  noPathExposure: {
    name: 'Should not expose file system paths',
    forbiddenStrings: [
      '/home/',
      '/var/',
      '/usr/',
      'C:\\',
      'D:\\',
    ],
  },
};

/**
 * Response time thresholds
 */
export const responseTimeThresholds = {
  excellent: 50, // ms
  good: 100, // ms
  acceptable: 200, // ms
  slow: 500, // ms
};

/**
 * Uptime monitoring expectations
 */
export const uptimeExpectations = {
  availability: 99.9, // percentage
  maxDowntime: 43.2, // minutes per month
  maxConsecutiveFailures: 3,
  alertThreshold: 2, // consecutive failures before alert
};

/**
 * Load test profiles
 */
export const loadTestProfiles = {
  baseline: {
    name: 'Baseline performance',
    duration: 60, // seconds
    requestsPerSecond: 10,
    expectedSuccessRate: 100, // percentage
  },
  sustained: {
    name: 'Sustained load',
    duration: 300, // 5 minutes
    requestsPerSecond: 50,
    expectedSuccessRate: 99.9, // percentage
  },
  spike: {
    name: 'Spike test',
    duration: 30, // seconds
    requestsPerSecond: 200,
    expectedSuccessRate: 99, // percentage
  },
};

/**
 * Generate test timestamp
 */
export function generateTestTimestamp(offsetMs: number = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

/**
 * Generate mock health response
 */
export function generateMockHealthResponse(overrides?: Partial<HealthResponse>): HealthResponse {
  return {
    status: 'ok',
    timestamp: generateTestTimestamp(),
    ...overrides,
  };
}

/**
 * Validate response matches expected schema
 */
export function matchesSchema(data: unknown, schema: typeof healthResponseSchema): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const response = data as Record<string, unknown>;

  // Check required fields
  for (const field of schema.required) {
    if (!(field in response)) {
      return false;
    }
  }

  // Check field types
  for (const [field, spec] of Object.entries(schema.properties)) {
    const value = response[field];
    
    if (spec.type === 'string' && typeof value !== 'string') {
      return false;
    }

    if (spec.enum && !spec.enum.includes(value as string)) {
      return false;
    }
  }

  // Check no additional properties
  if (schema.additionalProperties === false) {
    const allowedFields = Object.keys(schema.properties);
    const actualFields = Object.keys(response);
    
    for (const field of actualFields) {
      if (!allowedFields.includes(field)) {
        return false;
      }
    }
  }

  return true;
}
