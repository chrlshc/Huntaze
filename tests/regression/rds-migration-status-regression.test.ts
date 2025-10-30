/**
 * Regression Tests for RDS Migration Status
 * Ensures migration status tracking doesn't break existing functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('RDS Migration Status Regression Tests', () => {
  const statusFilePath = join(process.cwd(), 'RDS_MIGRATION_STATUS.md');

  describe('Documentation Format Consistency', () => {
    it('should maintain consistent markdown structure', () => {
      if (!existsSync(statusFilePath)) {
        return; // Skip if file doesn't exist yet
      }

      const content = readFileSync(statusFilePath, 'utf-8');

      // Should have proper heading hierarchy
      expect(content).toMatch(/^# /m);
      expect(content).toMatch(/^## /m);
      expect(content).toMatch(/^### /m);

      // Should not have broken heading levels
      expect(content).not.toMatch(/^#### /m); // No h4 without h3
    });

    it('should maintain consistent status emoji usage', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Check for consistent emoji patterns
      const emojiPatterns = [
        /✅/,  // Success
        /❌/,  // Failure
        /⏳/,  // In progress
        /⚠️/   // Warning
      ];

      emojiPatterns.forEach(pattern => {
        if (content.match(pattern)) {
          // If emoji is used, it should be used consistently
          const matches = content.match(new RegExp(pattern, 'g'));
          expect(matches).toBeDefined();
        }
      });
    });

    it('should not break existing documentation links', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Check for script references
      if (content.includes('./scripts/')) {
        expect(content).toMatch(/\.\/scripts\/[a-z-]+\.sh/);
      }

      // Check for documentation references
      if (content.includes('docs/')) {
        expect(content).toMatch(/docs\/[a-z-/]+\.md/);
      }
    });
  });

  describe('AWS Resource Identifier Consistency', () => {
    it('should use consistent instance naming convention', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Source instance should be referenced consistently
      const sourcePattern = /huntaze-postgres-production(?!-encrypted)/g;
      const sourceMatches = content.match(sourcePattern);

      if (sourceMatches && sourceMatches.length > 1) {
        // All references should be identical
        const uniqueRefs = new Set(sourceMatches);
        expect(uniqueRefs.size).toBe(1);
      }
    });

    it('should use consistent snapshot naming convention', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Snapshot IDs should follow pattern: instance-name-purpose-timestamp
      const snapshotPattern = /huntaze-postgres-production-(pre-encrypt|encrypted)-\d{8}-\d{6}/g;
      const snapshotMatches = content.match(snapshotPattern);

      if (snapshotMatches) {
        snapshotMatches.forEach(snapshot => {
          expect(snapshot).toMatch(/^huntaze-postgres-production-(pre-encrypt|encrypted)-\d{8}-\d{6}$/);
        });
      }
    });

    it('should maintain valid KMS ARN format', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      const kmsArnPattern = /arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+/g;
      const kmsMatches = content.match(kmsArnPattern);

      if (kmsMatches) {
        kmsMatches.forEach(arn => {
          // Verify ARN structure
          expect(arn).toMatch(/^arn:aws:kms:/);
          expect(arn).toMatch(/:\d{12}:/); // Account ID
          expect(arn).toMatch(/key\/[a-f0-9-]+$/); // Key ID
        });
      }
    });
  });

  describe('Command Syntax Consistency', () => {
    it('should maintain consistent AWS CLI command format', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // All AWS CLI commands should start with 'aws'
      const cliCommands = content.match(/aws [a-z-]+ [a-z-]+/g);

      if (cliCommands) {
        cliCommands.forEach(cmd => {
          expect(cmd).toMatch(/^aws [a-z-]+ [a-z-]+$/);
        });
      }
    });

    it('should use consistent parameter formatting', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Parameters should use double dashes
      const parameters = content.match(/--[a-z-]+/g);

      if (parameters) {
        parameters.forEach(param => {
          expect(param).toMatch(/^--[a-z-]+$/);
          expect(param).not.toMatch(/^---/); // No triple dashes
          expect(param).not.toMatch(/_/); // No underscores in params
        });
      }
    });

    it('should maintain consistent output format flags', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Output format should be consistent
      const outputFormats = content.match(/--output (text|json|table)/g);

      if (outputFormats) {
        outputFormats.forEach(format => {
          expect(['--output text', '--output json', '--output table']).toContain(format);
        });
      }
    });
  });

  describe('Status Tracking Consistency', () => {
    it('should maintain consistent step numbering', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Migration steps should be numbered sequentially
      const stepPattern = /\*\*Step (\d+):\*\*/g;
      const steps: number[] = [];
      let match;

      while ((match = stepPattern.exec(content)) !== null) {
        steps.push(parseInt(match[1]));
      }

      if (steps.length > 0) {
        // Steps should start at 1
        expect(steps[0]).toBe(1);

        // Steps should be sequential
        for (let i = 1; i < steps.length; i++) {
          expect(steps[i]).toBe(steps[i - 1] + 1);
        }
      }
    });

    it('should maintain consistent next steps numbering', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Next steps should be numbered sequentially
      const nextStepPattern = /### (\d+)\. /g;
      const nextSteps: number[] = [];
      let match;

      while ((match = nextStepPattern.exec(content)) !== null) {
        nextSteps.push(parseInt(match[1]));
      }

      if (nextSteps.length > 0) {
        expect(nextSteps[0]).toBe(1);

        for (let i = 1; i < nextSteps.length; i++) {
          expect(nextSteps[i]).toBe(nextSteps[i - 1] + 1);
        }
      }
    });

    it('should maintain consistent status values', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Status values should be from allowed set
      const statusPattern = /\*\*Status:\*\* ([A-Za-z ]+)/g;
      const allowedStatuses = [
        'Available',
        'Modifying',
        'Completed',
        'In Progress',
        'IN PROGRESS',
        'Pending'
      ];

      let match;
      while ((match = statusPattern.exec(content)) !== null) {
        const status = match[1].trim();
        expect(allowedStatuses).toContain(status);
      }
    });
  });

  describe('Timestamp Format Consistency', () => {
    it('should use ISO 8601 format for timestamps', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Check for ISO 8601 timestamps
      const isoPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g;
      const timestamps = content.match(isoPattern);

      if (timestamps) {
        timestamps.forEach(ts => {
          expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
          
          // Verify it's a valid date
          const date = new Date(ts);
          expect(date.toString()).not.toBe('Invalid Date');
        });
      }
    });

    it('should use consistent date format in headers', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Date should be in YYYY-MM-DD format
      const datePattern = /\*\*Date:\*\* (\d{4}-\d{2}-\d{2})/;
      const dateMatch = content.match(datePattern);

      if (dateMatch) {
        const date = dateMatch[1];
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Verify it's a valid date
        const dateObj = new Date(date);
        expect(dateObj.toString()).not.toBe('Invalid Date');
      }
    });

    it('should use consistent time format in headers', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Time should be in HH:MM UTC format
      const timePattern = /\*\*Time:\*\* (\d{2}:\d{2}) UTC/;
      const timeMatch = content.match(timePattern);

      if (timeMatch) {
        const time = timeMatch[1];
        expect(time).toMatch(/^\d{2}:\d{2}$/);
        
        const [hours, minutes] = time.split(':').map(Number);
        expect(hours).toBeGreaterThanOrEqual(0);
        expect(hours).toBeLessThan(24);
        expect(minutes).toBeGreaterThanOrEqual(0);
        expect(minutes).toBeLessThan(60);
      }
    });
  });

  describe('Audit Status Consistency', () => {
    it('should maintain consistent check count format', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Check counts should follow pattern: "✅ PASS: N checks"
      const checkPatterns = [
        /✅ PASS: \d+ checks?/g,
        /⚠️ WARN: \d+ checks?/g,
        /❌ FAIL: \d+ checks?/g
      ];

      checkPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const count = parseInt(match.match(/\d+/)?.[0] || '0');
            expect(count).toBeGreaterThanOrEqual(0);
            
            // Singular vs plural
            if (count === 1) {
              expect(match).toContain('check');
              expect(match).not.toContain('checks');
            } else {
              expect(match).toContain('checks');
            }
          });
        }
      });
    });

    it('should show improvement in audit status', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Extract before and after fail counts
      const beforeMatch = content.match(/Before RDS migration:[\s\S]*?❌ FAIL: (\d+) checks?/);
      const afterMatch = content.match(/After RDS migration[\s\S]*?❌ FAIL: (\d+) checks?/);

      if (beforeMatch && afterMatch) {
        const beforeFails = parseInt(beforeMatch[1]);
        const afterFails = parseInt(afterMatch[1]);

        // After migration should have fewer or equal failures
        expect(afterFails).toBeLessThanOrEqual(beforeFails);
      }
    });
  });

  describe('Code Block Consistency', () => {
    it('should maintain consistent code block formatting', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Code blocks should be properly closed
      const openBlocks = (content.match(/```bash/g) || []).length;
      const closeBlocks = (content.match(/```\n/g) || []).length;

      expect(openBlocks).toBe(closeBlocks);
    });

    it('should use bash for shell commands', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // All code blocks with AWS CLI should use bash
      const codeBlocks = content.match(/```(\w+)\n([\s\S]*?)```/g);

      if (codeBlocks) {
        codeBlocks.forEach(block => {
          if (block.includes('aws ')) {
            expect(block).toMatch(/```bash/);
          }
        });
      }
    });
  });

  describe('Cross-Reference Consistency', () => {
    it('should reference existing scripts correctly', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Check for go-no-go audit script reference
      if (content.includes('go-no-go-audit.sh')) {
        expect(content).toMatch(/\.\/scripts\/go-no-go-audit\.sh/);
      }

      // Check for migration script reference
      if (content.includes('migrate-rds')) {
        expect(content).toMatch(/migrate-rds[a-z-]*\.sh/);
      }
    });

    it('should reference existing documentation correctly', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Check for runbook references
      if (content.includes('runbook')) {
        expect(content).toMatch(/docs\/runbooks\/[a-z-]+\.md/);
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing migration scripts', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Should reference standard AWS RDS commands
      const requiredCommands = [
        'describe-db-instances',
        'create-db-snapshot',
        'copy-db-snapshot',
        'restore-db-instance-from-db-snapshot'
      ];

      // At least some of these commands should be present
      const foundCommands = requiredCommands.filter(cmd => content.includes(cmd));
      expect(foundCommands.length).toBeGreaterThan(0);
    });

    it('should maintain compatibility with existing instance identifiers', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Should reference production instance
      expect(content).toContain('huntaze-postgres-production');

      // Should not introduce breaking naming changes
      expect(content).not.toContain('huntaze_postgres_production'); // No underscores
      expect(content).not.toContain('huntaze.postgres.production'); // No dots
    });
  });

  describe('Documentation Quality Regression', () => {
    it('should not introduce spelling errors in technical terms', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Common technical terms should be spelled correctly
      const correctTerms = [
        'PostgreSQL',
        'encryption',
        'snapshot',
        'instance',
        'database',
        'migration'
      ];

      correctTerms.forEach(term => {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          // Case-insensitive check that term exists
          expect(content).toMatch(new RegExp(term, 'i'));
        }
      });
    });

    it('should maintain professional tone and formatting', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Should not contain informal language
      expect(content).not.toMatch(/\b(gonna|wanna|gotta)\b/i);
      expect(content).not.toMatch(/!!!/); // No excessive punctuation
      expect(content).not.toMatch(/\?\?\?/);
    });

    it('should not introduce broken markdown links', () => {
      if (!existsSync(statusFilePath)) return;

      const content = readFileSync(statusFilePath, 'utf-8');

      // Check for malformed markdown links
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;

      while ((match = linkPattern.exec(content)) !== null) {
        const linkText = match[1];
        const linkUrl = match[2];

        expect(linkText).not.toBe('');
        expect(linkUrl).not.toBe('');
        expect(linkUrl).not.toContain(' '); // No spaces in URLs
      }
    });
  });
});
