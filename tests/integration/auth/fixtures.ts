/**
 * Auth Integration Tests - Fixtures
 * 
 * Test data and utilities for auth integration tests
 */

import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export interface TestUser {
  id?: string;
  fullName: string;
  email: string;
  password: string;
  hashedPassword?: string;
}

/**
 * Valid test user data
 */
export const validUsers = {
  john: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    password: 'SecurePass123!',
  },
  jane: {
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'AnotherSecure456!',
  },
  admin: {
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPass789!',
  },
};

/**
 * Invalid test data for validation testing
 */
export const invalidUsers = {
  missingName: {
    email: 'test@example.com',
    password: 'SecurePass123!',
  },
  missingEmail: {
    fullName: 'Test User',
    password: 'SecurePass123!',
  },
  missingPassword: {
    fullName: 'Test User',
    email: 'test@example.com',
  },
  invalidEmail: {
    fullName: 'Test User',
    email: 'not-an-email',
    password: 'SecurePass123!',
  },
  shortPassword: {
    fullName: 'Test User',
    email: 'test@example.com',
    password: 'short',
  },
};

/**
 * Edge case test data
 */
export const edgeCaseUsers = {
  longName: {
    fullName: 'A'.repeat(255),
    email: 'longname@example.com',
    password: 'SecurePass123!',
  },
  specialCharsName: {
    fullName: "O'Brien-Müller",
    email: 'special@example.com',
    password: 'SecurePass123!',
  },
  unicodeName: {
    fullName: '李明 José García',
    email: 'unicode@example.com',
    password: 'SecurePass123!',
  },
  plusAddressing: {
    fullName: 'Plus User',
    email: 'user+test@example.com',
    password: 'SecurePass123!',
  },
  longPassword: {
    fullName: 'Long Pass User',
    email: 'longpass@example.com',
    password: 'A'.repeat(100),
  },
};

/**
 * Create a test user in the database
 */
export async function createTestUser(userData: TestUser) {
  const hashedPassword = await hash(userData.password, 12);
  
  return await prisma.user.create({
    data: {
      email: userData.email.toLowerCase(),
      name: userData.fullName,
      password: hashedPassword,
      emailVerified: null,
    },
  });
}

/**
 * Create multiple test users
 */
export async function createTestUsers(users: TestUser[]) {
  const promises = users.map(user => createTestUser(user));
  return await Promise.all(promises);
}

/**
 * Clean up test users by email pattern
 */
export async function cleanupTestUsers(emailPattern: string = '@example.com') {
  return await prisma.user.deleteMany({
    where: {
      email: {
        contains: emailPattern,
      },
    },
  });
}

/**
 * Get test user by email
 */
export async function getTestUser(email: string) {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

/**
 * Generate random test user data
 */
export function generateRandomUser(): TestUser {
  const random = Math.random().toString(36).substring(7);
  return {
    fullName: `Test User ${random}`,
    email: `test.${random}@example.com`,
    password: `SecurePass${random}123!`,
  };
}

/**
 * Generate valid credentials for testing
 */
export function generateValidCredentials(): TestUser {
  return generateRandomUser();
}

/**
 * Generate invalid credentials for testing
 */
export function generateInvalidCredentials() {
  return {
    email: 'invalid-email',
    password: 'short',
  };
}

/**
 * Generate multiple random users
 */
export function generateRandomUsers(count: number): TestUser[] {
  return Array.from({ length: count }, () => generateRandomUser());
}

/**
 * Mock NextRequest for testing
 */
export function createMockRequest(body: any) {
  return {
    json: async () => body,
    headers: new Headers({
      'content-type': 'application/json',
    }),
  } as any;
}

/**
 * Validate response schema
 */
export function validateSuccessResponse(data: any) {
  return (
    data.success === true &&
    typeof data.user === 'object' &&
    typeof data.user.id === 'string' &&
    typeof data.user.email === 'string' &&
    typeof data.user.name === 'string'
  );
}

export function validateErrorResponse(data: any) {
  return typeof data.error === 'string' && data.error.length > 0;
}

/**
 * Wait for async operations
 */
export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Measure execution time
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * NextAuth-specific fixtures
 */

export interface TestSession {
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface TestAccount {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
}

/**
 * Create test session
 */
export async function createTestSession(
  userId: string,
  options: Partial<TestSession> = {}
): Promise<TestSession> {
  const sessionToken = options.sessionToken || `test-session-${Math.random().toString(36).substring(7)}`;
  const expires = options.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  return {
    sessionToken: session.sessionToken,
    userId: session.userId,
    expires: session.expires,
  };
}

/**
 * Create test OAuth account
 */
export async function createTestAccount(
  userId: string,
  provider: string = 'google',
  options: Partial<TestAccount> = {}
): Promise<TestAccount> {
  const account = await prisma.account.create({
    data: {
      userId,
      type: options.type || 'oauth',
      provider,
      providerAccountId: options.providerAccountId || `provider-${Math.random().toString(36).substring(7)}`,
      access_token: options.access_token,
      refresh_token: options.refresh_token,
      expires_at: options.expires_at,
      token_type: options.token_type || 'Bearer',
      scope: options.scope,
    },
  });

  return {
    id: account.id,
    userId: account.userId,
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    access_token: account.access_token || undefined,
    refresh_token: account.refresh_token || undefined,
    expires_at: account.expires_at || undefined,
    token_type: account.token_type || undefined,
    scope: account.scope || undefined,
  };
}

/**
 * Clean up test sessions
 */
export async function cleanupTestSessions() {
  return await prisma.session.deleteMany({
    where: {
      sessionToken: {
        startsWith: 'test-session-',
      },
    },
  });
}

/**
 * Clean up test accounts
 */
export async function cleanupTestAccounts() {
  return await prisma.account.deleteMany({
    where: {
      providerAccountId: {
        startsWith: 'provider-',
      },
    },
  });
}

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
  await cleanupTestSessions();
  await cleanupTestAccounts();
  await cleanupTestUsers();
}

/**
 * OAuth provider test data
 */
export const oauthProviders = {
  google: {
    provider: 'google',
    type: 'oauth',
    scope: 'openid email profile',
    token_type: 'Bearer',
  },
  instagram: {
    provider: 'instagram',
    type: 'oauth',
    scope: 'instagram_basic,pages_show_list',
    token_type: 'Bearer',
  },
  tiktok: {
    provider: 'tiktok',
    type: 'oauth',
    scope: 'user.info.basic,video.upload',
    token_type: 'Bearer',
  },
  reddit: {
    provider: 'reddit',
    type: 'oauth',
    scope: 'identity,submit,read',
    token_type: 'bearer',
  },
};

/**
 * Generate mock OAuth tokens
 */
export function generateMockOAuthTokens(provider: string) {
  return {
    access_token: `mock_access_token_${provider}_${Math.random().toString(36).substring(7)}`,
    refresh_token: `mock_refresh_token_${provider}_${Math.random().toString(36).substring(7)}`,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    token_type: 'Bearer',
    scope: oauthProviders[provider as keyof typeof oauthProviders]?.scope || '',
  };
}

/**
 * Validate session response
 */
export function validateSessionResponse(data: any) {
  return (
    typeof data === 'object' &&
    (data.user === undefined || typeof data.user === 'object') &&
    (data.expires === undefined || typeof data.expires === 'string')
  );
}

/**
 * Validate CSRF token response
 */
export function validateCSRFResponse(data: any) {
  return (
    typeof data === 'object' &&
    typeof data.csrfToken === 'string' &&
    data.csrfToken.length > 0
  );
}

/**
 * Validate providers response
 */
export function validateProvidersResponse(data: any) {
  return (
    typeof data === 'object' &&
    Object.keys(data).length > 0 &&
    Object.values(data).every((provider: any) => 
      typeof provider === 'object' &&
      typeof provider.id === 'string' &&
      typeof provider.name === 'string' &&
      typeof provider.type === 'string'
    )
  );
}
