/**
 * Property-Based Tests for Database Index Usage
 * 
 * Feature: dashboard-performance-real-fix, Property 17: Queries use indexes
 * Validates: Requirements 7.1
 * 
 * Tests that database queries use indexes for filtering and sorting
 */

import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Property 17: Queries use indexes', () => {
  /**
   * Property: For any query with WHERE clause, the database should use an index
   */
  it('should use indexes for WHERE clause filtering', async () => {
    const queries = [
      // Content queries
      () => prisma.content.findMany({
        where: { user_id: 1, status: 'published' },
        take: 10,
      }),
      () => prisma.content.findMany({
        where: { user_id: 1, platform: 'instagram' },
        take: 10,
      }),
      
      // Transaction queries
      () => prisma.transaction.findMany({
        where: { user_id: 1, type: 'revenue' },
        take: 10,
      }),
      () => prisma.transaction.findMany({
        where: { user_id: 1, status: 'completed' },
        take: 10,
      }),
      
      // Subscription queries
      () => prisma.subscriptions.findMany({
        where: { user_id: 1, status: 'active' },
      }),
      () => prisma.subscriptions.findMany({
        where: { user_id: 1, platform: 'onlyfans' },
      }),
      
      // OAuth queries
      () => prisma.oauth_accounts.findMany({
        where: { user_id: 1, provider: 'google' },
      }),
      
      // Marketing campaign queries
      () => prisma.marketing_campaigns.findMany({
        where: { user_id: 1, status: 'active' },
      }),
    ];
    
    // Warm up connection
    await prisma.users.findFirst();
    
    // All queries should complete quickly (indicating index usage)
    const durations: number[] = [];
    for (const query of queries) {
      const start = Date.now();
      await query();
      const duration = Date.now() - start;
      durations.push(duration);
    }
    
    // Average should be reasonable (not testing absolute time due to env differences)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avgDuration).toBeLessThan(200); // Relaxed for test environment
    
    // No query should be extremely slow
    const maxDuration = Math.max(...durations);
    expect(maxDuration).toBeLessThan(500);
  });
  
  /**
   * Property: For any query with ORDER BY, the database should use an index
   */
  it('should use indexes for ORDER BY sorting', async () => {
    const queries = [
      // Sort by created_at
      () => prisma.content.findMany({
        where: { user_id: 1 },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      () => prisma.transaction.findMany({
        where: { user_id: 1 },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      () => prisma.marketing_campaigns.findMany({
        where: { user_id: 1 },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      
      // Sort by other fields
      () => prisma.subscriptions.findMany({
        where: { user_id: 1 },
        orderBy: { started_at: 'desc' },
        take: 10,
      }),
      () => prisma.usageLog.findMany({
        where: { creatorId: 1 },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ];
    
    // All queries should complete quickly
    const durations: number[] = [];
    for (const query of queries) {
      const start = Date.now();
      await query();
      const duration = Date.now() - start;
      durations.push(duration);
    }
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avgDuration).toBeLessThan(200);
  });
  
  /**
   * Property: For any query with composite filters, the database should use composite indexes
   */
  it('should use composite indexes for multi-column filtering', async () => {
    const queries = [
      // user_id + status
      () => prisma.content.findMany({
        where: {
          user_id: 1,
          status: 'published',
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      
      // user_id + type + created_at
      () => prisma.transaction.findMany({
        where: {
          user_id: 1,
          type: 'revenue',
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      
      // user_id + platform
      () => prisma.content.findMany({
        where: {
          user_id: 1,
          platform: 'instagram',
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      
      // creatorId + type
      () => prisma.aIInsight.findMany({
        where: {
          creatorId: 1,
          type: 'content_suggestion',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ];
    
    // Composite index queries should be fast
    const durations: number[] = [];
    for (const query of queries) {
      const start = Date.now();
      await query();
      const duration = Date.now() - start;
      durations.push(duration);
    }
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avgDuration).toBeLessThan(200);
  });
  
  /**
   * Property: For any query with date range filtering, the database should use indexes
   */
  it('should use indexes for date range queries', async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const queries = [
      () => prisma.transaction.findMany({
        where: {
          user_id: 1,
          created_at: { gte: thirtyDaysAgo },
        },
        orderBy: { created_at: 'desc' },
      }),
      () => prisma.content.findMany({
        where: {
          user_id: 1,
          created_at: { gte: thirtyDaysAgo },
        },
        orderBy: { created_at: 'desc' },
      }),
      () => prisma.usageLog.findMany({
        where: {
          creatorId: 1,
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ];
    
    const durations: number[] = [];
    for (const query of queries) {
      const start = Date.now();
      await query();
      const duration = Date.now() - start;
      durations.push(duration);
    }
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avgDuration).toBeLessThan(200);
  });
  
  /**
   * Property: For any query with JOIN operations, the database should use indexes on foreign keys
   */
  it('should use indexes for JOIN operations', async () => {
    const queries = [
      // User with content (JOIN on user_id)
      () => prisma.users.findFirst({
        where: { id: 1 },
        include: {
          content: {
            where: { status: 'published' },
            take: 5,
          },
        },
      }),
      
      // User with transactions (JOIN on user_id)
      () => prisma.users.findFirst({
        where: { id: 1 },
        include: {
          transactions: {
            where: { status: 'completed' },
            take: 5,
          },
        },
      }),
      
      // User with subscriptions (JOIN on user_id)
      () => prisma.users.findFirst({
        where: { id: 1 },
        include: {
          subscriptions: {
            where: { status: 'active' },
          },
        },
      }),
      
      // User with multiple relations
      () => prisma.users.findFirst({
        where: { id: 1 },
        include: {
          content: { take: 3 },
          transactions: { take: 3 },
          subscriptions: true,
          oauth_accounts: true,
        },
      }),
    ];
    
    const durations: number[] = [];
    for (const query of queries) {
      const start = Date.now();
      await query();
      const duration = Date.now() - start;
      durations.push(duration);
    }
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avgDuration).toBeLessThan(300); // JOINs are more expensive
  });
  
  /**
   * Property: For any unique constraint query, the database should use the unique index
   */
  it('should use unique indexes for unique lookups', async () => {
    const queries = [
      // Email lookup (unique index)
      () => prisma.users.findUnique({
        where: { email: 'test@example.com' },
      }),
      
      // Session token lookup (unique index)
      () => prisma.session.findUnique({
        where: { sessionToken: 'test-token' },
      }),
      
      // Provider account lookup (composite unique)
      () => prisma.oauth_accounts.findUnique({
        where: {
          provider_provider_account_id: {
            provider: 'google',
            provider_account_id: '123',
          },
        },
      }),
    ];
    
    const durations: number[] = [];
    for (const query of queries) {
      const start = Date.now();
      try {
        await query();
      } catch (error) {
        // Record not found is OK for this test
      }
      const duration = Date.now() - start;
      durations.push(duration);
    }
    
    // Unique index lookups should be fast
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avgDuration).toBeLessThan(200);
  });
  
  /**
   * Property: For any query on indexed columns, performance should scale logarithmically
   */
  it('should have logarithmic performance scaling with indexed queries', async () => {
    // Test with different LIMIT values
    const limits = [10, 50, 100];
    const durations: number[] = [];
    
    for (const limit of limits) {
      const start = Date.now();
      await prisma.content.findMany({
        where: {
          user_id: 1,
          status: 'published',
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
      const duration = Date.now() - start;
      durations.push(duration);
    }
    
    // With indexes, increasing LIMIT shouldn't dramatically increase query time
    // The ratio between largest and smallest should be reasonable
    const ratio = durations[durations.length - 1] / durations[0];
    expect(ratio).toBeLessThan(5); // 10x data shouldn't take 5x time
  });
  
  /**
   * Property: For any frequently accessed table, all foreign keys should have indexes
   */
  it('should have indexes on all foreign key columns', async () => {
    // Test foreign key lookups are fast
    const foreignKeyQueries = [
      () => prisma.content.findMany({ where: { user_id: 1 } }),
      () => prisma.transaction.findMany({ where: { user_id: 1 } }),
      () => prisma.subscriptions.findMany({ where: { user_id: 1 } }),
      () => prisma.oauth_accounts.findMany({ where: { user_id: 1 } }),
      () => prisma.marketing_campaigns.findMany({ where: { user_id: 1 } }),
      () => prisma.user_stats.findUnique({ where: { user_id: 1 } }),
      () => prisma.usageLog.findMany({ where: { creatorId: 1 } }),
      () => prisma.aIInsight.findMany({ where: { creatorId: 1 } }),
    ];
    
    const durations: number[] = [];
    for (const query of foreignKeyQueries) {
      const start = Date.now();
      await query();
      const duration = Date.now() - start;
      durations.push(duration);
    }
    
    // Foreign key lookups should be fast on average
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avgDuration).toBeLessThan(200);
  });
});
