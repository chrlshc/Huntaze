/**
 * Database module exports
 * Re-exports pool and query functions from lib/db.ts
 */

export { getPool, query, getClient } from '../db';

// Re-export db as named export for compatibility
import { getPool } from '../db';
export const db = {
  query: async (text: string, params?: any[]) => {
    const pool = getPool();
    return pool.query(text, params);
  },
  getPool,
};
