/**
 * Database module exports
 * Re-exports pool and query functions from lib/db.ts
 */

export { getPool, getClient } from '../db';

// Export query function explicitly
import { query as dbQuery } from '../db';
export const query = dbQuery;

// Re-export db as named export for compatibility
import { getPool } from '../db';
export const db = {
  query: dbQuery,
  getPool,
};
