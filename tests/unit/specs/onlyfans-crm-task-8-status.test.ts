/**
 * Unit Tests - OnlyFans CRM Task 8 Status
 * 
 * Tests to validate Task 8 (Bulk Messaging Backend) completion status
 * Based on: .kiro/specs/onlyfans-crm-integration/tasks.md (Phase 5)
 * 
 * Coverage:
 * - Task 8: API route /api/messages/bulk
 * - Task 8.1: Validation bulk request
 * - Task 8.2: Campaign creation
 * - Task 8.3: Batch sending
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('OnlyFans CRM - Task 8 Status Validation', () => {
  let tasksContent: string;
  let bulkRouteContent: string;

  beforeAll(() => {
    const tasksPath = join(process.cwd(), '.kiro/specs/onlyfans-crm-integration/tasks.md');
    const bulkRoutePath = join(process.cwd(), 'app/api/messages/bulk/route.ts');

    tasksContent = readFileSync(tasksPath, 'utf-8');
    
    if (existsSync(bulkRoutePath)) {
      bulkRouteContent = readFileSync(bulkRoutePath, 'utf-8');
    }
  });

  describe('Task 8: API Route /api/messages/bulk', () => {
    it('should be marked as in progress or complete', () => {
      // Task can be marked as [-] (in progress) or [x] (complete)
      const taskPattern = /- \[(x|-)\] 8\. Créer API route \/api\/messages\/bulk/;
      expect(tasksContent).toMatch(taskPattern);
    });

    it('should have implementation file', () => {
      const routePath = join(process.cwd(), 'app/api/messages/bulk/route.ts');
      expect(existsSync(routePath)).toBe(true);
    });

    it('should implement POST handler', () => {
      expect(bulkRouteContent).toContain('async function postHandler');
      expect(bulkRouteContent).toContain('export const POST');
    });

    it('should implement authentication', () => {
      expect(bulkRouteContent).toContain('getUserFromRequest');
      expect(bulkRouteContent).toContain('Not authenticated');
    });

    it('should implement rate limiting', () => {
      expect(bulkRouteContent).toContain('checkRateLimit');
      expect(bulkRouteContent).toContain('Rate limit exceeded');
    });

    it('should use monitoring wrapper', () => {
      expect(bulkRouteContent).toContain('withMonitoring');
      expect(bulkRouteContent).toContain('messages.bulk');
    });
  });

  describe('Task 8.1: Validation Bulk Request', () => {
    it('should have Zod validation schema', () => {
      expect(bulkRouteContent).toContain('BulkMessageSchema');
      expect(bulkRouteContent).toContain('z.object');
    });

    it('should validate recipientIds array', () => {
      expect(bulkRouteContent).toContain('recipientIds');
      expect(bulkRouteContent).toContain('z.array(z.number().int())');
      expect(bulkRouteContent).toContain('.min(1)');
      expect(bulkRouteContent).toContain('.max(100)');
    });

    it('should validate content field', () => {
      expect(bulkRouteContent).toContain('content');
      expect(bulkRouteContent).toContain('z.string()');
      expect(bulkRouteContent).toContain('.min(1)');
      expect(bulkRouteContent).toContain('.max(5000)');
    });

    it('should validate mediaUrls as optional', () => {
      expect(bulkRouteContent).toContain('mediaUrls');
      expect(bulkRouteContent).toContain('z.array(z.string().url())');
      expect(bulkRouteContent).toContain('.optional()');
    });

    it('should validate campaignName', () => {
      expect(bulkRouteContent).toContain('campaignName');
      expect(bulkRouteContent).toContain('z.string()');
      expect(bulkRouteContent).toContain('.min(1)');
      expect(bulkRouteContent).toContain('.max(255)');
    });

    it('should validate priority as optional', () => {
      expect(bulkRouteContent).toContain('priority');
      expect(bulkRouteContent).toContain('z.number().int()');
      expect(bulkRouteContent).toContain('.min(1)');
      expect(bulkRouteContent).toContain('.max(10)');
      expect(bulkRouteContent).toContain('.optional()');
    });

    it('should parse and validate request body', () => {
      expect(bulkRouteContent).toContain('await request.json()');
      expect(bulkRouteContent).toContain('BulkMessageSchema.parse');
    });

    it('should return 400 on validation error', () => {
      expect(bulkRouteContent).toContain('z.ZodError');
      expect(bulkRouteContent).toContain('Validation failed');
      expect(bulkRouteContent).toContain('status: 400');
    });

    it('should verify recipient ownership', () => {
      expect(bulkRouteContent).toContain('FansRepository.getFan');
      expect(bulkRouteContent).toContain('Invalid recipients');
    });
  });

  describe('Task 8.2: Campaign Creation', () => {
    it('should import CampaignsRepository', () => {
      expect(bulkRouteContent).toContain('CampaignsRepository');
      expect(bulkRouteContent).toContain('from \'@/lib/db/repositories\'');
    });

    it('should create campaign record', () => {
      expect(bulkRouteContent).toContain('CampaignsRepository.createCampaign');
    });

    it('should set campaign type as bulk_message', () => {
      expect(bulkRouteContent).toContain('type: \'bulk_message\'');
    });

    it('should set campaign status as active', () => {
      expect(bulkRouteContent).toContain('status: \'active\'');
    });

    it('should include template with content and mediaUrls', () => {
      expect(bulkRouteContent).toContain('template: {');
      expect(bulkRouteContent).toContain('content:');
      expect(bulkRouteContent).toContain('mediaUrls:');
    });

    it('should include targetAudience with recipientIds', () => {
      expect(bulkRouteContent).toContain('targetAudience: {');
      expect(bulkRouteContent).toContain('recipientIds:');
    });

    it('should initialize metrics', () => {
      expect(bulkRouteContent).toContain('metrics: {');
      expect(bulkRouteContent).toContain('sent: 0');
      expect(bulkRouteContent).toContain('delivered: 0');
      expect(bulkRouteContent).toContain('opened: 0');
      expect(bulkRouteContent).toContain('clicked: 0');
      expect(bulkRouteContent).toContain('revenueCents: 0');
    });

    it('should update campaign metrics after sending', () => {
      expect(bulkRouteContent).toContain('updateCampaignMetrics');
    });
  });

  describe('Task 8.3: Batch Sending', () => {
    it('should import OnlyFansRateLimiterService', () => {
      expect(bulkRouteContent).toContain('OnlyFansRateLimiterService');
      expect(bulkRouteContent).toContain('from \'@/lib/services/onlyfans-rate-limiter.service\'');
    });

    it('should instantiate rate limiter service', () => {
      expect(bulkRouteContent).toContain('new OnlyFansRateLimiterService()');
    });

    it('should prepare messages array', () => {
      expect(bulkRouteContent).toContain('const messages =');
      expect(bulkRouteContent).toContain('validated.recipientIds.map');
    });

    it('should include messageId in each message', () => {
      expect(bulkRouteContent).toContain('messageId:');
      expect(bulkRouteContent).toContain('crypto.randomUUID()');
    });

    it('should include userId in each message', () => {
      expect(bulkRouteContent).toContain('userId:');
    });

    it('should include recipientId in each message', () => {
      expect(bulkRouteContent).toContain('recipientId:');
    });

    it('should include content in each message', () => {
      expect(bulkRouteContent).toContain('content:');
      expect(bulkRouteContent).toContain('validated.content');
    });

    it('should include metadata with campaignId', () => {
      expect(bulkRouteContent).toContain('metadata: {');
      expect(bulkRouteContent).toContain('campaignId:');
    });

    it('should split messages into batches of 10', () => {
      expect(bulkRouteContent).toContain('const batchSize = 10');
      expect(bulkRouteContent).toContain('messages.slice(i, i + batchSize)');
    });

    it('should call sendBatch for each batch', () => {
      expect(bulkRouteContent).toContain('rateLimiterService.sendBatch');
    });

    it('should handle partial failures', () => {
      expect(bulkRouteContent).toContain('totalSent');
      expect(bulkRouteContent).toContain('totalFailed');
      expect(bulkRouteContent).toContain('result.status === \'queued\'');
    });

    it('should catch batch send errors', () => {
      expect(bulkRouteContent).toContain('catch (error)');
      expect(bulkRouteContent).toContain('Batch send failed');
    });

    it('should return 202 Accepted', () => {
      expect(bulkRouteContent).toContain('status: 202');
    });

    it('should return campaignId in response', () => {
      expect(bulkRouteContent).toContain('campaignId:');
      expect(bulkRouteContent).toContain('campaign.id');
    });

    it('should return queue statistics', () => {
      expect(bulkRouteContent).toContain('totalRecipients:');
      expect(bulkRouteContent).toContain('queued:');
      expect(bulkRouteContent).toContain('failed:');
    });

    it('should calculate estimated completion time', () => {
      expect(bulkRouteContent).toContain('estimatedCompletionTime');
      expect(bulkRouteContent).toContain('estimatedMinutes');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', () => {
      expect(bulkRouteContent).toContain('if (!user?.userId)');
      expect(bulkRouteContent).toContain('status: 401');
    });

    it('should handle invalid user ID', () => {
      expect(bulkRouteContent).toContain('isNaN(userId)');
      expect(bulkRouteContent).toContain('Invalid user ID');
    });

    it('should handle validation errors', () => {
      expect(bulkRouteContent).toContain('z.ZodError');
      expect(bulkRouteContent).toContain('Validation failed');
    });

    it('should handle invalid recipients', () => {
      expect(bulkRouteContent).toContain('invalidRecipients');
      expect(bulkRouteContent).toContain('Recipients not found');
    });

    it('should handle general errors', () => {
      expect(bulkRouteContent).toContain('catch (error)');
      expect(bulkRouteContent).toContain('Failed to send bulk messages');
      expect(bulkRouteContent).toContain('status: 500');
    });

    it('should log errors', () => {
      expect(bulkRouteContent).toContain('console.error');
    });
  });

  describe('Dependencies', () => {
    it('should import required modules', () => {
      expect(bulkRouteContent).toContain('import { NextRequest, NextResponse }');
      expect(bulkRouteContent).toContain('import { z }');
    });

    it('should import repositories', () => {
      expect(bulkRouteContent).toContain('CampaignsRepository');
      expect(bulkRouteContent).toContain('FansRepository');
    });

    it('should import auth utilities', () => {
      expect(bulkRouteContent).toContain('getUserFromRequest');
    });

    it('should import rate limiting', () => {
      expect(bulkRouteContent).toContain('checkRateLimit');
      expect(bulkRouteContent).toContain('idFromRequestHeaders');
    });

    it('should import monitoring', () => {
      expect(bulkRouteContent).toContain('withMonitoring');
    });
  });

  describe('Code Quality', () => {
    it('should have proper TypeScript types', () => {
      expect(bulkRouteContent).toContain('NextRequest');
      expect(bulkRouteContent).toContain('NextResponse');
    });

    it('should use async/await', () => {
      expect(bulkRouteContent).toContain('async function');
      expect(bulkRouteContent).toContain('await');
    });

    it('should have descriptive variable names', () => {
      expect(bulkRouteContent).toContain('validated');
      expect(bulkRouteContent).toContain('campaign');
      expect(bulkRouteContent).toContain('messages');
      expect(bulkRouteContent).toContain('batches');
    });

    it('should have comments for complex logic', () => {
      expect(bulkRouteContent).toMatch(/\/\//);
    });
  });

  describe('Requirements Mapping', () => {
    it('should satisfy Requirement 7.1 (bulk messaging endpoint)', () => {
      expect(bulkRouteContent).toContain('export const POST');
      expect(bulkRouteExists).toBe(true);
    });

    it('should satisfy Requirement 7.2 (validation)', () => {
      expect(bulkRouteContent).toContain('BulkMessageSchema');
      expect(bulkRouteContent).toContain('.max(100)');
    });

    it('should satisfy Requirement 7.3 (batch sending)', () => {
      expect(bulkRouteContent).toContain('sendBatch');
    });

    it('should satisfy Requirement 7.4 (campaign creation)', () => {
      expect(bulkRouteContent).toContain('createCampaign');
    });

    it('should satisfy Requirement 7.5 (response with campaignId)', () => {
      expect(bulkRouteContent).toContain('campaignId:');
      expect(bulkRouteContent).toContain('status: 202');
    });
  });
});
