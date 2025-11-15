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
