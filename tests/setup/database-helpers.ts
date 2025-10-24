/**
 * Database Helpers for Testing
 * Provides utilities for setting up and cleaning test data
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

export interface TestUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  subscription: 'free' | 'premium' | 'enterprise';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestRefreshToken {
  id?: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt?: Date;
}

export interface TestData {
  users?: TestUser[];
  refreshTokens?: TestRefreshToken[];
}

/**
 * Clean up all test data from database
 */
export async function cleanupDatabase(): Promise<void> {
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('Database cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up database:', error);
    throw error;
  }
}

/**
 * Seed test data into database
 */
export async function seedTestData(data: TestData): Promise<void> {
  try {
    // Seed users
    if (data.users && data.users.length > 0) {
      for (const user of data.users) {
        await prisma.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            passwordHash: user.passwordHash,
            isActive: user.isActive,
            subscription: user.subscription,
            createdAt: user.createdAt || new Date(),
            updatedAt: user.updatedAt || new Date(),
          },
        });
      }
      console.log(`Seeded ${data.users.length} test users`);
    }

    // Seed refresh tokens
    if (data.refreshTokens && data.refreshTokens.length > 0) {
      for (const token of data.refreshTokens) {
        await prisma.refreshToken.create({
          data: {
            id: token.id,
            token: token.token,
            userId: token.userId,
            expiresAt: token.expiresAt,
            createdAt: token.createdAt || new Date(),
          },
        });
      }
      console.log(`Seeded ${data.refreshTokens.length} test refresh tokens`);
    }
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}

/**
 * Create a test user with hashed password
 */
export async function createTestUser(userData: {
  id?: string;
  name: string;
  email: string;
  password: string;
  isActive?: boolean;
  subscription?: 'free' | 'premium' | 'enterprise';
}): Promise<TestUser> {
  const passwordHash = await bcrypt.hash(userData.password, 12);
  
  const user: TestUser = {
    id: userData.id || `test-user-${Date.now()}`,
    name: userData.name,
    email: userData.email,
    passwordHash,
    isActive: userData.isActive ?? true,
    subscription: userData.subscription || 'free',
  };

  await prisma.user.create({
    data: user,
  });

  return user;
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number, baseData?: Partial<TestUser>): Promise<TestUser[]> {
  const users: TestUser[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      name: baseData?.name || `Test User ${i + 1}`,
      email: baseData?.email || `testuser${i + 1}@example.com`,
      password: 'password123',
      isActive: baseData?.isActive ?? true,
      subscription: baseData?.subscription || 'free',
    });
    users.push(user);
  }

  return users;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<TestUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return user as TestUser | null;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<TestUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  return user as TestUser | null;
}

/**
 * Create refresh token for user
 */
export async function createRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<TestRefreshToken> {
  const refreshToken = await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return refreshToken as TestRefreshToken;
}

/**
 * Get refresh tokens for user
 */
export async function getRefreshTokensForUser(userId: string): Promise<TestRefreshToken[]> {
  const tokens = await prisma.refreshToken.findMany({
    where: { userId },
  });

  return tokens as TestRefreshToken[];
}

/**
 * Delete refresh token
 */
export async function deleteRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.delete({
    where: { token },
  });
}

/**
 * Count users in database
 */
export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

/**
 * Count refresh tokens in database
 */
export async function countRefreshTokens(): Promise<number> {
  return prisma.refreshToken.count();
}

/**
 * Verify database connection
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Reset database to clean state
 */
export async function resetDatabase(): Promise<void> {
  await cleanupDatabase();
  
  // Reset any auto-increment sequences if needed
  // This is database-specific and might need adjustment
  try {
    // For PostgreSQL
    await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "User_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "RefreshToken_id_seq" RESTART WITH 1`;
  } catch (error) {
    // Ignore sequence reset errors for other databases
    console.log('Sequence reset not applicable or failed (this is usually fine)');
  }
}

/**
 * Setup test database for testing
 */
export async function setupTestDatabase(): Promise<void> {
  const isConnected = await verifyDatabaseConnection();
  
  if (!isConnected) {
    throw new Error('Cannot connect to test database');
  }

  await resetDatabase();
  console.log('Test database setup complete');
}

/**
 * Teardown test database after testing
 */
export async function teardownTestDatabase(): Promise<void> {
  await cleanupDatabase();
  await prisma.$disconnect();
  console.log('Test database teardown complete');
}

/**
 * Create test data fixtures for common scenarios
 */
export const TestFixtures = {
  /**
   * Create a basic active user
   */
  async createActiveUser(overrides?: Partial<TestUser>): Promise<TestUser> {
    return createTestUser({
      name: 'Active User',
      email: 'active@example.com',
      password: 'password123',
      isActive: true,
      subscription: 'free',
      ...overrides,
    });
  },

  /**
   * Create an inactive user
   */
  async createInactiveUser(overrides?: Partial<TestUser>): Promise<TestUser> {
    return createTestUser({
      name: 'Inactive User',
      email: 'inactive@example.com',
      password: 'password123',
      isActive: false,
      subscription: 'free',
      ...overrides,
    });
  },

  /**
   * Create a premium user
   */
  async createPremiumUser(overrides?: Partial<TestUser>): Promise<TestUser> {
    return createTestUser({
      name: 'Premium User',
      email: 'premium@example.com',
      password: 'password123',
      isActive: true,
      subscription: 'premium',
      ...overrides,
    });
  },

  /**
   * Create user with refresh token
   */
  async createUserWithRefreshToken(userOverrides?: Partial<TestUser>): Promise<{
    user: TestUser;
    refreshToken: TestRefreshToken;
  }> {
    const user = await this.createActiveUser(userOverrides);
    const refreshToken = await createRefreshToken(
      user.id,
      `refresh_token_${Date.now()}`,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    );

    return { user, refreshToken };
  },

  /**
   * Create multiple users for load testing
   */
  async createUsersForLoadTest(count: number): Promise<TestUser[]> {
    return createTestUsers(count, {
      subscription: 'free',
      isActive: true,
    });
  },
};

// Export prisma instance for direct database operations in tests
export { prisma };

// Cleanup function to be called in test teardown
export async function cleanup(): Promise<void> {
  await teardownTestDatabase();
}