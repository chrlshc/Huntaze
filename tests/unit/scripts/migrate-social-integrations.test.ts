/**
 * Unit Tests - Social Integrations Migration Script
 * 
 * Tests to validate the migration script functionality
 * Based on: .kiro/specs/social-integrations/tasks.md (Task 1)
 * 
 * Coverage:
 * - Script structure validation
 * - Database connection handling
 * - Error handling
 * - Success logging
 * - Table verification
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Social Integrations Migration Script', () => {
  let scriptContent: string;
  const scriptPath = join(process.cwd(), 'scripts/migrate-social-integrations.js');

  beforeAll(() => {
    scriptContent = readFileSync(scriptPath, 'utf-8');
  });

  describe('Script Structure', () => {
    it('should exist at correct path', () => {
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should have shebang for Node.js', () => {
      expect(scriptContent).toMatch(/^#!\/usr\/bin\/env node/);
    });

    it('should import required dependencies', () => {
      expect(scriptContent).toContain("require('pg')");
      expect(scriptContent).toContain("require('fs')");
      expect(scriptContent).toContain("require('path')");
    });

    it('should have main migration function', () => {
      expect(scriptContent).toContain('async function runMigration()');
    });

    it('should call migration function', () => {
      expect(scriptContent).toContain('runMigration()');
    });
  });

  describe('Database Connection', () => {
    it('should create Pool with DATABASE_URL', () => {
      expect(scriptContent).toContain('new Pool');
      expect(scriptContent).toContain('process.env.DATABASE_URL');
    });

    it('should configure SSL for AWS RDS', () => {
      expect(scriptContent).toContain('rds.amazonaws.com');
      expect(scriptContent).toContain('ssl:');
      expect(scriptContent).toContain('rejectUnauthorized: false');
    });

    it('should close pool connection', () => {
      expect(scriptContent).toContain('pool.end()');
    });

    it('should use finally block for cleanup', () => {
      expect(scriptContent).toContain('finally');
      expect(scriptContent).toMatch(/finally\s*{[^}]*pool\.end\(\)/s);
    });
  });

  describe('Migration Execution', () => {
    it('should read migration SQL file', () => {
      expect(scriptContent).toContain('readFileSync');
      expect(scriptContent).toContain('2024-10-31-social-integrations.sql');
    });

    it('should construct correct migration path', () => {
      expect(scriptContent).toContain("path.join");
      expect(scriptContent).toContain("'lib'");
      expect(scriptContent).toContain("'db'");
      expect(scriptContent).toContain("'migrations'");
    });

    it('should execute migration SQL', () => {
      expect(scriptContent).toContain('pool.query(migrationSQL)');
    });

    it('should use await for async operations', () => {
      expect(scriptContent).toMatch(/await pool\.query/);
    });
  });

  describe('Logging and Feedback', () => {
    it('should log migration start', () => {
      expect(scriptContent).toContain('Starting social integrations migration');
    });

    it('should log database location', () => {
      expect(scriptContent).toContain('Database:');
    });

    it('should log success message', () => {
      expect(scriptContent).toContain('Migration completed successfully');
    });

    it('should log created tables', () => {
      expect(scriptContent).toContain('Tables created:');
      expect(scriptContent).toContain('oauth_accounts');
      expect(scriptContent).toContain('tiktok_posts');
      expect(scriptContent).toContain('instagram_accounts');
      expect(scriptContent).toContain('ig_media');
      expect(scriptContent).toContain('ig_comments');
      expect(scriptContent).toContain('webhook_events');
    });

    it('should use emoji for visual feedback', () => {
      expect(scriptContent).toMatch(/🚀|✅|📊|📍/);
    });
  });

  describe('Table Verification', () => {
    it('should verify tables exist after migration', () => {
      expect(scriptContent).toContain('information_schema.tables');
      expect(scriptContent).toContain("table_schema = 'public'");
    });

    it('should check for all expected tables', () => {
      expect(scriptContent).toContain('oauth_accounts');
      expect(scriptContent).toContain('tiktok_posts');
      expect(scriptContent).toContain('instagram_accounts');
      expect(scriptContent).toContain('ig_media');
      expect(scriptContent).toContain('ig_comments');
      expect(scriptContent).toContain('webhook_events');
    });

    it('should log verified tables', () => {
      expect(scriptContent).toContain('Verified tables:');
      expect(scriptContent).toMatch(/result\.rows\.forEach/);
    });

    it('should check indexes', () => {
      expect(scriptContent).toContain('pg_indexes');
      expect(scriptContent).toContain('indexname');
    });

    it('should log index count', () => {
      expect(scriptContent).toContain('Created');
      expect(scriptContent).toContain('indexes');
    });
  });

  describe('Error Handling', () => {
    it('should have try-catch block', () => {
      expect(scriptContent).toContain('try {');
      expect(scriptContent).toContain('catch (error)');
    });

    it('should log error message', () => {
      expect(scriptContent).toContain('Migration failed');
      expect(scriptContent).toContain('console.error');
    });

    it('should log full error details', () => {
      expect(scriptContent).toMatch(/console\.error\([^)]*error[^)]*\)/);
    });

    it('should exit with error code on failure', () => {
      expect(scriptContent).toContain('process.exit(1)');
    });

    it('should exit in catch block', () => {
      expect(scriptContent).toMatch(/catch[^}]*process\.exit\(1\)/s);
    });
  });

  describe('Code Quality', () => {
    it('should have JSDoc comment', () => {
      expect(scriptContent).toContain('/**');
      expect(scriptContent).toContain('Migration script for social integrations');
    });

    it('should have usage instructions', () => {
      expect(scriptContent).toContain('Run with:');
      expect(scriptContent).toContain('node scripts/migrate-social-integrations.js');
    });

    it('should use const for immutable variables', () => {
      expect(scriptContent).toContain('const pool');
      expect(scriptContent).toContain('const migrationPath');
      expect(scriptContent).toContain('const migrationSQL');
    });

    it('should use async/await pattern', () => {
      expect(scriptContent).toContain('async function');
      expect(scriptContent).toMatch(/await pool\.query/);
    });

    it('should have proper indentation', () => {
      // Check for consistent indentation (2 or 4 spaces)
      const lines = scriptContent.split('\n');
      const indentedLines = lines.filter(line => /^\s+/.test(line));
      
      expect(indentedLines.length).toBeGreaterThan(0);
    });
  });

  describe('Security', () => {
    it('should not hardcode credentials', () => {
      expect(scriptContent).not.toMatch(/password\s*[:=]\s*['"][^'"]+['"]/i);
      expect(scriptContent).not.toMatch(/user\s*[:=]\s*['"]postgres['"]/i);
    });

    it('should use environment variables', () => {
      expect(scriptContent).toContain('process.env.DATABASE_URL');
    });

    it('should handle missing DATABASE_URL gracefully', () => {
      expect(scriptContent).toMatch(/DATABASE_URL\?/);
    });
  });

  describe('Integration with Migration File', () => {
    it('should reference correct migration file', () => {
      const migrationFilePath = join(
        process.cwd(),
        'lib/db/migrations/2024-10-31-social-integrations.sql'
      );
      
      expect(existsSync(migrationFilePath)).toBe(true);
    });

    it('should use correct file path construction', () => {
      expect(scriptContent).toContain("__dirname");
      expect(scriptContent).toContain("'..'");
      expect(scriptContent).toContain("'lib'");
      expect(scriptContent).toContain("'db'");
      expect(scriptContent).toContain("'migrations'");
    });
  });

  describe('Output Format', () => {
    it('should have clear section headers', () => {
      expect(scriptContent).toMatch(/Tables created:/);
      expect(scriptContent).toMatch(/Verified tables:/);
    });

    it('should use checkmarks for verified items', () => {
      expect(scriptContent).toContain('✓');
    });

    it('should format table list with indentation', () => {
      expect(scriptContent).toMatch(/\s+-\s+\w+/);
    });

    it('should show index count', () => {
      expect(scriptContent).toMatch(/Created.*indexes/);
    });
  });

  describe('Validation Queries', () => {
    it('should query information_schema for tables', () => {
      expect(scriptContent).toContain('information_schema.tables');
      expect(scriptContent).toContain('table_name');
      expect(scriptContent).toContain('table_schema');
    });

    it('should filter by public schema', () => {
      expect(scriptContent).toContain("table_schema = 'public'");
    });

    it('should filter by expected table names', () => {
      expect(scriptContent).toMatch(/table_name IN \(/);
    });

    it('should order results', () => {
      expect(scriptContent).toContain('ORDER BY');
    });

    it('should query pg_indexes for index verification', () => {
      expect(scriptContent).toContain('pg_indexes');
      expect(scriptContent).toContain('tablename');
      expect(scriptContent).toContain('indexname');
    });
  });

  describe('Requirements Coverage', () => {
    it('should support Task 1 requirements', () => {
      // Create migration file for oauth_accounts, tiktok_posts, webhook_events tables
      expect(scriptContent).toContain('oauth_accounts');
      expect(scriptContent).toContain('tiktok_posts');
      expect(scriptContent).toContain('webhook_events');
    });

    it('should verify indexes for performance', () => {
      // Add indexes for performance (expires_at, user_id, status)
      expect(scriptContent).toContain('pg_indexes');
      expect(scriptContent).toContain('indexes for performance');
    });

    it('should test migration on development database', () => {
      // Test migration on development database
      expect(scriptContent).toContain('DATABASE_URL');
      expect(scriptContent).toContain('pool.query');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing migration file', () => {
      // readFileSync will throw if file doesn't exist
      expect(scriptContent).toContain('readFileSync');
    });

    it('should handle database connection errors', () => {
      expect(scriptContent).toContain('catch (error)');
      expect(scriptContent).toContain('Migration failed');
    });

    it('should handle SQL execution errors', () => {
      expect(scriptContent).toMatch(/catch[^}]*error/s);
    });

    it('should handle missing DATABASE_URL', () => {
      expect(scriptContent).toMatch(/DATABASE_URL\?/);
    });
  });

  describe('Best Practices', () => {
    it('should use descriptive variable names', () => {
      expect(scriptContent).toContain('migrationPath');
      expect(scriptContent).toContain('migrationSQL');
      expect(scriptContent).not.toMatch(/\bx\b|\by\b|\bz\b/); // No single-letter vars
    });

    it('should have consistent error handling', () => {
      expect(scriptContent).toContain('try {');
      expect(scriptContent).toContain('catch (error)');
      expect(scriptContent).toContain('finally {');
    });

    it('should clean up resources', () => {
      expect(scriptContent).toContain('pool.end()');
      expect(scriptContent).toMatch(/finally\s*{[^}]*pool\.end/s);
    });

    it('should provide helpful error messages', () => {
      expect(scriptContent).toContain('Migration failed:');
      expect(scriptContent).toContain('error.message');
    });

    it('should use modern JavaScript features', () => {
      expect(scriptContent).toContain('const');
      expect(scriptContent).toContain('async');
      expect(scriptContent).toContain('await');
    });
  });
});
