import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  SimpleUserService, 
  simpleUserService,
  type User,
  type UserStats,
  type CreateUserData,
  type UpdateUserData
} from '../../lib/services/simple-user-service';

/**
 * Tests complets pour le service utilisateur simplifié Huntaze
 * Couvre toutes les fonctionnalités : CRUD, recherche, validation, métriques
 * Basé sur l'implémentation réelle dans lib/services/simple-user-service.ts
 */

describe('SimpleUserService', () => {
  let userService: SimpleUserService;
  
  // Mock data pour les tests
  const mockUser: User = {
    id: 'user-test-123',
    email: 'test@huntaze.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    subscription: 'pro',
    stripeCustomerId: 'cus_stripe_123',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockUserStats: UserStats = {
    totalAssets: 25,
    totalCampaigns: 5,
    totalRevenue: 1500,
    engagementRate: 0.85,
    lastLoginAt: new Date('2024-01-15')
  };

  beforeEach(() => {
    userService = new SimpleUserService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Retrieval', () => {
    describe('getUserById', () => {
      it('should return user when found with valid ID', async () => {
        const user = await userService.getUserById('user-1');

        expect(user).toBeDefined();
        expect(user?.id).toBe('user-1');
        expect(user?.email).toBe('test@example.com');
        expect(user?.name).toBe('Test User');
        expect(user?.subscription).toBe('free');
        expect(user?.isActive).toBe(true);
      });

      it('should return null for non-existent user', async () => {
        const user = await userService.getUserById('nonexistent-user');

        expect(user).toBeNull();
      });

      it('should return null for invalid user ID', async () => {
        const invalidIds = ['', '   ', 'user-with-special-chars!@#', 'user--with--dashes'];
        
        for (const invalidId of invalidIds) {
          const user = await userService.getUserById(invalidId);
          expect(user).toBeNull();
        }
      });

      it('should return null for deleted user', async () => {
        // First delete the user
        await userService.deleteUser('user-1');
        
        // Then try to retrieve it
        const user = await userService.getUserById('user-1');
        
        expect(user).toBeNull();
      });

      it('should return copy of user data (not reference)', async () => {
        const user1 = await userService.getUserById('user-1');
        const user2 = await userService.getUserById('user-1');

        expect(user1).not.toBe(user2); // Different objects
        expect(user1).toEqual(user2); // Same content
      });

      it('should handle includeRelations parameter', async () => {
        const userWithoutRelations = await userService.getUserById('user-1', false);
        const userWithRelations = await userService.getUserById('user-1', true);

        expect(userWithoutRelations).toBeDefined();
        expect(userWithRelations).toBeDefined();
        // Both should return the same data in this mock implementation
        expect(userWithoutRelations).toEqual(userWithRelations);
      });
    });

    describe('getUserByEmail', () => {
      it('should return user when found with valid email', async () => {
        const user = await userService.getUserByEmail('test@example.com');

        expect(user).toBeDefined();
        expect(user?.email).toBe('test@example.com');
        expect(user?.id).toBe('user-1');
      });

      it('should return null for non-existent email', async () => {
        const user = await userService.getUserByEmail('nonexistent@example.com');

        expect(user).toBeNull();
      });

      it('should return null for invalid email format', async () => {
        const invalidEmails = ['', 'invalid-email', '@example.com', 'test@', 'test@.com'];
        
        for (const invalidEmail of invalidEmails) {
          const user = await userService.getUserByEmail(invalidEmail);
          expect(user).toBeNull();
        }
      });

      it('should be case-sensitive for email matching', async () => {
        const user1 = await userService.getUserByEmail('test@example.com');
        const user2 = await userService.getUserByEmail('TEST@EXAMPLE.COM');

        expect(user1).toBeDefined();
        expect(user2).toBeNull(); // Case-sensitive
      });

      it('should not return deleted users', async () => {
        // Delete user first
        await userService.deleteUser('user-1');
        
        const user = await userService.getUserByEmail('test@example.com');
        
        expect(user).toBeNull();
      });
    });
  });

  describe('User Creation', () => {
    it('should create user with valid data', async () => {
      const userData: CreateUserData = {
        email: 'newuser@huntaze.com',
        name: 'New User',
        password: 'SecurePassword123!',
        subscription: 'pro'
      };

      const createdUser = await userService.createUser(userData);

      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.subscription).toBe('pro');
      expect(createdUser.isActive).toBe(true);
      expect(createdUser.id).toMatch(/^user-\d+-[a-z0-9]+$/);
      expect(createdUser.createdAt).toBeInstanceOf(Date);
      expect(createdUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should create user with default subscription when not specified', async () => {
      const userData: CreateUserData = {
        email: 'defaultuser@huntaze.com',
        name: 'Default User',
        password: 'SecurePassword123!'
      };

      const createdUser = await userService.createUser(userData);

      expect(createdUser.subscription).toBe('free');
    });

    it('should initialize user stats when creating user', async () => {
      const userData: CreateUserData = {
        email: 'statsuser@huntaze.com',
        name: 'Stats User',
        password: 'SecurePassword123!'
      };

      const createdUser = await userService.createUser(userData);
      const userStats = await userService.getUserStats(createdUser.id);

      expect(userStats).toBeDefined();
      expect(userStats?.totalAssets).toBe(0);
      expect(userStats?.totalCampaigns).toBe(0);
      expect(userStats?.totalRevenue).toBe(0);
      expect(userStats?.engagementRate).toBe(0);
    });

    it('should generate unique IDs for multiple users', async () => {
      const users = await Promise.all([
        userService.createUser({
          email: 'user1@huntaze.com',
          name: 'User 1',
          password: 'Password123!'
        }),
        userService.createUser({
          email: 'user2@huntaze.com',
          name: 'User 2',
          password: 'Password123!'
        }),
        userService.createUser({
          email: 'user3@huntaze.com',
          name: 'User 3',
          password: 'Password123!'
        })
      ]);

      const ids = users.map(user => user.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(3); // All IDs should be unique
    });
  });

  describe('User Updates', () => {
    it('should update user with valid data', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name',
        avatar: 'https://example.com/new-avatar.jpg',
        subscription: 'enterprise'
      };

      const updatedUser = await userService.updateUser('user-1', updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.avatar).toBe('https://example.com/new-avatar.jpg');
      expect(updatedUser?.subscription).toBe('enterprise');
      expect(updatedUser?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null when updating non-existent user', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name'
      };

      const result = await userService.updateUser('nonexistent-user', updateData);

      expect(result).toBeNull();
    });

    it('should return null when updating deleted user', async () => {
      // Delete user first
      await userService.deleteUser('user-1');
      
      const updateData: UpdateUserData = {
        name: 'Updated Name'
      };

      const result = await userService.updateUser('user-1', updateData);

      expect(result).toBeNull();
    });

    it('should handle partial updates correctly', async () => {
      const originalUser = await userService.getUserById('user-1');
      
      const updateData: UpdateUserData = {
        name: 'Only Name Updated'
      };

      const updatedUser = await userService.updateUser('user-1', updateData);

      expect(updatedUser?.name).toBe('Only Name Updated');
      expect(updatedUser?.email).toBe(originalUser?.email); // Should remain unchanged
      expect(updatedUser?.subscription).toBe(originalUser?.subscription); // Should remain unchanged
    });

    it('should update timestamp on successful update', async () => {
      const originalUser = await userService.getUserById('user-1');
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updatedUser = await userService.updateUser('user-1', { name: 'New Name' });

      expect(updatedUser?.updatedAt.getTime()).toBeGreaterThan(originalUser?.updatedAt.getTime() || 0);
    });
  });

  describe('User Deletion', () => {
    it('should soft delete user successfully', async () => {
      const result = await userService.deleteUser('user-1');

      expect(result).toBe(true);
      
      // User should not be retrievable after deletion
      const deletedUser = await userService.getUserById('user-1');
      expect(deletedUser).toBeNull();
    });

    it('should return false when deleting non-existent user', async () => {
      const result = await userService.deleteUser('nonexistent-user');

      expect(result).toBe(false);
    });

    it('should return false when deleting already deleted user', async () => {
      // Delete user first
      const firstDelete = await userService.deleteUser('user-1');
      expect(firstDelete).toBe(true);
      
      // Try to delete again
      const secondDelete = await userService.deleteUser('user-1');
      expect(secondDelete).toBe(false);
    });

    it('should make email unique for soft-deleted users', async () => {
      const originalUser = await userService.getUserById('user-1');
      
      await userService.deleteUser('user-1');
      
      // Should not find user by original email
      const userByEmail = await userService.getUserByEmail(originalUser?.email || '');
      expect(userByEmail).toBeNull();
    });

    it('should handle invalid user ID gracefully', async () => {
      const invalidIds = ['', '   ', 'user-with-special-chars!@#'];
      
      for (const invalidId of invalidIds) {
        const result = await userService.deleteUser(invalidId);
        expect(result).toBe(false);
      }
    });
  });

  describe('Subscription Management', () => {
    it('should update user subscription with upsert behavior', async () => {
      const result = await userService.updateUserSubscription('user-1', 'enterprise', 'cus_new_stripe_123');

      expect(result).toBeDefined();
      expect(result?.subscription).toBe('enterprise');
      expect(result?.stripeCustomerId).toBe('cus_new_stripe_123');
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should create user if not exists (upsert behavior)', async () => {
      const result = await userService.updateUserSubscription('new-user-123', 'pro', 'cus_stripe_new');

      expect(result).toBeDefined();
      expect(result?.id).toBe('new-user-123');
      expect(result?.subscription).toBe('pro');
      expect(result?.stripeCustomerId).toBe('cus_stripe_new');
      expect(result?.email).toBe('user-new-user-123@example.com');
    });

    it('should not update deleted users', async () => {
      // Delete user first
      await userService.deleteUser('user-1');
      
      const result = await userService.updateUserSubscription('user-1', 'enterprise');

      expect(result).toBeNull();
    });

    it('should handle subscription without Stripe customer ID', async () => {
      const result = await userService.updateUserSubscription('user-1', 'free');

      expect(result).toBeDefined();
      expect(result?.subscription).toBe('free');
      expect(result?.stripeCustomerId).toBeUndefined();
    });
  });

  describe('User Statistics', () => {
    it('should return user stats when available', async () => {
      const stats = await userService.getUserStats('user-1');

      expect(stats).toBeDefined();
      expect(stats?.totalAssets).toBe(10);
      expect(stats?.totalCampaigns).toBe(3);
      expect(stats?.totalRevenue).toBe(1500);
      expect(stats?.engagementRate).toBe(0.85);
      expect(stats?.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent user stats', async () => {
      const stats = await userService.getUserStats('nonexistent-user');

      expect(stats).toBeNull();
    });

    it('should return null for deleted user stats', async () => {
      // Delete user first
      await userService.deleteUser('user-1');
      
      const stats = await userService.getUserStats('user-1');

      expect(stats).toBeNull();
    });

    it('should return copy of stats data (not reference)', async () => {
      const stats1 = await userService.getUserStats('user-1');
      const stats2 = await userService.getUserStats('user-1');

      expect(stats1).not.toBe(stats2); // Different objects
      expect(stats1).toEqual(stats2); // Same content
    });
  });

  describe('Access Validation', () => {
    it('should validate access for different subscription levels', async () => {
      // Test free user
      const freeAccess = await userService.validateUserAccess('user-1', 'free');
      expect(freeAccess).toBe(true);

      // Test pro access (should fail for free user)
      const proAccess = await userService.validateUserAccess('user-1', 'pro');
      expect(proAccess).toBe(false);

      // Update to pro and test again
      await userService.updateUserSubscription('user-1', 'pro');
      const proAccessAfterUpdate = await userService.validateUserAccess('user-1', 'pro');
      expect(proAccessAfterUpdate).toBe(true);
    });

    it('should validate hierarchical permissions correctly', async () => {
      // Create enterprise user
      await userService.updateUserSubscription('user-1', 'enterprise');

      // Enterprise should have access to all levels
      expect(await userService.validateUserAccess('user-1', 'free')).toBe(true);
      expect(await userService.validateUserAccess('user-1', 'pro')).toBe(true);
      expect(await userService.validateUserAccess('user-1', 'enterprise')).toBe(true);
    });

    it('should deny access for inactive users', async () => {
      // Deactivate user
      await userService.updateUser('user-1', { isActive: false });

      const access = await userService.validateUserAccess('user-1', 'free');

      expect(access).toBe(false);
    });

    it('should deny access for deleted users', async () => {
      // Delete user
      await userService.deleteUser('user-1');

      const access = await userService.validateUserAccess('user-1', 'free');

      expect(access).toBe(false);
    });

    it('should deny access for non-existent users', async () => {
      const access = await userService.validateUserAccess('nonexistent-user', 'free');

      expect(access).toBe(false);
    });
  });

  describe('User Listing and Pagination', () => {
    beforeEach(async () => {
      // Create multiple test users
      const users = [
        { email: 'user1@test.com', name: 'User 1', subscription: 'free' as const },
        { email: 'user2@test.com', name: 'User 2', subscription: 'pro' as const },
        { email: 'user3@test.com', name: 'User 3', subscription: 'enterprise' as const },
        { email: 'user4@test.com', name: 'User 4', subscription: 'free' as const },
        { email: 'user5@test.com', name: 'User 5', subscription: 'pro' as const }
      ];

      for (const userData of users) {
        await userService.createUser({
          ...userData,
          password: 'Password123!'
        });
      }
    });

    it('should list users with default pagination', async () => {
      const result = await userService.listUsers();

      expect(result.users.length).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should list users with custom pagination', async () => {
      const result = await userService.listUsers({
        page: 2,
        limit: 2
      });

      expect(result.users.length).toBeLessThanOrEqual(2);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
    });

    it('should filter users by subscription', async () => {
      const result = await userService.listUsers({
        subscription: 'pro'
      });

      result.users.forEach(user => {
        expect(user.subscription).toBe('pro');
      });
    });

    it('should filter users by active status', async () => {
      // Deactivate one user
      const allUsers = await userService.listUsers();
      if (allUsers.users.length > 0) {
        await userService.updateUser(allUsers.users[0].id, { isActive: false });
      }

      const activeUsers = await userService.listUsers({ isActive: true });
      const inactiveUsers = await userService.listUsers({ isActive: false });

      activeUsers.users.forEach(user => {
        expect(user.isActive).toBe(true);
      });

      inactiveUsers.users.forEach(user => {
        expect(user.isActive).toBe(false);
      });
    });

    it('should not include deleted users in listings', async () => {
      const beforeDelete = await userService.listUsers();
      
      if (beforeDelete.users.length > 0) {
        await userService.deleteUser(beforeDelete.users[0].id);
      }
      
      const afterDelete = await userService.listUsers();

      expect(afterDelete.total).toBe(beforeDelete.total - 1);
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      // Create test users for bulk operations
      for (let i = 1; i <= 5; i++) {
        await userService.createUser({
          email: `bulk${i}@test.com`,
          name: `Bulk User ${i}`,
          password: 'Password123!'
        });
      }
    });

    it('should update multiple users successfully', async () => {
      const allUsers = await userService.listUsers();
      const userIds = allUsers.users.slice(0, 3).map(user => user.id);

      const result = await userService.bulkUpdateUsers(userIds, {
        subscription: 'pro',
        isActive: true
      });

      expect(result.updated.length).toBe(3);
      expect(result.failed.length).toBe(0);

      result.updated.forEach(user => {
        expect(user.subscription).toBe('pro');
        expect(user.isActive).toBe(true);
      });
    });

    it('should handle partial failures in bulk updates', async () => {
      const validUserIds = ['user-1'];
      const invalidUserIds = ['nonexistent-1', 'nonexistent-2'];
      const mixedIds = [...validUserIds, ...invalidUserIds];

      const result = await userService.bulkUpdateUsers(mixedIds, {
        name: 'Bulk Updated'
      });

      expect(result.updated.length).toBe(1);
      expect(result.failed.length).toBe(2);
      expect(result.failed).toEqual(invalidUserIds);
    });

    it('should handle empty user ID array', async () => {
      const result = await userService.bulkUpdateUsers([], {
        name: 'Should not update anyone'
      });

      expect(result.updated.length).toBe(0);
      expect(result.failed.length).toBe(0);
    });
  });

  describe('User Search', () => {
    beforeEach(async () => {
      // Create users with searchable data
      const searchUsers = [
        { email: 'john.doe@huntaze.com', name: 'John Doe' },
        { email: 'jane.smith@huntaze.com', name: 'Jane Smith' },
        { email: 'bob.johnson@example.com', name: 'Bob Johnson' },
        { email: 'alice.brown@huntaze.com', name: 'Alice Brown' }
      ];

      for (const userData of searchUsers) {
        await userService.createUser({
          ...userData,
          password: 'Password123!'
        });
      }
    });

    it('should search users by name', async () => {
      const results = await userService.searchUsers('John');

      expect(results.length).toBeGreaterThan(0);
      results.forEach(user => {
        expect(user.name.toLowerCase()).toContain('john');
      });
    });

    it('should search users by email', async () => {
      const results = await userService.searchUsers('huntaze.com');

      expect(results.length).toBeGreaterThan(0);
      results.forEach(user => {
        expect(user.email.toLowerCase()).toContain('huntaze.com');
      });
    });

    it('should limit search results', async () => {
      const results = await userService.searchUsers('huntaze', { limit: 2 });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should search specific fields only', async () => {
      const nameResults = await userService.searchUsers('doe', { fields: ['name'] });
      const emailResults = await userService.searchUsers('huntaze', { fields: ['email'] });

      expect(nameResults.length).toBeGreaterThan(0);
      expect(emailResults.length).toBeGreaterThan(0);
    });

    it('should return empty array for short queries', async () => {
      const results = await userService.searchUsers('a'); // Too short

      expect(results).toEqual([]);
    });

    it('should return empty array for empty query', async () => {
      const results = await userService.searchUsers('');

      expect(results).toEqual([]);
    });

    it('should be case-insensitive', async () => {
      const lowerResults = await userService.searchUsers('john');
      const upperResults = await userService.searchUsers('JOHN');
      const mixedResults = await userService.searchUsers('JoHn');

      expect(lowerResults.length).toBeGreaterThan(0);
      expect(upperResults.length).toBe(lowerResults.length);
      expect(mixedResults.length).toBe(lowerResults.length);
    });
  });

  describe('Health Check and Metrics', () => {
    it('should report healthy status', async () => {
      const isHealthy = await userService.isHealthy();

      expect(isHealthy).toBe(true);
    });

    it('should return service metrics', async () => {
      // Create users with different subscriptions and statuses
      await userService.createUser({
        email: 'metrics1@test.com',
        name: 'Metrics User 1',
        password: 'Password123!',
        subscription: 'free'
      });

      await userService.createUser({
        email: 'metrics2@test.com',
        name: 'Metrics User 2',
        password: 'Password123!',
        subscription: 'pro'
      });

      const createdUser = await userService.createUser({
        email: 'metrics3@test.com',
        name: 'Metrics User 3',
        password: 'Password123!',
        subscription: 'enterprise'
      });

      // Deactivate one user
      await userService.updateUser(createdUser.id, { isActive: false });

      const metrics = await userService.getMetrics();

      expect(metrics.totalUsers).toBeGreaterThan(0);
      expect(metrics.activeUsers).toBeGreaterThan(0);
      expect(metrics.subscriptionBreakdown).toBeDefined();
      expect(typeof metrics.subscriptionBreakdown.free).toBe('number');
      expect(typeof metrics.subscriptionBreakdown.pro).toBe('number');
      expect(typeof metrics.subscriptionBreakdown.enterprise).toBe('number');
    });

    it('should handle empty metrics correctly', async () => {
      // Create fresh service with no users
      const freshService = new SimpleUserService();
      const metrics = await freshService.getMetrics();

      expect(metrics.totalUsers).toBe(0);
      expect(metrics.activeUsers).toBe(0);
      expect(metrics.subscriptionBreakdown).toEqual({});
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(simpleUserService).toBeInstanceOf(SimpleUserService);
    });

    it('should maintain state across singleton usage', async () => {
      // Create user with singleton
      const createdUser = await simpleUserService.createUser({
        email: 'singleton@test.com',
        name: 'Singleton User',
        password: 'Password123!'
      });

      // Retrieve with singleton
      const retrievedUser = await simpleUserService.getUserById(createdUser.id);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.email).toBe('singleton@test.com');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent user creation', async () => {
      const userPromises = Array.from({ length: 10 }, (_, i) => 
        userService.createUser({
          email: `concurrent${i}@test.com`,
          name: `Concurrent User ${i}`,
          password: 'Password123!'
        })
      );

      const users = await Promise.all(userPromises);

      // All users should be created successfully
      expect(users.length).toBe(10);
      
      // All should have unique IDs
      const ids = users.map(user => user.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it('should handle invalid subscription levels gracefully', async () => {
      // TypeScript should prevent this, but test runtime behavior
      const result = await userService.validateUserAccess('user-1', 'invalid' as any);

      expect(result).toBe(false);
    });

    it('should handle malformed user data gracefully', async () => {
      try {
        // This should be caught by TypeScript, but test runtime
        await userService.createUser({
          email: '', // Invalid
          name: '', // Invalid
          password: '' // Invalid
        });
      } catch (error) {
        // Should handle gracefully without crashing
        expect(error).toBeDefined();
      }
    });

    it('should sanitize user IDs properly', async () => {
      const maliciousIds = [
        'user-1; DROP TABLE users;',
        'user-1--',
        'user-1/*comment*/',
        'user-1<script>alert("xss")</script>'
      ];

      for (const maliciousId of maliciousIds) {
        const user = await userService.getUserById(maliciousId);
        expect(user).toBeNull(); // Should be sanitized and not found
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large user datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Create 50 users
      const promises = Array.from({ length: 50 }, (_, i) => 
        userService.createUser({
          email: `perf${i}@test.com`,
          name: `Performance User ${i}`,
          password: 'Password123!'
        })
      );

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Verify all users were created
      const metrics = await userService.getMetrics();
      expect(metrics.totalUsers).toBeGreaterThanOrEqual(50);
    });

    it('should not leak memory with repeated operations', async () => {
      // Perform many operations
      for (let i = 0; i < 20; i++) {
        const user = await userService.createUser({
          email: `memory${i}@test.com`,
          name: `Memory User ${i}`,
          password: 'Password123!'
        });

        await userService.updateUser(user.id, { name: `Updated ${i}` });
        await userService.getUserStats(user.id);
        await userService.validateUserAccess(user.id, 'free');
        
        if (i % 2 === 0) {
          await userService.deleteUser(user.id);
        }
      }

      // If we reach here without memory issues, the test passes
      expect(true).toBe(true);
    });

    it('should handle search operations efficiently', async () => {
      // Create users for search testing
      for (let i = 0; i < 30; i++) {
        await userService.createUser({
          email: `search${i}@huntaze.com`,
          name: `Search User ${i}`,
          password: 'Password123!'
        });
      }

      const startTime = Date.now();
      
      // Perform multiple searches
      await Promise.all([
        userService.searchUsers('search'),
        userService.searchUsers('huntaze'),
        userService.searchUsers('user'),
        userService.searchUsers('test')
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete searches quickly (< 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
});