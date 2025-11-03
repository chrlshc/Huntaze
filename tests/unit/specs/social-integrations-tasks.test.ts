/**
 * Unit Tests - Social Integrations Tasks Status
 * 
 * Tests to validate task completion status
 * Based on: .kiro/specs/social-integrations/tasks.md
 * 
 * Coverage:
 * - Task 1 completion status
 * - Task file structure
 * - Requirements mapping
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Social Integrations Tasks - Status Validation', () => {
  let tasksContent: string;

  beforeAll(() => {
    const tasksPath = join(process.cwd(), '.kiro/specs/social-integrations/tasks.md');
    tasksContent = readFileSync(tasksPath, 'utf-8');
  });

  describe('Task 1: Database Schema and Migrations', () => {
    it('should be marked as complete', () => {
      // Task 1 should be marked with [x]
      expect(tasksContent).toMatch(/- \[x\] 1\. Database Schema and Migrations/);
    });

    it('should have all sub-requirements listed', () => {
      expect(tasksContent).toContain('Create migration file for oauth_accounts, tiktok_posts, webhook_events tables');
      expect(tasksContent).toContain('Add indexes for performance (expires_at, user_id, status)');
      expect(tasksContent).toContain('Test migration on development database');
    });

    it('should reference correct requirements', () => {
      expect(tasksContent).toMatch(/Requirements: 1\.3, 4\.1, 4\.2/);
    });

    it('should be in TikTok Integration section', () => {
      expect(tasksContent).toContain('## TikTok Integration (Priority 1)');
    });
  });

  describe('Task 2: Token Encryption Service', () => {
    it('should be marked as not started', () => {
      // Task 2 should be marked with [ ]
      expect(tasksContent).toMatch(/- \[ \] 2\. Token Encryption Service/);
    });

    it('should have sub-tasks defined', () => {
      expect(tasksContent).toContain('2.1 Implement TokenEncryptionService with AES-256-GCM');
      expect(tasksContent).toContain('2.2 Create TokenManager for token lifecycle');
    });
  });

  describe('Task 3: TikTok OAuth Flow', () => {
    it('should be marked as not started', () => {
      expect(tasksContent).toMatch(/- \[ \] 3\. TikTok OAuth Flow/);
    });

    it('should have sub-tasks defined', () => {
      expect(tasksContent).toContain('3.1 Create TikTokOAuthService');
      expect(tasksContent).toContain('3.2 Create OAuth init endpoint');
      expect(tasksContent).toContain('3.3 Create OAuth callback endpoint');
    });
  });

  describe('File Structure', () => {
    it('should have proper markdown structure', () => {
      expect(tasksContent).toContain('# Implementation Plan - Social Platform Integrations');
    });

    it('should have priority sections', () => {
      expect(tasksContent).toContain('## TikTok Integration (Priority 1)');
      expect(tasksContent).toContain('## Instagram Integration (Priority 2)');
      expect(tasksContent).toContain('## Cross-Platform Infrastructure (Priority 3)');
    });

    it('should have notes section', () => {
      expect(tasksContent).toContain('## Notes');
    });

    it('should use consistent checkbox format', () => {
      // All tasks should use - [ ] or - [x] format
      const taskLines = tasksContent.match(/^- \[[x ]\]/gm) || [];
      expect(taskLines.length).toBeGreaterThan(0);
    });
  });

  describe('Requirements Mapping', () => {
    it('should map Task 1 to requirements', () => {
      const task1Section = tasksContent.match(/1\. Database Schema and Migrations[\s\S]*?(?=- \[)/)?.[0] || '';
      expect(task1Section).toContain('Requirements: 1.3, 4.1, 4.2');
    });

    it('should map Task 2 to requirements', () => {
      // Task 2 has sub-tasks with requirements
      expect(tasksContent).toContain('Requirements: 9.1');
      expect(tasksContent).toContain('Requirements: 1.4, 1.5');
    });

    it('should have requirements for all major tasks', () => {
      // Check that requirements are referenced throughout
      const requirementRefs = tasksContent.match(/Requirements: [\d., ]+/g) || [];
      expect(requirementRefs.length).toBeGreaterThan(10);
    });
  });

  describe('Task Dependencies', () => {
    it('should have Task 1 completed before Task 2', () => {
      const task1Index = tasksContent.indexOf('1. Database Schema and Migrations');
      const task2Index = tasksContent.indexOf('2. Token Encryption Service');
      
      expect(task1Index).toBeLessThan(task2Index);
      expect(tasksContent).toMatch(/- \[x\] 1\. Database Schema and Migrations/);
    });

    it('should have logical task ordering', () => {
      const tasks = [
        '1. Database Schema and Migrations',
        '2. Token Encryption Service',
        '3. TikTok OAuth Flow',
        '4. TikTok Upload Service',
        '5. TikTok Webhook Handler'
      ];

      let lastIndex = -1;
      tasks.forEach(task => {
        const index = tasksContent.indexOf(task);
        expect(index).toBeGreaterThan(lastIndex);
        lastIndex = index;
      });
    });
  });

  describe('Test Tasks', () => {
    it('should have test tasks marked as optional', () => {
      expect(tasksContent).toContain('- [ ]* 8. TikTok Tests');
      expect(tasksContent).toContain('- [ ]* 14. Instagram Tests');
    });

    it('should have test sub-tasks defined', () => {
      expect(tasksContent).toContain('8.1 Unit tests for TikTokOAuthService');
      expect(tasksContent).toContain('8.2 Integration tests for upload flow');
      expect(tasksContent).toContain('8.3 E2E tests for complete flow');
    });

    it('should reference test requirements', () => {
      expect(tasksContent).toContain('Requirements: 11.1');
      expect(tasksContent).toContain('Requirements: 11.2');
      expect(tasksContent).toContain('Requirements: 11.3');
    });
  });

  describe('Documentation Tasks', () => {
    it('should have documentation tasks', () => {
      expect(tasksContent).toContain('16. Documentation');
    });

    it('should have user and developer documentation sub-tasks', () => {
      expect(tasksContent).toContain('16.1 Create user documentation');
      expect(tasksContent).toContain('16.2 Create developer documentation');
    });
  });

  describe('Monitoring Tasks', () => {
    it('should have monitoring and observability tasks', () => {
      expect(tasksContent).toContain('15. Monitoring and Observability');
    });

    it('should have monitoring sub-tasks', () => {
      expect(tasksContent).toContain('15.1 Add structured logging');
      expect(tasksContent).toContain('15.2 Add metrics collection');
      expect(tasksContent).toContain('15.3 Create monitoring dashboards');
      expect(tasksContent).toContain('15.4 Set up alerts');
    });
  });

  describe('Task Completion Validation', () => {
    it('should have exactly one task marked as complete', () => {
      const completedTasks = tasksContent.match(/- \[x\] \d+\./g) || [];
      expect(completedTasks.length).toBe(1);
      expect(completedTasks[0]).toContain('1.');
    });

    it('should have remaining tasks marked as incomplete', () => {
      const incompleteTasks = tasksContent.match(/- \[ \] \d+\./g) || [];
      expect(incompleteTasks.length).toBeGreaterThan(10);
    });

    it('should have consistent task numbering', () => {
      const taskNumbers = tasksContent.match(/- \[[x ]\] (\d+)\./g) || [];
      const numbers = taskNumbers.map(t => parseInt(t.match(/\d+/)?.[0] || '0'));
      
      // Check that numbers are sequential
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] !== numbers[i-1] && numbers[i] !== numbers[i-1] + 1) {
          // Allow for sub-tasks (same number)
          expect(numbers[i]).toBeGreaterThanOrEqual(numbers[i-1]);
        }
      }
    });
  });

  describe('Notes Section', () => {
    it('should have implementation notes', () => {
      expect(tasksContent).toContain('## Notes');
    });

    it('should mention optional testing tasks', () => {
      expect(tasksContent).toContain('Tasks marked with `*` are optional testing tasks');
    });

    it('should mention error handling', () => {
      expect(tasksContent).toContain('All tasks should be implemented with proper error handling');
    });

    it('should mention idempotence', () => {
      expect(tasksContent).toContain('All database operations should be idempotent');
    });

    it('should mention retry logic', () => {
      expect(tasksContent).toContain('All API calls should have retry logic with exponential backoff');
    });

    it('should mention token encryption', () => {
      expect(tasksContent).toContain('All sensitive data (tokens) must be encrypted at rest');
    });
  });

  describe('Task 1 Validation', () => {
    it('should have migration file created', () => {
      const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql');
      const fs = require('fs');
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('should have migration script created', () => {
      const scriptPath = join(process.cwd(), 'scripts/migrate-social-integrations.js');
      const fs = require('fs');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should have tests created', () => {
      const fs = require('fs');
      const testPaths = [
        'tests/unit/db/social-integrations-migration.test.ts',
        'tests/unit/scripts/migrate-social-integrations.test.ts',
        'tests/integration/db/social-integrations-migration.test.ts'
      ];

      testPaths.forEach(path => {
        const fullPath = join(process.cwd(), path);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });

    it('should have documentation created', () => {
      const fs = require('fs');
      const docPaths = [
        'tests/unit/db/social-integrations-migration-README.md',
        'SOCIAL_INTEGRATIONS_TESTS_COMPLETE.md'
      ];

      docPaths.forEach(path => {
        const fullPath = join(process.cwd(), path);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });
});
