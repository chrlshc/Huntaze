/**
 * NextAuth Route - Test Fixtures
 * 
 * Fixtures de données pour les tests d'intégration NextAuth
 */

import { z } from 'zod';

// ============================================================================
// User Fixtures
// ============================================================================

/**
 * Valid test users
 */
export const testUsers = {
  creator: {
    id: '1',
    email: 'creator@example.com',
    password: 'CreatorPass123!',
    hashedPassword: '$2a$10$...',  // bcrypt hash
    name: 'Test Creator',
    role: 'creator',
    creatorId: '100',
  },
  admin: {
    id: '2',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    hashedPassword: '$2a$10$...',
    name: 'Test Admin',
    role: 'admin',
    creatorId: null,
  },
  user: {
    id: '3',
    email: 'user@example.com',
    password: 'UserPass123!',
    hashedPassword: '$2a$10$...',
    name: 'Test User',
    role: 'user',
    creatorId: null,
  },
};

/**
 * Invalid credentials
 */
export const invalidCredentials = {
  wrongEmail: {
    email: 'wrong@example.com',
    password: 'SomePassword123!',
  },
  wrongPassword: {
    email: 'creator@example.com',
    password: 'WrongPassword123!',
  },
  nonExistent: {
    email: 'nonexistent@example.com',
    password: 'Password123!',
  },
};

/**
 * Edge case credentials
 */
export const edgeCaseCredentials = {
  emailWithSpaces: {
    email: '  creator@example.com  ',
    password: 'CreatorPass123!',
  },
  emailUppercase: {
    email: 'CREATOR@EXAMPLE.COM',
    password: 'CreatorPass123!',
  },
  emailWithPlus: {
    email: 'creator+tag@example.com',
    password: 'CreatorPass123!',
  },
  shortPassword: {
    email: 'creator@example.com',
    password: 'short',
  },
  exactlyEightChars: {
    email: 'creator@example.com',
    password: '12345678',
  },
  passwordWithSpaces: {
    email: 'creator@example.com',
    password: 'pass word',
  },
  emptyEmail: {
    email: '',
    password: 'Password123!',
  },
  emptyPassword: {
    email: 'creator@example.com',
    password: '',
  },
  invalidEmailFormat: {
    email: 'not-an-email',
    password: 'Password123!',
  },
  emailWithoutAt: {
    email: 'creatorexample.com',
    password: 'Password123!',
  },
  emailWithoutDomain: {
    email: 'creator@',
    password: 'Password123!',
  },
};

// ============================================================================
// Request Fixtures
// ============================================================================

/**
 * Valid signin requests
 */
export const validSigninRequests = {
  withCallback: {
    email: 'creator@example.com',
    password: 'CreatorPass123!',
    csrfToken: 'test-csrf-token',
    callbackUrl: '/dashboard',
    json: true,
  },
  withoutCallback: {
    email: 'creator@example.com',
    password: 'CreatorPass123!',
    csrfToken: 'test-csrf-token',
    json: true,
  },
  minimal: {
    email: 'creator@example.com',
    password: 'CreatorPass123!',
    csrfToken: 'test-csrf-token',
  },
};

/**
 * Invalid signin requests
 */
export const invalidSigninRequests = {
  missingEmail: {
    password: 'CreatorPass123!',
    csrfToken: 'test-csrf-token',
    json: true,
  },
  missingPassword: {
    email: 'creator@example.com',
    csrfToken: 'test-csrf-token',
    json: true,
  },
  missingCsrf: {
    email: 'creator@example.com',
    password: 'CreatorPass123!',
    json: true,
  },
  allMissing: {
    json: true,
  },
  invalidEmail: {
    email: 'not-an-email',
    password: 'CreatorPass123!',
    csrfToken: 'test-csrf-token',
    json: true,
  },
  shortPassword: {
    email: 'creator@example.com',
    password: 'short',
    csrfToken: 'test-csrf-token',
    json: true,
  },
};

/**
 * Signout requests
 */
export const signoutRequests = {
  valid: {
    csrfToken: 'test-csrf-token',
    json: true,
  },
  withCallback: {
    csrfToken: 'test-csrf-token',
    callbackUrl: '/auth',
    json: true,
  },
  missingCsrf: {
    json: true,
  },
};

// ============================================================================
// Response Fixtures
// ============================================================================

/**
 * Success responses
 */
export const successResponses = {
  signin: {
    url: '/dashboard',
    ok: true,
  },
  signout: {
    url: '/auth',
    ok: true,
  },
  session: {
    user: {
      id: '1',
      email: 'creator@example.com',
      name: 'Test Creator',
      role: 'creator',
      creatorId: '100',
    },
    expires: '2025-12-31T23:59:59.999Z',
  },
  sessionUnauthenticated: {},
  csrf: {
    csrfToken: 'abc123def456ghi789',
  },
  providers: {
    google: {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      signinUrl: '/api/auth/signin/google',
      callbackUrl: '/api/auth/callback/google',
    },
    credentials: {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      signinUrl: '/api/auth/signin/credentials',
      callbackUrl: '/api/auth/callback/credentials',
    },
  },
};

/**
 * Error responses
 */
export const errorResponses = {
  invalidCredentials: {
    success: false,
    error: {
      type: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      userMessage: 'Invalid email or password.',
      correlationId: 'auth-1234567890-abc123',
      statusCode: 401,
      retryable: false,
      timestamp: '2025-11-14T10:30:00.000Z',
    },
    correlationId: 'auth-1234567890-abc123',
    duration: 245,
  },
  databaseError: {
    success: false,
    error: {
      type: 'DATABASE_ERROR',
      message: 'Database connection failed',
      userMessage: 'A database error occurred. Please try again.',
      correlationId: 'auth-1234567890-abc123',
      statusCode: 503,
      retryable: true,
      timestamp: '2025-11-14T10:30:00.000Z',
    },
    correlationId: 'auth-1234567890-abc123',
    duration: 1000,
  },
  timeoutError: {
    success: false,
    error: {
      type: 'TIMEOUT_ERROR',
      message: 'Request timeout after 10000ms',
      userMessage: 'Request timed out. Please try again.',
      correlationId: 'auth-1234567890-abc123',
      statusCode: 408,
      retryable: true,
      timestamp: '2025-11-14T10:30:00.000Z',
    },
    correlationId: 'auth-1234567890-abc123',
    duration: 10000,
  },
  networkError: {
    success: false,
    error: {
      type: 'NETWORK_ERROR',
      message: 'ECONNREFUSED',
      userMessage: 'Network error. Please check your connection and try again.',
      correlationId: 'auth-1234567890-abc123',
      statusCode: 503,
      retryable: true,
      timestamp: '2025-11-14T10:30:00.000Z',
    },
    correlationId: 'auth-1234567890-abc123',
    duration: 500,
  },
  rateLimitError: {
    success: false,
    error: {
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
      userMessage: 'Too many requests. Please wait a moment and try again.',
      correlationId: 'auth-1234567890-abc123',
      statusCode: 429,
      retryable: false,
      timestamp: '2025-11-14T10:30:00.000Z',
    },
    correlationId: 'auth-1234567890-abc123',
    duration: 50,
  },
  validationError: {
    success: false,
    error: {
      type: 'VALIDATION_ERROR',
      message: 'Invalid request parameters',
      userMessage: 'Invalid request. Please check your input.',
      correlationId: 'auth-1234567890-abc123',
      statusCode: 400,
      retryable: false,
      timestamp: '2025-11-14T10:30:00.000Z',
    },
    correlationId: 'auth-1234567890-abc123',
    duration: 10,
  },
};

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Session response schema
 */
export const sessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    role: z.string().optional(),
    creatorId: z.string().optional(),
  }).optional(),
  expires: z.string().optional(),
});

/**
 * Error response schema
 */
export const errorSchema = z.object({
  success: z.boolean(),
  error: z.object({
    type: z.string(),
    message: z.string(),
    userMessage: z.string(),
    correlationId: z.string(),
    statusCode: z.number(),
    retryable: z.boolean(),
    timestamp: z.string(),
  }),
  correlationId: z.string(),
  duration: z.number(),
});

/**
 * Providers response schema
 */
export const providersSchema = z.record(z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  signinUrl: z.string(),
  callbackUrl: z.string(),
}));

/**
 * CSRF response schema
 */
export const csrfSchema = z.object({
  csrfToken: z.string().min(1),
});

/**
 * Signin success response schema
 */
export const signinSuccessSchema = z.object({
  url: z.string(),
  ok: z.boolean(),
});

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Generate random email
 */
export function generateRandomEmail(): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `test-${random}@example.com`;
}

/**
 * Generate random password
 */
export function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate random CSRF token
 */
export function generateRandomCsrfToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

/**
 * Generate correlation ID
 */
export function generateCorrelationId(): string {
  return `auth-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate test user
 */
export function generateTestUser(overrides: Partial<typeof testUsers.creator> = {}) {
  return {
    id: Math.random().toString(),
    email: generateRandomEmail(),
    password: generateRandomPassword(),
    hashedPassword: '$2a$10$...',
    name: 'Test User',
    role: 'creator',
    creatorId: null,
    ...overrides,
  };
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create signin request body
 */
export function createSigninRequest(
  email: string,
  password: string,
  options: {
    csrfToken?: string;
    callbackUrl?: string;
    json?: boolean;
  } = {}
) {
  return {
    email,
    password,
    csrfToken: options.csrfToken || generateRandomCsrfToken(),
    callbackUrl: options.callbackUrl,
    json: options.json !== false,
  };
}

/**
 * Create signout request body
 */
export function createSignoutRequest(
  options: {
    csrfToken?: string;
    callbackUrl?: string;
    json?: boolean;
  } = {}
) {
  return {
    csrfToken: options.csrfToken || generateRandomCsrfToken(),
    callbackUrl: options.callbackUrl,
    json: options.json !== false,
  };
}

/**
 * Validate response schema
 */
export function validateResponseSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: boolean; data?: T; errors?: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Check if response is error
 */
export function isErrorResponse(data: unknown): data is typeof errorResponses.invalidCredentials {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    data.success === false &&
    'error' in data
  );
}

/**
 * Check if response is success
 */
export function isSuccessResponse(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    (!('success' in data) || (data as any).success === true)
  );
}

/**
 * Extract correlation ID from response
 */
export function extractCorrelationId(data: unknown): string | null {
  if (typeof data === 'object' && data !== null && 'correlationId' in data) {
    return (data as any).correlationId;
  }
  return null;
}

/**
 * Check if correlation ID is valid
 */
export function isValidCorrelationId(correlationId: string): boolean {
  return /^auth-\d+-[a-z0-9]+$/.test(correlationId);
}

// ============================================================================
// Performance Helpers
// ============================================================================

/**
 * Measure response time
 */
export async function measureResponseTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Wait for specified duration
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await wait(delay);
      }
    }
  }
  
  throw lastError;
}

// ============================================================================
// Concurrent Testing Helpers
// ============================================================================

/**
 * Execute requests concurrently
 */
export async function executeConcurrently<T>(
  requests: (() => Promise<T>)[],
  options: {
    maxConcurrent?: number;
    delayBetweenBatches?: number;
  } = {}
): Promise<T[]> {
  const maxConcurrent = options.maxConcurrent || requests.length;
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);
    
    if (i + maxConcurrent < requests.length && options.delayBetweenBatches) {
      await wait(options.delayBetweenBatches);
    }
  }
  
  return results;
}

/**
 * Execute requests in sequence
 */
export async function executeSequentially<T>(
  requests: (() => Promise<T>)[],
  delayBetween: number = 0
): Promise<T[]> {
  const results: T[] = [];
  
  for (const fn of requests) {
    const result = await fn();
    results.push(result);
    
    if (delayBetween > 0) {
      await wait(delayBetween);
    }
  }
  
  return results;
}

// ============================================================================
// Security Testing Helpers
// ============================================================================

/**
 * Check if response contains sensitive data
 */
export function containsSensitiveData(data: unknown, sensitiveFields: string[]): boolean {
  const jsonString = JSON.stringify(data);
  
  return sensitiveFields.some(field => {
    const value = process.env[field];
    return value && jsonString.includes(value);
  });
}

/**
 * Check if logs contain sensitive data
 */
export function logsContainSensitiveData(logs: string[], sensitiveData: string[]): boolean {
  const allLogs = logs.join(' ');
  
  return sensitiveData.some(data => allLogs.includes(data));
}

/**
 * Mask email for logging
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.substring(0, 3)}***@${domain}`;
}

/**
 * Check if email is masked in logs
 */
export function isEmailMasked(logs: string[], email: string): boolean {
  const allLogs = logs.join(' ');
  return !allLogs.includes(email) && allLogs.includes('***');
}
