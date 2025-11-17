/**
 * Email Verification Test Fixtures
 * 
 * Reusable test data and utilities for email verification tests
 */

import { query } from '@/lib/db';
import { generateEmailVerificationToken } from '@/lib/auth/tokens';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  token?: string;
}

/**
 * Create a test user with verification token
 */
export async function createTestUser(
  overrides: Partial<TestUser> = {}
): Promise<TestUser> {
  const email = overrides.email || `test-${Date.now()}@example.com`;
  const name = overrides.name || 'Test User';
  const emailVerified = overrides.emailVerified ?? false;

  const result = await query(
    `INSERT INTO users (email, name, password_hash, email_verified)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [email, name, 'hashed_password', emailVerified]
  );

  const userId = result.rows[0].id;

  // Generate token if not verified
  let token: string | undefined;
  if (!emailVerified) {
    token = await generateEmailVerificationToken(userId, email);
  }

  return {
    id: userId,
    email,
    name,
    emailVerified,
    token,
  };
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number): Promise<TestUser[]> {
  const users: TestUser[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      email: `test-${i}-${Date.now()}@example.com`,
      name: `Test User ${i}`,
    });
    users.push(user);
  }

  return users;
}

/**
 * Delete test user and related data
 */
export async function deleteTestUser(userId: string): Promise<void> {
  await query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
  await query('DELETE FROM users WHERE id = $1', [userId]);
}

/**
 * Delete multiple test users
 */
export async function deleteTestUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;

  await query(
    'DELETE FROM email_verification_tokens WHERE user_id = ANY($1)',
    [userIds]
  );
  await query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
}

/**
 * Create expired verification token
 */
export async function createExpiredToken(
  userId: string,
  email: string
): Promise<string> {
  const token = await generateEmailVerificationToken(userId, email);
  
  // Set token as expired
  await query(
    `UPDATE email_verification_tokens 
     SET expires_at = NOW() - INTERVAL '1 hour'
     WHERE user_id = $1`,
    [userId]
  );

  return token;
}

/**
 * Verify user email directly (bypass API)
 */
export async function verifyUserEmail(userId: string): Promise<void> {
  await query(
    'UPDATE users SET email_verified = true WHERE id = $1',
    [userId]
  );
  await query(
    'DELETE FROM email_verification_tokens WHERE user_id = $1',
    [userId]
  );
}

/**
 * Get user verification status
 */
export async function getUserVerificationStatus(
  userId: string
): Promise<{ emailVerified: boolean; hasToken: boolean }> {
  const userResult = await query(
    'SELECT email_verified FROM users WHERE id = $1',
    [userId]
  );

  const tokenResult = await query(
    'SELECT COUNT(*) as count FROM email_verification_tokens WHERE user_id = $1',
    [userId]
  );

  return {
    emailVerified: userResult.rows[0]?.email_verified || false,
    hasToken: parseInt(tokenResult.rows[0]?.count || '0') > 0,
  };
}

/**
 * Sample error responses
 */
export const ERROR_RESPONSES = {
  MISSING_TOKEN: {
    error: {
      code: 'MISSING_TOKEN',
      message: 'Verification token is required',
      correlationId: expect.stringMatching(/^verify-\d+-[a-z0-9]+$/),
    },
  },
  INVALID_TOKEN: {
    error: {
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired verification token',
      correlationId: expect.stringMatching(/^verify-\d+-[a-z0-9]+$/),
    },
  },
  VERIFICATION_ERROR: {
    error: {
      code: 'VERIFICATION_ERROR',
      message: 'An error occurred during email verification',
      correlationId: expect.stringMatching(/^verify-\d+-[a-z0-9]+$/),
    },
  },
};

/**
 * Sample valid tokens for testing
 */
export const SAMPLE_TOKENS = {
  INVALID_FORMAT: 'invalid-token-123',
  MALFORMED_JWT: 'not.a.valid.jwt',
  EMPTY: '',
  VERY_LONG: 'a'.repeat(10000),
  WITH_SPECIAL_CHARS: 'token%20with%20spaces&special=chars',
};

/**
 * Test user templates
 */
export const USER_TEMPLATES = {
  STANDARD: {
    name: 'John Doe',
    email: 'john.doe@example.com',
  },
  WITH_SPECIAL_CHARS: {
    name: 'Jöhn Döe 🎉',
    email: 'john.doe+test@example.com',
  },
  WITH_NULL_NAME: {
    name: null as any,
    email: 'no-name@example.com',
  },
  LONG_NAME: {
    name: 'A'.repeat(255),
    email: 'long-name@example.com',
  },
};

/**
 * Helper to make verification request
 */
export async function makeVerificationRequest(
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(
    `http://localhost:3000/api/auth/verify-email?token=${token}`,
    {
      ...options,
      redirect: options.redirect || 'manual',
    }
  );
}

/**
 * Helper to verify response format
 */
export function expectErrorResponse(
  data: any,
  expectedCode: string
): void {
  expect(data).toHaveProperty('error');
  expect(data.error).toHaveProperty('code', expectedCode);
  expect(data.error).toHaveProperty('message');
  expect(data.error).toHaveProperty('correlationId');
  expect(data.error.correlationId).toMatch(/^verify-\d+-[a-z0-9]+$/);
}

/**
 * Helper to verify redirect response
 */
export function expectRedirectResponse(
  response: Response,
  expectedPath: string
): void {
  expect(response.status).toBe(302);
  const location = response.headers.get('location');
  expect(location).toBeTruthy();
  expect(location).toContain(expectedPath);
}

/**
 * Helper to measure response time
 */
export async function measureResponseTime(
  fn: () => Promise<any>
): Promise<{ result: any; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
}

/**
 * Helper to wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to retry operation
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await waitFor(delay * attempt);
      }
    }
  }

  throw lastError;
}

/**
 * Cleanup helper for tests
 */
export class TestCleanup {
  private userIds: string[] = [];

  addUser(userId: string): void {
    this.userIds.push(userId);
  }

  async cleanup(): Promise<void> {
    if (this.userIds.length > 0) {
      await deleteTestUsers(this.userIds);
      this.userIds = [];
    }
  }
}
