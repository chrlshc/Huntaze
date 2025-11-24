/**
 * Database Client with Build-time Fallback
 * 
 * Provides a Prisma client that gracefully handles connection failures
 * during build time when the database is not available.
 */

import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;
let connectionAttempted = false;
let connectionError: Error | null = null;

/**
 * Get Prisma client with graceful fallback
 * Returns null if connection fails (e.g., during build)
 */
export function getPrismaClient(): PrismaClient | null {
  // Return cached client if already connected
  if (prismaClient) {
    return prismaClient;
  }

  // Don't retry if we already failed
  if (connectionAttempted && connectionError) {
    console.warn('[Prisma] Using fallback - connection previously failed:', connectionError.message);
    return null;
  }

  // Check if database URL is configured
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('[Prisma] No DATABASE_URL found - using fallback mode');
    connectionAttempted = true;
    return null;
  }

  try {
    // Attempt to create Prisma client
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    console.log('[Prisma] Client initialized successfully');
    connectionAttempted = true;
    return prismaClient;
  } catch (error) {
    connectionError = error as Error;
    connectionAttempted = true;
    console.error('[Prisma] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Check if database is available
 */
export function isDatabaseAvailable(): boolean {
  return getPrismaClient() !== null;
}

/**
 * Safe database operation with fallback
 */
export async function safeDatabaseOperation<T>(
  operation: (client: PrismaClient) => Promise<T>,
  fallback: T
): Promise<T> {
  const client = getPrismaClient();
  
  if (!client) {
    console.warn('[Prisma] Operation skipped - using fallback value');
    return fallback;
  }

  try {
    return await operation(client);
  } catch (error) {
    console.error('[Prisma] Operation failed:', error);
    return fallback;
  }
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
    connectionAttempted = false;
  }
}
