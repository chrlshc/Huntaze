/**
 * Database module exports
 * Re-exports pool and query functions from lib/db.ts
 */

// Import all functions from the main db module
import { getPool as dbGetPool, getClient as dbGetClient, query as dbQuery } from '../db';

// Export all functions with consistent naming
export const getPool = dbGetPool;
export const getClient = dbGetClient;
export const query = dbQuery;

// Re-export db as named export for compatibility
export const db = {
  query: dbQuery,
  getPool: dbGetPool,
  getClient: dbGetClient,
};

// Default export for compatibility
export default {
  query: dbQuery,
  getPool: dbGetPool,
  getClient: dbGetClient,
};