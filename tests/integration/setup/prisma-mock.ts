/**
 * Prisma Mock for Integration Tests
 * 
 * Provides mock implementations of Prisma client for testing
 * without requiring a real database connection.
 */

import { vi } from 'vitest';

// Mock user data
const mockUsers = new Map();
const mockUserStats = new Map();
const mockIntegrations = new Map();
const mockOAuthAccounts = new Map();

let userIdCounter = 1;
let statsIdCounter = 1;
let integrationIdCounter = 1;
let oauthAccountIdCounter = 1;

export const mockPrisma = {
  user: {
    findUnique: vi.fn(async ({ where }) => {
      if (where.id) {
        return mockUsers.get(where.id) || null;
      }
      if (where.email) {
        return Array.from(mockUsers.values()).find((u: any) => u.email === where.email) || null;
      }
      return null;
    }),
    
    create: vi.fn(async ({ data }) => {
      const id = userIdCounter++;
      const user = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.set(id, user);
      return user;
    }),
    
    update: vi.fn(async ({ where, data }) => {
      const user = mockUsers.get(where.id);
      if (!user) throw new Error('User not found');
      
      const updated = {
        ...user,
        ...data,
        updatedAt: new Date(),
      };
      mockUsers.set(where.id, updated);
      return updated;
    }),
    
    deleteMany: vi.fn(async () => {
      const count = mockUsers.size;
      mockUsers.clear();
      userIdCounter = 1;
      return { count };
    }),
  },
  
  userStats: {
    findUnique: vi.fn(async ({ where }) => {
      if (where.userId) {
        return mockUserStats.get(where.userId) || null;
      }
      return null;
    }),
    
    create: vi.fn(async ({ data }) => {
      const id = `stats-${statsIdCounter++}`;
      const stats = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserStats.set(data.userId, stats);
      return stats;
    }),
    
    update: vi.fn(async ({ where, data }) => {
      const stats = mockUserStats.get(where.userId);
      if (!stats) throw new Error('Stats not found');
      
      const updated = {
        ...stats,
        ...data,
        updatedAt: new Date(),
      };
      mockUserStats.set(where.userId, updated);
      return updated;
    }),
    
    upsert: vi.fn(async ({ where, create, update }) => {
      const existing = mockUserStats.get(where.userId);
      
      if (existing) {
        const updated = {
          ...existing,
          ...update,
          updatedAt: new Date(),
        };
        mockUserStats.set(where.userId, updated);
        return updated;
      } else {
        const id = `stats-${statsIdCounter++}`;
        const stats = {
          id,
          ...create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockUserStats.set(create.userId, stats);
        return stats;
      }
    }),
    
    deleteMany: vi.fn(async () => {
      const count = mockUserStats.size;
      mockUserStats.clear();
      statsIdCounter = 1;
      return { count };
    }),
  },
  
  integration: {
    findMany: vi.fn(async ({ where }) => {
      const integrations = Array.from(mockIntegrations.values());
      
      if (where?.userId) {
        return integrations.filter((i: any) => i.userId === where.userId);
      }
      
      return integrations;
    }),
    
    findUnique: vi.fn(async ({ where }) => {
      if (where.id) {
        return mockIntegrations.get(where.id) || null;
      }
      return null;
    }),
    
    create: vi.fn(async ({ data }) => {
      const id = `integration-${integrationIdCounter++}`;
      const integration = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockIntegrations.set(id, integration);
      return integration;
    }),
    
    update: vi.fn(async ({ where, data }) => {
      const integration = mockIntegrations.get(where.id);
      if (!integration) throw new Error('Integration not found');
      
      const updated = {
        ...integration,
        ...data,
        updatedAt: new Date(),
      };
      mockIntegrations.set(where.id, updated);
      return updated;
    }),
    
    deleteMany: vi.fn(async ({ where }) => {
      if (where?.userId) {
        const toDelete = Array.from(mockIntegrations.entries())
          .filter(([_, i]: any) => i.userId === where.userId);
        
        toDelete.forEach(([id]) => mockIntegrations.delete(id));
        return { count: toDelete.length };
      }
      
      const count = mockIntegrations.size;
      mockIntegrations.clear();
      integrationIdCounter = 1;
      return { count };
    }),
  },
  
  oAuthAccount: {
    findMany: vi.fn(async ({ where }) => {
      const accounts = Array.from(mockOAuthAccounts.values());
      
      if (where?.userId) {
        return accounts.filter((a: any) => a.userId === where.userId);
      }
      
      if (where?.provider) {
        return accounts.filter((a: any) => a.provider === where.provider);
      }
      
      return accounts;
    }),
    
    findUnique: vi.fn(async ({ where }) => {
      if (where.id) {
        return mockOAuthAccounts.get(where.id) || null;
      }
      
      if (where.userId_provider_providerAccountId) {
        const { userId, provider, providerAccountId } = where.userId_provider_providerAccountId;
        return Array.from(mockOAuthAccounts.values()).find(
          (a: any) => a.userId === userId && a.provider === provider && a.providerAccountId === providerAccountId
        ) || null;
      }
      
      return null;
    }),
    
    findFirst: vi.fn(async ({ where }) => {
      const accounts = Array.from(mockOAuthAccounts.values());
      
      if (where?.userId && where?.provider) {
        return accounts.find((a: any) => a.userId === where.userId && a.provider === where.provider) || null;
      }
      
      return accounts[0] || null;
    }),
    
    create: vi.fn(async ({ data }) => {
      const id = oauthAccountIdCounter++;
      const account = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockOAuthAccounts.set(id, account);
      return account;
    }),
    
    update: vi.fn(async ({ where, data }) => {
      const account = mockOAuthAccounts.get(where.id);
      if (!account) throw new Error('OAuth account not found');
      
      const updated = {
        ...account,
        ...data,
        updatedAt: new Date(),
      };
      mockOAuthAccounts.set(where.id, updated);
      return updated;
    }),
    
    delete: vi.fn(async ({ where }) => {
      const account = mockOAuthAccounts.get(where.id);
      if (!account) throw new Error('OAuth account not found');
      
      mockOAuthAccounts.delete(where.id);
      return account;
    }),
    
    deleteMany: vi.fn(async ({ where }) => {
      if (where?.userId) {
        const toDelete = Array.from(mockOAuthAccounts.entries())
          .filter(([_, a]: any) => a.userId === where.userId);
        
        toDelete.forEach(([id]) => mockOAuthAccounts.delete(id));
        return { count: toDelete.length };
      }
      
      if (where?.provider) {
        const toDelete = Array.from(mockOAuthAccounts.entries())
          .filter(([_, a]: any) => a.provider === where.provider);
        
        toDelete.forEach(([id]) => mockOAuthAccounts.delete(id));
        return { count: toDelete.length };
      }
      
      const count = mockOAuthAccounts.size;
      mockOAuthAccounts.clear();
      oauthAccountIdCounter = 1;
      return { count };
    }),
  },
  
  $disconnect: vi.fn(async () => {}),
};

/**
 * Reset all mock data
 */
export function resetMockData() {
  mockUsers.clear();
  mockUserStats.clear();
  mockIntegrations.clear();
  mockOAuthAccounts.clear();
  userIdCounter = 1;
  statsIdCounter = 1;
  integrationIdCounter = 1;
  oauthAccountIdCounter = 1;
}

/**
 * Seed mock data for testing
 */
export function seedMockData() {
  // Create test user
  const testUser = {
    id: 1,
    email: 'test@example.com',
    password: '$2a$12$hashedpassword',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockUsers.set(1, testUser);
  userIdCounter = 2;
  
  // Create test stats
  const testStats = {
    id: 'stats-1',
    userId: 1,
    messagesSent: 100,
    messagesTrend: 5.5,
    responseRate: 85.5,
    responseRateTrend: 2.3,
    revenue: 1500.50,
    revenueTrend: 10.2,
    activeChats: 25,
    activeChatsTrend: 3.1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockUserStats.set(1, testStats);
  statsIdCounter = 2;
  
  // Create test integrations
  const testIntegration = {
    id: 'integration-1',
    userId: 1,
    provider: 'instagram',
    accountId: 'test-account',
    connected: true,
    accessToken: 'encrypted-token',
    lastSync: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockIntegrations.set('integration-1', testIntegration);
  integrationIdCounter = 2;
}
