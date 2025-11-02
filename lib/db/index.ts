/**
 * Database module exports
 * Re-exports pool and query functions from lib/db.ts
 */

export { getPool, query, getClient } from '../db';

// Re-export db as named export for compatibility
import { getPool, query as dbQuery } from '../db';
export const db = {
  query: dbQuery,
  getPool,
};
