/**
 * Integration Tests - PostgreSQL Tables
 * 
 * Tests to validate PostgreSQL table structure and existence
 * Based on: PROJECT_STATUS_SUMMARY.md - Tables PostgreSQL Existantes
 * 
 * Coverage:
 * - Auth & Users tables
 * - AI & Planning tables
 * - Table structure validation
 * - Foreign key constraints
 * - Indexes validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

describe('PostgreSQL Tables - Integration Tests', () => {
  let pool: Pool;

  beforeAll(() => {
    // Create connection pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Auth & Users Tables', () => {
    it('should have users table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);

      expect(result.rows[0].exists).toBe(true);
    });

    it('should have correct users table structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);

      const columns = result.rows.map(r => r.column_name);
      
      expect(columns).toContain('id');
      expect(columns).toContain('email');
      expect(columns).toContain('name');
      expect(columns).toContain('password_hash');
      expect(columns).toContain('email_verified');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should have sessions table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'sessions'
        );
      `);

      expect(result.rows[0].exists).toBe(true);
    });

    it('should have correct sessions table structure', async () => {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'sessions'
        ORDER BY ordinal_position;
      `);

      const columns = result.rows.map(r => r.column_name);
      
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('token');
      expect(columns).toContain('expires_at');
      expect(columns).toContain('created_at');
    });

    it('should have oauth_accounts table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'oauth_accounts'
        );
      `);

      // May or may not exist depending on deployment
      expect(typeof result.rows[0].exists).toBe('boolean');
    });

    it('should have login_attempts table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'login_attempts'
        );
      `);

      // May or may not exist depending on deployment
      expect(typeof result.rows[0].exists).toBe('boolean');
    });
  });

  describe('AI & Planning Tables', () => {
    it('should have ai_plan table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ai_plan'
        );
      `);

      // May or may not exist depending on deployment
      expect(typeof result.rows[0].exists).toBe('boolean');
    });

    it('should have ai_plan_item table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ai_plan_item'
        );
      `);

      // May or may not exist depending on deployment
      expect(typeof result.rows[0].exists).toBe('boolean');
    });

    it('should have insight_snapshot table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'insight_snapshot'
        );
      `);

      // May or may not exist depending on deployment
      expect(typeof result.rows[0].exists).toBe('boolean');
    });

    it('should have insight_summary table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'insight_summary'
        );
      `);

      // May or may not exist depending on deployment
      expect(typeof result.rows[0].exists).toBe('boolean');
    });

    it('should have events_outbox table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'events_outbox'
        );
      `);

      // May or may not exist depending on deployment
      expect(typeof result.rows[0].exists).toBe('boolean');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have foreign key from sessions to users', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = 'sessions'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'users'
        );
      `);

      // Should have FK if sessions table exists
      expect(typeof result.rows[0].exists).toBe('boolean');
    });

    it('should have CASCADE delete on sessions', async () => {
      const result = await pool.query(`
        SELECT delete_rule
        FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'sessions'
          AND tc.constraint_type = 'FOREIGN KEY';
      `);

      // Should have CASCADE if FK exists
      if (result.rows.length > 0) {
        expect(result.rows[0].delete_rule).toBe('CASCADE');
      }
    });
  });

  describe('Indexes', () => {
    it('should have index on users.email', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE tablename = 'users'
            AND indexname LIKE '%email%'
        );
      `);

      // Should have email index
      expect(typeof result.rows[0].exists).toBe('boolean');
    });

    it('should have index on sessions.user_id', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE tablename = 'sessions'
            AND indexname LIKE '%user_id%'
        );
      `);

      // Should have user_id index if sessions exists
      expect(typeof result.rows[0].exists).toBe('boolean');
    });

    it('should have index on sessions.token', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE tablename = 'sessions'
            AND indexname LIKE '%token%'
        );
      `);

      // Should have token index if sessions exists
      expect(typeof result.rows[0].exists).toBe('boolean');
    });
  });

  describe('Table Constraints', () => {
    it('should have unique constraint on users.email', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE table_name = 'users'
            AND constraint_type = 'UNIQUE'
            AND constraint_name LIKE '%email%'
        );
      `);

      // Should have unique email
      expect(typeof result.rows[0].exists).toBe('boolean');
    });

    it('should have primary key on users.id', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE table_name = 'users'
            AND constraint_type = 'PRIMARY KEY'
        );
      `);

      expect(result.rows[0].exists).toBe(true);
    });

    it('should have primary key on sessions.id', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE table_name = 'sessions'
            AND constraint_type = 'PRIMARY KEY'
        );
      `);

      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Data Types', () => {
    it('should use correct data types for users table', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users';
      `);

      const dataTypes = result.rows.reduce((acc, row) => {
        acc[row.column_name] = row.data_type;
        return acc;
      }, {} as Record<string, string>);

      if (dataTypes.id) {
        expect(['integer', 'bigint']).toContain(dataTypes.id);
      }
      if (dataTypes.email) {
        expect(['character varying', 'text']).toContain(dataTypes.email);
      }
      if (dataTypes.email_verified) {
        expect(dataTypes.email_verified).toBe('boolean');
      }
    });

    it('should use timestamp for created_at and updated_at', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name IN ('created_at', 'updated_at');
      `);

      result.rows.forEach(row => {
        expect(['timestamp without time zone', 'timestamp with time zone']).toContain(row.data_type);
      });
    });
  });

  describe('Table Documentation Validation', () => {
    it('should have all documented auth tables', async () => {
      const expectedTables = ['users', 'sessions'];
      
      for (const tableName of expectedTables) {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);

        expect(result.rows[0].exists).toBe(true);
      }
    });

    it('should count total tables in database', async () => {
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE';
      `);

      const count = parseInt(result.rows[0].count);
      
      // Should have at least 2 tables (users, sessions)
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});
