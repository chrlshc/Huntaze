/**
 * Prisma Configuration - Production Ready 2025
 * 
 * Features:
 * - Prisma Accelerate (OBLIGATOIRE pour serverless)
 * - Connection pooling
 * - Query optimization
 * - Connection burst testing
 */

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// OBLIGATOIRE pour serverless
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL, // Prisma Accelerate URL
      },
    },
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test de connexion burst (should be < 1s)
export async function testConnectionBurst() {
  const start = Date.now();
  const promises = Array(10).fill(null).map(() => 
    prisma.user.findFirst({ where: { id: 'test' } })
  );
  
  await Promise.all(promises);
  const duration = Date.now() - start;
  
  console.log(`Connection burst test: ${duration}ms`);
  return duration < 1000; // Should be under 1s
}

// Health check
export async function healthCheckDB(): Promise<{ status: 'ok' | 'error'; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      status: 'ok',
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Graceful shutdown
export async function disconnectDB() {
  await prisma.$disconnect();
}

// Query optimization helpers
export const queryOptimizations = {
  // Use Prisma Accelerate cache
  withCache: (ttl: number = 60) => ({
    cacheStrategy: { ttl },
  }),
  
  // Pagination helper
  paginate: (page: number = 1, pageSize: number = 20) => ({
    skip: (page - 1) * pageSize,
    take: pageSize,
  }),
  
  // Select only needed fields
  selectFields: <T extends Record<string, boolean>>(fields: T) => ({
    select: fields,
  }),
};

// Example usage:
// const users = await prisma.user.findMany({
//   ...queryOptimizations.paginate(1, 20),
//   ...queryOptimizations.withCache(60),
//   ...queryOptimizations.selectFields({ id: true, email: true }),
// });
