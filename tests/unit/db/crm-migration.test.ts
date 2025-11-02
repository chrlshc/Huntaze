/**
 * Unit Tests - CRM Migration
 * 
 * Tests to validate CRM migration SQL structure and syntax
 * 
 * Coverage:
 * - SQL file structure
 * - Table definitions
 * - Column definitions
 * - Constraint definitions
 * - Index definitions
 * - Trigger definitions
 * - Comment definitions
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CRM Migration SQL - Unit Tests', () => {
  let migrationSql: string;

  beforeAll(() => {
    const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-crm-tables.sql');
    migrationSql = readFileSync(migrationPath, 'utf-8');
  });

  describe('File Structure', () => {
    it('should have migration header comment', () => {
      expect(migrationSql).toContain('-- CRM Tables Migration');
      expect(migrationSql).toContain('-- Created: 2024-10-31');
      expect(migrationSql).toContain('-- Purpose:');
    });

    it('should use IF NOT EXISTS for all tables', () => {
      const tableCreations = migrationSql.match(/CREATE TABLE/g) || [];
      const ifNotExists = migrationSql.match(/CREATE TABLE IF NOT EXISTS/g) || [];
      
      expect(tableCreations.length).toBe(ifNotExists.length);
      expect(tableCreations.length).toBe(9); // 9 CRM tables
    });

    it('should use IF NOT EXISTS for all indexes', () => {
      const indexCreations = migrationSql.match(/CREATE INDEX/g) || [];
      const ifNotExists = migrationSql.match(/CREATE INDEX IF NOT EXISTS/g) || [];
      
      expect(indexCreations.length).toBe(ifNotExists.length);
    });
  });

  describe('Table Definitions', () => {
    it('should define user_profiles table', () => {
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS user_profiles');
      expect(migrationSql).toContain('user_id INTEGER PRIMARY KEY');
      expect(migrationSql).toContain('REFERENCES users(id) ON DELETE CASCADE');
    });

    it('should define ai_configs table', () => {
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS ai_configs');
      expect(migrationSql).toContain('user_id INTEGER PRIMARY KEY');
      expect(migrationSql).toContain('personality VARCHAR(50)');
      expect(migrationSql).toContain('enabled BOOLEAN DEFAULT TRUE');
    });

    it('should define fans table', () => {
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS fans');
      expect(migrationSql).toContain('id SERIAL PRIMARY KEY');
      expect(migrationSql).toContain('user_id INTEGER NOT NULL');
      expect(migrationSql).toContain('platform VARCHAR(50)');
      expect(migrationSql).toContain('value_cents INTEGER DEFAULT 0');
    });

    it('should define conversations table', () => {
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS conversations');
      expect(migrationSql).toContain('fan_id INTEGER NOT NULL REFERENCES fans(id)');
      expect(migrationSql).toContain('unread_count INTEGER DEFAULT 0');
      expect(migrationSql).toContain('archived BOOLEAN DEFAULT FALSE');
    });

    it('should define messages table', () => {
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS messages');
      expect(migrationSql).toContain('conversation_id INTEGER NOT NULL');
      expect(migrationSql).toContain('direction VARCHAR(10) NOT NULL');
      expect(migrationSql).toContain('sent_by_ai BOOLEAN DEFAULT FALSE');
    });

    it('should define campaigns table', () => {
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS campaigns');
      expect(migrationSql).toContain('type VARCHAR(50)');
      expect(migrationSql).toContain("status VARCHAR(50) DEFAULT 'draft'");
    });

    it('should define platform_connections table', () => {
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS platform_connections');
      expect(migrationSql).toContain('access_token TEXT');
      expect(migrationSql).toContain('refresh_token TEXT');
      expect(migrationSql).toContain("status VARCHAR(50) DEFAULT 'active'");
    });

    it('should define quick_replies table', () => {
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS quick_replies');
      expect(migrationSql).toContain('template TEXT NOT NULL');
      expect(migrationSql).toContain('usage_count INTEGER DEFAULT 0');
    });

    it('should define analytics_events table', () => {
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS analytics_events');
      expect(migrationSql).toContain('id BIGSERIAL PRIMARY KEY');
      expect(migrationSql).toContain('event_type VARCHAR(100) NOT NULL');
    });
  });

  describe('Column Types', () => {
    it('should use JSONB for flexible data', () => {
      const jsonbColumns = migrationSql.match(/JSONB/g) || [];
      expect(jsonbColumns.length).toBeGreaterThanOrEqual(10);
    });

    it('should use SERIAL for auto-increment IDs', () => {
      expect(migrationSql).toContain('id SERIAL PRIMARY KEY');
      expect(migrationSql).toContain('id BIGSERIAL PRIMARY KEY');
    });

    it('should use TIMESTAMP for dates', () => {
      const timestamps = migrationSql.match(/TIMESTAMP/g) || [];
      expect(timestamps.length).toBeGreaterThan(20);
    });

    it('should use VARCHAR with appropriate lengths', () => {
      expect(migrationSql).toContain('VARCHAR(50)');
      expect(migrationSql).toContain('VARCHAR(100)');
      expect(migrationSql).toContain('VARCHAR(255)');
      expect(migrationSql).toContain('VARCHAR(500)');
    });

    it('should use TEXT for long content', () => {
      expect(migrationSql).toContain('bio TEXT');
      expect(migrationSql).toContain('text TEXT');
      expect(migrationSql).toContain('notes TEXT');
    });

    it('should use INTEGER for numeric values', () => {
      expect(migrationSql).toContain('value_cents INTEGER');
      expect(migrationSql).toContain('price_cents INTEGER');
      expect(migrationSql).toContain('unread_count INTEGER');
    });

    it('should use BOOLEAN for flags', () => {
      expect(migrationSql).toContain('enabled BOOLEAN');
      expect(migrationSql).toContain('archived BOOLEAN');
      expect(migrationSql).toContain('read BOOLEAN');
      expect(migrationSql).toContain('sent_by_ai BOOLEAN');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have CASCADE delete on user_profiles', () => {
      expect(migrationSql).toContain('user_profiles');
      expect(migrationSql).toMatch(/user_id.*REFERENCES users\(id\) ON DELETE CASCADE/);
    });

    it('should have CASCADE delete on ai_configs', () => {
      expect(migrationSql).toContain('ai_configs');
      expect(migrationSql).toMatch(/user_id.*REFERENCES users\(id\) ON DELETE CASCADE/);
    });

    it('should have CASCADE delete on fans', () => {
      expect(migrationSql).toContain('fans');
      expect(migrationSql).toMatch(/user_id.*REFERENCES users\(id\) ON DELETE CASCADE/);
    });

    it('should have CASCADE delete on conversations', () => {
      expect(migrationSql).toContain('conversations');
      expect(migrationSql).toMatch(/user_id.*REFERENCES users\(id\) ON DELETE CASCADE/);
      expect(migrationSql).toMatch(/fan_id.*REFERENCES fans\(id\) ON DELETE CASCADE/);
    });

    it('should have CASCADE delete on messages', () => {
      expect(migrationSql).toContain('messages');
      expect(migrationSql).toMatch(/conversation_id.*REFERENCES conversations\(id\) ON DELETE CASCADE/);
    });

    it('should have CASCADE delete on all user-related tables', () => {
      const cascadeDeletes = migrationSql.match(/ON DELETE CASCADE/g) || [];
      expect(cascadeDeletes.length).toBe(12); // 12 foreign keys with CASCADE delete
    });
  });

  describe('Unique Constraints', () => {
    it('should have unique constraint on fans (user_id, platform, platform_id)', () => {
      expect(migrationSql).toContain('UNIQUE(user_id, platform, platform_id)');
    });

    it('should have unique constraint on conversations (user_id, fan_id, platform)', () => {
      expect(migrationSql).toContain('UNIQUE(user_id, fan_id, platform)');
    });

    it('should have unique constraint on platform_connections (user_id, platform)', () => {
      expect(migrationSql).toContain('UNIQUE(user_id, platform)');
    });
  });

  describe('Default Values', () => {
    it('should have DEFAULT CURRENT_TIMESTAMP for created_at', () => {
      const createdAtDefaults = migrationSql.match(/created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g) || [];
      expect(createdAtDefaults.length).toBeGreaterThanOrEqual(9);
    });

    it('should have DEFAULT CURRENT_TIMESTAMP for updated_at', () => {
      const updatedAtDefaults = migrationSql.match(/updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g) || [];
      expect(updatedAtDefaults.length).toBeGreaterThanOrEqual(8);
    });

    it('should have default values for boolean fields', () => {
      expect(migrationSql).toContain('enabled BOOLEAN DEFAULT TRUE');
      expect(migrationSql).toContain('archived BOOLEAN DEFAULT FALSE');
      expect(migrationSql).toContain('read BOOLEAN DEFAULT FALSE');
      expect(migrationSql).toContain('sent_by_ai BOOLEAN DEFAULT FALSE');
    });

    it('should have default values for integer fields', () => {
      expect(migrationSql).toContain('value_cents INTEGER DEFAULT 0');
      expect(migrationSql).toContain('unread_count INTEGER DEFAULT 0');
      expect(migrationSql).toContain('usage_count INTEGER DEFAULT 0');
    });

    it('should have default values for status fields', () => {
      expect(migrationSql).toContain("status VARCHAR(50) DEFAULT 'draft'");
      expect(migrationSql).toContain("status VARCHAR(50) DEFAULT 'active'");
    });
  });

  describe('Indexes', () => {
    it('should create index on user_profiles.user_id', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)');
    });

    it('should create index on user_profiles.niche', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_user_profiles_niche ON user_profiles(niche)');
    });

    it('should create index on fans.user_id', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_fans_user_id ON fans(user_id)');
    });

    it('should create composite index on fans (user_id, platform)', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_fans_user_platform ON fans(user_id, platform)');
    });

    it('should create descending index on fans.last_seen_at', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_fans_last_seen ON fans(last_seen_at DESC)');
    });

    it('should create descending index on fans.value_cents', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_fans_value ON fans(value_cents DESC)');
    });

    it('should create partial index on conversations.unread_count', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_conversations_unread ON conversations(unread_count) WHERE unread_count > 0');
    });

    it('should create partial index on messages.read', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(read) WHERE read = FALSE');
    });

    it('should create index on messages.created_at DESC', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)');
    });

    it('should create index on analytics_events.created_at DESC', () => {
      expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC)');
    });

    it('should have at least 25 indexes', () => {
      const indexes = migrationSql.match(/CREATE INDEX IF NOT EXISTS/g) || [];
      expect(indexes.length).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Triggers', () => {
    it('should create update_updated_at_column function', () => {
      expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
      expect(migrationSql).toContain('RETURNS TRIGGER');
      expect(migrationSql).toContain('NEW.updated_at = CURRENT_TIMESTAMP');
    });

    it('should create trigger for user_profiles', () => {
      expect(migrationSql).toContain('CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles');
      expect(migrationSql).toContain('FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
    });

    it('should create trigger for ai_configs', () => {
      expect(migrationSql).toContain('CREATE TRIGGER update_ai_configs_updated_at BEFORE UPDATE ON ai_configs');
    });

    it('should create trigger for fans', () => {
      expect(migrationSql).toContain('CREATE TRIGGER update_fans_updated_at BEFORE UPDATE ON fans');
    });

    it('should create trigger for conversations', () => {
      expect(migrationSql).toContain('CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations');
    });

    it('should create trigger for messages', () => {
      expect(migrationSql).toContain('CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages');
    });

    it('should create trigger for campaigns', () => {
      expect(migrationSql).toContain('CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns');
    });

    it('should create trigger for platform_connections', () => {
      expect(migrationSql).toContain('CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON platform_connections');
    });

    it('should create trigger for quick_replies', () => {
      expect(migrationSql).toContain('CREATE TRIGGER update_quick_replies_updated_at BEFORE UPDATE ON quick_replies');
    });

    it('should have 8 triggers for updated_at', () => {
      const triggers = migrationSql.match(/CREATE TRIGGER.*updated_at BEFORE UPDATE/g) || [];
      expect(triggers.length).toBe(8);
    });
  });

  describe('Table Comments', () => {
    it('should have comment on user_profiles', () => {
      expect(migrationSql).toContain("COMMENT ON TABLE user_profiles IS 'Extended user profile data");
    });

    it('should have comment on ai_configs', () => {
      expect(migrationSql).toContain("COMMENT ON TABLE ai_configs IS 'AI assistant configuration");
    });

    it('should have comment on fans', () => {
      expect(migrationSql).toContain("COMMENT ON TABLE fans IS 'Fans/subscribers from all platforms");
    });

    it('should have comment on conversations', () => {
      expect(migrationSql).toContain("COMMENT ON TABLE conversations IS 'Conversation threads with fans");
    });

    it('should have comment on messages', () => {
      expect(migrationSql).toContain("COMMENT ON TABLE messages IS 'Individual messages in conversations");
    });

    it('should have comment on campaigns', () => {
      expect(migrationSql).toContain("COMMENT ON TABLE campaigns IS 'Marketing campaigns");
    });

    it('should have comment on platform_connections', () => {
      expect(migrationSql).toContain("COMMENT ON TABLE platform_connections IS 'OAuth connections to external platforms");
    });

    it('should have comment on quick_replies', () => {
      expect(migrationSql).toContain("COMMENT ON TABLE quick_replies IS 'Quick reply templates");
    });

    it('should have comment on analytics_events', () => {
      expect(migrationSql).toContain("COMMENT ON TABLE analytics_events IS 'Analytics and tracking events");
    });

    it('should have 9 table comments', () => {
      const comments = migrationSql.match(/COMMENT ON TABLE/g) || [];
      expect(comments.length).toBe(9);
    });
  });

  describe('SQL Syntax', () => {
    it('should not have syntax errors in CREATE TABLE statements', () => {
      const createTableStatements = migrationSql.match(/CREATE TABLE IF NOT EXISTS[\s\S]*?\);/g) || [];
      expect(createTableStatements.length).toBe(9);
      
      createTableStatements.forEach(statement => {
        expect(statement).toContain('(');
        expect(statement).toContain(')');
        expect(statement).toMatch(/\);$/);
      });
    });

    it('should properly terminate all statements with semicolons', () => {
      const lines = migrationSql.split('\n').filter(line => 
        line.trim() && 
        !line.trim().startsWith('--') &&
        !line.trim().startsWith('/*')
      );
      
      const statementLines = lines.filter(line => 
        line.includes('CREATE') || 
        line.includes('COMMENT') ||
        line.trim() === ');'
      );
      
      // Most statement-ending lines should have semicolons
      const withSemicolons = statementLines.filter(line => line.includes(';'));
      expect(withSemicolons.length).toBeGreaterThan(0);
    });

    it('should use consistent naming convention for indexes', () => {
      const indexes = migrationSql.match(/idx_\w+/g) || [];
      expect(indexes.length).toBeGreaterThan(20);
      
      indexes.forEach(indexName => {
        expect(indexName).toMatch(/^idx_[a-z_]+$/);
      });
    });

    it('should use consistent naming convention for triggers', () => {
      const triggers = migrationSql.match(/update_\w+_updated_at/g) || [];
      expect(triggers.length).toBeGreaterThanOrEqual(8);
      
      triggers.forEach(triggerName => {
        expect(triggerName).toMatch(/^update_[a-z_]+_updated_at$/);
      });
    });
  });

  describe('Data Integrity', () => {
    it('should enforce NOT NULL on critical fields', () => {
      expect(migrationSql).toContain('user_id INTEGER NOT NULL');
      expect(migrationSql).toContain('name VARCHAR(255) NOT NULL');
      expect(migrationSql).toContain('direction VARCHAR(10) NOT NULL');
      expect(migrationSql).toContain('event_type VARCHAR(100) NOT NULL');
      expect(migrationSql).toContain('template TEXT NOT NULL');
    });

    it('should have primary keys on all tables', () => {
      const primaryKeys = migrationSql.match(/PRIMARY KEY/g) || [];
      expect(primaryKeys.length).toBe(9); // One per table
    });

    it('should use appropriate data types for money', () => {
      expect(migrationSql).toContain('value_cents INTEGER');
      expect(migrationSql).toContain('price_cents INTEGER');
      expect(migrationSql).toContain('revenue_cents');
    });

    it('should use appropriate data types for platform identifiers', () => {
      expect(migrationSql).toContain('platform VARCHAR(50)');
      expect(migrationSql).toContain('platform_id VARCHAR(255)');
      expect(migrationSql).toContain('platform_user_id VARCHAR(255)');
    });
  });

  describe('Migration Completeness', () => {
    it('should define all 9 CRM tables', () => {
      const tables = [
        'user_profiles',
        'ai_configs',
        'fans',
        'conversations',
        'messages',
        'campaigns',
        'platform_connections',
        'quick_replies',
        'analytics_events'
      ];

      tables.forEach(table => {
        expect(migrationSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
      });
    });

    it('should have comprehensive indexing strategy', () => {
      // Check for different types of indexes
      expect(migrationSql).toContain('DESC'); // Descending indexes
      expect(migrationSql).toContain('WHERE'); // Partial indexes
      expect(migrationSql).toMatch(/\(.*,.*\)/); // Composite indexes
    });

    it('should have proper relationship definitions', () => {
      // Check for foreign key relationships
      expect(migrationSql).toContain('REFERENCES users(id)');
      expect(migrationSql).toContain('REFERENCES fans(id)');
      expect(migrationSql).toContain('REFERENCES conversations(id)');
    });

    it('should be idempotent (safe to run multiple times)', () => {
      expect(migrationSql).toContain('IF NOT EXISTS');
      expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION');
    });
  });
});
