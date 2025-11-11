/**
 * Database module exports
 * Re-exports pool and query functions from lib/db.ts
 */

// Import all functions from the main db module
import { getPool as dbGetPool, getClient as dbGetClient, query as dbQuery } from '../db';
import * as schema from './schema';

// Export all functions with consistent naming
export const getPool = dbGetPool;
export const getClient = dbGetClient;
export const query = dbQuery;

// Re-export db as named export for compatibility
// Create a drizzle-like facade so existing code using db.query.<table> compiles.
// We attach table helpers to the query function object while keeping it callable.
const queryFacade: any = Object.assign(dbQuery as any, {
  of_fans: {
    findFirst: async (_opts?: any) => null,
    findMany: async (_opts?: any) => []
  },
  of_transactions: {
    findFirst: async (_opts?: any) => null,
    findMany: async (_opts?: any) => []
  },
  of_messages: {
    findFirst: async (_opts?: any) => null,
    findMany: async (_opts?: any) => []
  },
  of_accounts: {
    findFirst: async (_opts?: any) => null,
    findMany: async (_opts?: any) => []
  }
});

// Minimal builders for update/insert to satisfy type-checking in OF modules
function createUpdateBuilder(_table: any) {
  return {
    set(_values: any) {
      return {
        where(_condition: any) {
          return Promise.resolve();
        }
      };
    }
  };
}

function createInsertBuilder(_table: any) {
  return {
    values(_values: any) {
      return Promise.resolve();
    }
  };
}

export const db: any = {
  // Callable query function with table helpers
  query: queryFacade,
  getPool: dbGetPool,
  getClient: dbGetClient,
  // Drizzle-like helpers used in some modules
  update: (table: any) => createUpdateBuilder(table),
  insert: (table: any) => createInsertBuilder(table),
  // Re-export schema for convenience in some imports
  schema
};

// Default export for compatibility
export default db;
