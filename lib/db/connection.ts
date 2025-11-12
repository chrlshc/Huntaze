/**
 * Database Connection
 * 
 * Simple database connection wrapper for PostgreSQL.
 * In production, this would use a proper connection pool.
 */

import { Pool } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Export database interface
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
};

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default db;
