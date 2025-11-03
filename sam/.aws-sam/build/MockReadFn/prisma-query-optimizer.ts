/**
 * Prisma Query Optimization Utilities
 * 
 * Best practices for optimizing Prisma queries in Lambda:
 * 1. Select only needed fields
 * 2. Avoid N+1 queries
 * 3. Use indexes
 * 4. Batch operations
 * 5. Use caching (with Accelerate)
 */

import { PrismaClient } from '@prisma/client';

/**
 * Optimized user query - Select only needed fields
 * 
 * ❌ BAD: Fetches all fields + relations
 * const user = await prisma.user.findUnique({
 *   where: { id },
 *   include: { subscriptionRecords: true, sessions: true }
 * });
 * 
 * ✅ GOOD: Select only what you need
 */
export async function getOptimizedUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({
    where: { 
      id: userId,
      deletedAt: null  // Soft delete filter
    },
    select: {
      id: true,
      email: true,
      name: true,
      subscription: true,  // Direct field, no join
      createdAt: true,
      updatedAt: true
      // Don't include relations unless needed
    }
  });
}

/**
 * Optimized user with subscription - Use proper joins
 * 
 * ❌ BAD: N+1 query
 * const user = await prisma.user.findUnique({ where: { id } });
 * const subscription = await prisma.subscriptionRecord.findFirst({ 
 *   where: { userId: user.id } 
 * });
 * 
 * ✅ GOOD: Single query with join
 */
export async function getUserWithSubscription(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({
    where: { 
      id: userId,
      deletedAt: null 
    },
    select: {
      id: true,
      email: true,
      name: true,
      subscription: true,
      subscriptionRecords: {
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1  // Only latest subscription
      }
    }
  });
}

/**
 * Batch operations - Process multiple users efficiently
 * 
 * ❌ BAD: Multiple queries in loop
 * for (const userId of userIds) {
 *   await prisma.user.findUnique({ where: { id: userId } });
 * }
 * 
 * ✅ GOOD: Single batch query
 */
export async function getBatchUsers(prisma: PrismaClient, userIds: string[]) {
  return prisma.user.findMany({
    where: {
      id: { in: userIds },
      deletedAt: null
    },
    select: {
      id: true,
      email: true,
      name: true,
      subscription: true
    }
  });
}

/**
 * Pagination - Efficient cursor-based pagination
 * 
 * ❌ BAD: Offset pagination (slow for large datasets)
 * const users = await prisma.user.findMany({
 *   skip: page * pageSize,
 *   take: pageSize
 * });
 * 
 * ✅ GOOD: Cursor-based pagination
 */
export async function getPaginatedUsers(
  prisma: PrismaClient,
  cursor?: string,
  limit: number = 20
) {
  return prisma.user.findMany({
    take: limit,
    ...(cursor && {
      skip: 1,  // Skip the cursor
      cursor: { id: cursor }
    }),
    where: {
      deletedAt: null
    },
    select: {
      id: true,
      email: true,
      name: true,
      subscription: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Aggregations - Use Prisma aggregations instead of fetching all data
 * 
 * ❌ BAD: Fetch all and count in JS
 * const users = await prisma.user.findMany();
 * const count = users.length;
 * 
 * ✅ GOOD: Use database aggregation
 */
export async function getUserStats(prisma: PrismaClient) {
  const [totalUsers, activeSubscriptions] = await Promise.all([
    prisma.user.count({
      where: { deletedAt: null }
    }),
    prisma.subscriptionRecord.count({
      where: { 
        status: 'active',
        cancelAtPeriodEnd: false
      }
    })
  ]);

  return {
    totalUsers,
    activeSubscriptions,
    conversionRate: totalUsers > 0 
      ? (activeSubscriptions / totalUsers) * 100 
      : 0
  };
}

/**
 * Transactions - Use for atomic operations
 * 
 * ✅ GOOD: Atomic user creation with subscription
 */
export async function createUserWithSubscription(
  prisma: PrismaClient,
  userData: {
    email: string;
    name: string;
    subscription: string;
  },
  subscriptionData: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status: string;
  }
) {
  return prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        subscription: userData.subscription
      }
    });

    // Create subscription record
    const subscription = await tx.subscriptionRecord.create({
      data: {
        userId: user.id,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        status: subscriptionData.status
      }
    });

    return { user, subscription };
  });
}

/**
 * Query performance monitoring
 * 
 * Wrap queries to measure performance
 */
export async function withPerformanceMonitoring<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await query();
    const duration = Date.now() - startTime;
    
    console.log('[QUERY-PERF]', {
      query: queryName,
      duration,
      status: 'success'
    });
    
    // Alert if query is slow
    if (duration > 1000) {
      console.warn('[QUERY-SLOW]', {
        query: queryName,
        duration,
        threshold: 1000
      });
    }
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error('[QUERY-ERROR]', {
      query: queryName,
      duration,
      error: error.message
    });
    
    throw error;
  }
}

/**
 * Example usage with performance monitoring
 */
export async function exampleOptimizedQuery(prisma: PrismaClient, userId: string) {
  return withPerformanceMonitoring(
    'getOptimizedUser',
    () => getOptimizedUser(prisma, userId)
  );
}

/**
 * Index recommendations for schema.prisma
 * 
 * Add these indexes to improve query performance:
 * 
 * model User {
 *   @@index([email])           // For email lookups
 *   @@index([deletedAt])       // For soft delete filtering
 *   @@index([subscription])    // For subscription filtering
 * }
 * 
 * model SubscriptionRecord {
 *   @@index([userId])          // For user lookups
 *   @@index([status])          // For status filtering
 *   @@index([stripeCustomerId]) // For Stripe webhooks
 * }
 * 
 * model Session {
 *   @@index([userId])          // For user sessions
 *   @@index([expires])         // For cleanup queries
 * }
 */

/**
 * Query analysis with EXPLAIN
 * 
 * Use this to analyze slow queries:
 */
export async function analyzeQuery(prisma: PrismaClient, userId: string) {
  // Run EXPLAIN ANALYZE
  const result = await prisma.$queryRaw`
    EXPLAIN ANALYZE
    SELECT id, email, name, subscription
    FROM "User"
    WHERE id = ${userId} AND "deletedAt" IS NULL
  `;
  
  console.log('[QUERY-ANALYSIS]', result);
  return result;
}
