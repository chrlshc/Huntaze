/**
 * Unit Tests - Social Integrations Tasks Status (UPDATED)
 * 
 * Tests to validate task completion status
 * Based on: .kiro/specs/social-integrations/tasks.md
 * 
 * Coverage:
 * - All task completion statuses (89% complete)
 * - Task file structure
 * - Requirements mapping
 * - Implementation validation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Social Integrations Tasks - Current Status Validation', () => {
  let tasksContent: string;

  beforeAll(() => {
    const tasksPath = join(process.cwd(), '.kiro/specs/social-integrations/tasks.md');
    tasksContent = readFileSync(tasksPath, 'utf-8');
  });

  describe('TikTok Integration - Completed Tasks', () => {
    it('Task 1: Database Schema should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 1\. Database Schema and Migrations/);
    });

    it('Task 2: Token Encryption Service should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 2\. Token Encryption Service/);
      expect(tasksContent).toMatch(/- \[x\] 2\.1 Implement TokenEncryptionService/);
      expect(tasksContent).toMatch(/- \[x\] 2\.2 Create TokenManager/);
    });

    it('Task 3: TikTok OAuth Flow should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 3\. TikTok OAuth Flow/);
      expect(tasksContent).toMatch(/- \[x\] 3\.1 Create TikTokOAuthService/);
      expect(tasksContent).toMatch(/- \[x\] 3\.2 Create OAuth init endpoint/);
      expect(tasksContent).toMatch(/- \[x\] 3\.3 Create OAuth callback endpoint/);
    });

    it('Task 4: TikTok Upload Service should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 4\. TikTok Upload Service/);
      expect(tasksContent).toMatch(/- \[x\] 4\.1 Create TikTokUploadService/);
      expect(tasksContent).toMatch(/- \[x\] 4\.2 Create upload endpoint/);
      expect(tasksContent).toMatch(/- \[x\] 4\.3 Create status endpoint/);
    });

    it('Task 5: TikTok Webhook Handler should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 5\. TikTok Webhook Handler/);
      expect(tasksContent).toMatch(/- \[x\] 5\.1 Create WebhookProcessor service/);
      expect(tasksContent).toMatch(/- \[x\] 5\.2 Create webhook endpoint/);
      expect(tasksContent).toMatch(/- \[x\] 5\.3 Create webhook worker/);
    });

    it('Task 6: TikTok CRM Sync should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 6\. TikTok CRM Sync/);
      expect(tasksContent).toMatch(/- \[x\] 6\.1 Create OAuthAccountsRepository/);
      expect(tasksContent).toMatch(/- \[x\] 6\.2 Create TikTokPostsRepository/);
      expect(tasksContent).toMatch(/- \[x\] 6\.3 Create token refresh scheduler/);
    });

    it('Task 7: TikTok UI Components should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 7\. TikTok UI Components/);
      expect(tasksContent).toMatch(/- \[x\] 7\.1 Create TikTok connect page/);
      expect(tasksContent).toMatch(/- \[x\] 7\.2 Create TikTok upload form/);
      expect(tasksContent).toMatch(/- \[x\] 7\.3 Create TikTok dashboard widget/);
    });

    it('Task 8: TikTok Tests should be marked as complete and optional', () => {
      expect(tasksContent).toMatch(/- \[x\]\* 8\. TikTok Tests/);
    });
  });

  describe('Instagram Integration - Completed Tasks', () => {
    it('Task 9: Instagram OAuth Flow should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 9\. Instagram OAuth Flow/);
      expect(tasksContent).toMatch(/- \[x\] 9\.1 Create InstagramOAuthService/);
      expect(tasksContent).toMatch(/- \[x\] 9\.2 Create OAuth endpoints/);
    });

    it('Task 10: Instagram Publishing should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 10\. Instagram Publishing/);
      expect(tasksContent).toMatch(/- \[x\] 10\.1 Create InstagramPublishService/);
      expect(tasksContent).toMatch(/- \[x\] 10\.2 Create publish endpoint/);
    });

    it('Task 11: Instagram Webhooks should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 11\. Instagram Webhooks/);
      expect(tasksContent).toMatch(/- \[x\] 11\.1 Create webhook endpoint/);
      expect(tasksContent).toMatch(/- \[x\] 11\.2 Create webhook worker/);
    });

    it('Task 12: Instagram CRM Sync should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 12\. Instagram CRM Sync/);
      expect(tasksContent).toMatch(/- \[x\] 12\.1 Create InstagramAccountsRepository/);
      expect(tasksContent).toMatch(/- \[x\] 12\.2 Create IgMediaRepository/);
      expect(tasksContent).toMatch(/- \[x\] 12\.3 Create insights sync worker/);
    });

    it('Task 13: Instagram UI Components should be complete', () => {
      expect(tasksContent).toMatch(/- \[x\] 13\. Instagram UI Components/);
      expect(tasksContent).toMatch(/- \[x\] 13\.1 Create Instagram connect page/);
      expect(tasksContent).toMatch(/- \[x\] 13\.2 Create Instagram publish form/);
    });

    it('Task 14: Instagram Tests should be marked as incomplete and optional', () => {
      expect(tasksContent).toMatch(/- \[ \]\* 14\. Instagram Tests/);
    });
  });

  describe('Cross-Platform Infrastructure - Partial Completion', () => {
    it('Task 15: Monitoring should be partially complete', () => {
      expect(tasksContent).toMatch(/- \[ \] 15\. Monitoring and Observability/);
      expect(tasksContent).toMatch(/- \[x\] 15\.1 Add structured logging/);
      expect(tasksContent).toMatch(/- \[x\] 15\.2 Add metrics collection/);
      expect(tasksContent).toMatch(/- \[ \] 15\.3 Create monitoring dashboards/);
      expect(tasksContent).toMatch(/- \[ \]\* 15\.4 Set up alerts/);
    });

    it('Task 16: Documentation should be incomplete', () => {
      expect(tasksContent).toMatch(/- \[ \] 16\. Documentation/);
      expect(tasksContent).toMatch(/- \[ \] 16\.1 Create user documentation/);
      expect(tasksContent).toMatch(/- \[ \] 16\.2 Create developer documentation/);
    });
  });

  describe('Overall Completion Metrics', () => {
    it('should have 42+ completed tasks', () => {
      const completedTasks = tasksContent.match(/- \[x\]/g) || [];
      expect(completedTasks.length).toBeGreaterThanOrEqual(42);
    });

    it('should have less than 10 incomplete tasks', () => {
      const incompleteTasks = tasksContent.match(/- \[ \] \d+\./g) || [];
      expect(incompleteTasks.length).toBeLessThan(10);
    });

    it('should have completion rate above 85%', () => {
      const completed = (tasksContent.match(/- \[x\]/g) || []).length;
      const total = (tasksContent.match(/- \[[x ]\]/g) || []).length;
      const completionRate = (completed / total) * 100;
      
      expect(completionRate).toBeGreaterThan(85);
    });
  });

  describe('File Structure Validation', () => {
    it('should have proper markdown structure', () => {
      expect(tasksContent).toContain('# Implementation Plan - Social Platform Integrations');
    });

    it('should have all priority sections', () => {
      expect(tasksContent).toContain('## TikTok Integration (Priority 1)');
      expect(tasksContent).toContain('## Instagram Integration (Priority 2)');
      expect(tasksContent).toContain('## Cross-Platform Infrastructure (Priority 3)');
    });

    it('should have notes section with guidelines', () => {
      expect(tasksContent).toContain('## Notes');
      expect(tasksContent).toContain('Tasks marked with `*` are optional');
      expect(tasksContent).toContain('proper error handling');
      expect(tasksContent).toContain('idempotent');
      expect(tasksContent).toContain('encrypted at rest');
    });
  });

  describe('Implementation Files Validation', () => {
    describe('TikTok Implementation Files', () => {
      it('should have TikTok OAuth service', () => {
        expect(existsSync(join(process.cwd(), 'lib/services/tiktokOAuth.ts'))).toBe(true);
      });

      it('should have TikTok upload service', () => {
        expect(existsSync(join(process.cwd(), 'lib/services/tiktokUpload.ts'))).toBe(true);
      });

      it('should have webhook processor', () => {
        expect(existsSync(join(process.cwd(), 'lib/services/webhookProcessor.ts'))).toBe(true);
      });

      it('should have token encryption service', () => {
        expect(existsSync(join(process.cwd(), 'lib/services/tokenEncryption.ts'))).toBe(true);
      });

      it('should have token manager', () => {
        expect(existsSync(join(process.cwd(), 'lib/services/tokenManager.ts'))).toBe(true);
      });

      it('should have TikTok repositories', () => {
        expect(existsSync(join(process.cwd(), 'lib/db/repositories/tiktokPostsRepository.ts'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'lib/db/repositories/oauthAccountsRepository.ts'))).toBe(true);
      });

      it('should have TikTok API endpoints', () => {
        expect(existsSync(join(process.cwd(), 'app/api/tiktok/upload/route.ts'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'app/api/webhooks/tiktok/route.ts'))).toBe(true);
      });

      it('should have TikTok UI components', () => {
        expect(existsSync(join(process.cwd(), 'app/platforms/tiktok/upload/page.tsx'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'components/platforms/TikTokDashboardWidget.tsx'))).toBe(true);
      });
    });

    describe('Instagram Implementation Files', () => {
      it('should have Instagram OAuth service', () => {
        expect(existsSync(join(process.cwd(), 'lib/services/instagramOAuth.ts'))).toBe(true);
      });

      it('should have Instagram publish service', () => {
        expect(existsSync(join(process.cwd(), 'lib/services/instagramPublish.ts'))).toBe(true);
      });

      it('should have Instagram API endpoints', () => {
        expect(existsSync(join(process.cwd(), 'app/api/instagram/publish/route.ts'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'app/api/webhooks/instagram/route.ts'))).toBe(true);
      });

      it('should have Instagram UI components', () => {
        expect(existsSync(join(process.cwd(), 'app/platforms/connect/instagram/page.tsx'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'components/platforms/InstagramDashboardWidget.tsx'))).toBe(true);
      });
    });

    describe('Database and Migration Files', () => {
      it('should have social integrations migration', () => {
        expect(existsSync(join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql'))).toBe(true);
      });

      it('should have migration script', () => {
        expect(existsSync(join(process.cwd(), 'scripts/migrate-social-integrations.js'))).toBe(true);
      });
    });

    describe('Worker Files', () => {
      it('should have webhook worker', () => {
        expect(existsSync(join(process.cwd(), 'lib/workers/webhookWorker.ts'))).toBe(true);
      });

      it('should have token refresh scheduler', () => {
        expect(existsSync(join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts'))).toBe(true);
      });

      it('should have Instagram insights worker', () => {
        expect(existsSync(join(process.cwd(), 'lib/workers/instagramInsightsWorker.ts'))).toBe(true);
      });
    });

    describe('Utility Files', () => {
      it('should have logger utility', () => {
        expect(existsSync(join(process.cwd(), 'lib/utils/logger.ts'))).toBe(true);
      });

      it('should have metrics utility', () => {
        expect(existsSync(join(process.cwd(), 'lib/utils/metrics.ts'))).toBe(true);
      });
    });
  });

  describe('Test Files Validation', () => {
    describe('TikTok Tests', () => {
      it('should have TikTok OAuth unit tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/unit/services/tiktokOAuth.test.ts'))).toBe(true);
      });

      it('should have TikTok OAuth integration tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/integration/api/tiktok-oauth-endpoints.test.ts'))).toBe(true);
      });

      it('should have TikTok upload integration tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/integration/integrations/tiktok-content-upload.test.ts'))).toBe(true);
      });

      it('should have TikTok UI tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/unit/ui/tiktok-dashboard-widget-logic.test.ts'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'tests/unit/ui/tiktok-upload-form-logic.test.ts'))).toBe(true);
      });
    });

    describe('Instagram Tests', () => {
      it('should have Instagram OAuth unit tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/unit/services/instagramOAuth.test.ts'))).toBe(true);
      });

      it('should have Instagram publish unit tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/unit/services/instagramPublish.test.ts'))).toBe(true);
      });

      it('should have Instagram OAuth integration tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/integration/api/instagram-oauth-endpoints.test.ts'))).toBe(true);
      });

      it('should have Instagram publish integration tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/integration/api/instagram-publish-endpoints.test.ts'))).toBe(true);
      });
    });

    describe('Infrastructure Tests', () => {
      it('should have token encryption tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/unit/services/tokenEncryption.test.ts'))).toBe(true);
      });

      it('should have migration tests', () => {
        expect(existsSync(join(process.cwd(), 'tests/unit/db/social-integrations-migration.test.ts'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'tests/integration/db/social-integrations-migration.test.ts'))).toBe(true);
      });
    });
  });

  describe('Documentation Validation', () => {
    it('should have developer guide', () => {
      expect(existsSync(join(process.cwd(), 'docs/DEVELOPER_GUIDE_SOCIAL_INTEGRATIONS.md'))).toBe(true);
    });

    it('should have user guide', () => {
      expect(existsSync(join(process.cwd(), 'docs/USER_GUIDE_SOCIAL_INTEGRATIONS.md'))).toBe(true);
    });

    it('should have test documentation', () => {
      expect(existsSync(join(process.cwd(), 'tests/unit/services/tiktok-oauth-README.md'))).toBe(true);
      expect(existsSync(join(process.cwd(), 'tests/unit/services/instagramPublish-README.md'))).toBe(true);
    });
  });

  describe('Requirements Mapping Validation', () => {
    it('should map all TikTok requirements', () => {
      expect(tasksContent).toContain('Requirements: 1.1');
      expect(tasksContent).toContain('Requirements: 1.2');
      expect(tasksContent).toContain('Requirements: 1.3');
      expect(tasksContent).toContain('Requirements: 1.4');
      expect(tasksContent).toContain('Requirements: 1.5');
    });

    it('should map all upload requirements', () => {
      expect(tasksContent).toContain('Requirements: 2.1');
      expect(tasksContent).toContain('Requirements: 2.2');
      expect(tasksContent).toContain('Requirements: 2.3');
      expect(tasksContent).toContain('Requirements: 2.4');
    });

    it('should map all webhook requirements', () => {
      expect(tasksContent).toContain('Requirements: 3.1');
      expect(tasksContent).toContain('Requirements: 3.2');
      expect(tasksContent).toContain('Requirements: 3.3');
    });

    it('should map all CRM requirements', () => {
      expect(tasksContent).toContain('Requirements: 4.1');
      expect(tasksContent).toContain('Requirements: 4.2');
      expect(tasksContent).toContain('Requirements: 4.3');
    });

    it('should map all Instagram requirements', () => {
      expect(tasksContent).toContain('Requirements: 5.1');
      expect(tasksContent).toContain('Requirements: 6.1');
      expect(tasksContent).toContain('Requirements: 7.1');
      expect(tasksContent).toContain('Requirements: 8.1');
    });
  });
});
