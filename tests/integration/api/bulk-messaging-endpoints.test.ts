/**
 * Integration Tests - Bulk Messaging API Endpoints
 * 
 * Tests for /api/messages/bulk endpoint
 * Based on: .kiro/specs/onlyfans-crm-integration/tasks.md (Task 8)
 * 
 * Coverage:
 * - POST /api/messages/bulk - Send bulk messages
 * - Authentication and authorization
 * - Request validation
 * - Campaign creation
 * - Batch message sending
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/request', () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock('@/src/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  idFromRequestHeaders: vi.fn(),
}));

vi.mock('@/lib/db/repositories', () => ({
  CampaignsRepository: {
    createCampaign: vi.fn(),
    updateCampaignMetrics: vi.fn(),
  },
  FansRepository: {
    getFan: vi.fn(),
  },
}));

vi.mock('@/lib/services/onlyfans-rate-limiter.service', () => ({
  OnlyFansRateLimiterService: vi.fn().mockImplementation(() => ({
    sendBatch: vi.fn(),
  })),
}));

vi.mock('@/lib/observability/bootstrap', () => ({
  withMonitoring: vi.fn((name, handler) => handler),
}));

import { getUserFromRequest } from '@/lib/auth/request';
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit';
import { CampaignsRepository, FansRepository } from '@/lib/db/repositories';
import { OnlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';

describe('POST /api/messages/bulk - Integration Tests', () => {
  let mockRequest: any;
  let mockGetUserFromRequest: any;
  let mockCheckRateLimit: any;
  let mockIdFromRequestHeaders: any;
  let mockCreateCampaign: any;
  let mockUpdateCampaignMetrics: any;
  let mockGetFan: any;
  let mockSendBatch: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock functions
    mockGetUserFromRequest = getUserFromRequest as any;
    mockCheckRateLimit = checkRateLimit as any;
    mockIdFromRequestHeaders = idFromRequestHeaders as any;
    mockCreateCampaign = CampaignsRepository.createCampaign as any;
    mockUpdateCampaignMetrics = CampaignsRepository.updateCampaignMetrics as any;
    mockGetFan = FansRepository.getFan as any;

    // Setup default mock implementations
    mockIdFromRequestHeaders.mockReturnValue({ id: 'test-id' });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockGetUserFromRequest.mockResolvedValue({ userId: '123' });
    mockGetFan.mockResolvedValue({ id: 1, name: 'Test Fan' });
    mockCreateCampaign.mockResolvedValue({
      id: 1,
      name: 'Test Campaign',
      type: 'bulk_message',
      status: 'active',
    });
    mockUpdateCampaignMetrics.mockResolvedValue(true);

    // Mock OnlyFansRateLimiterService
    mockSendBatch = vi.fn().mockResolvedValue([
      { messageId: '1', status: 'queued' },
      { messageId: '2', status: 'queued' },
    ]);
    (OnlyFansRateLimiterService as any).mockImplementation(() => ({
      sendBatch: mockSendBatch,
    }));

    // Create mock request
    mockRequest = {
      headers: new Map([['x-user-id', '123']]),
      json: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      mockGetUserFromRequest.mockResolvedValue(null);
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should validate user ID format', async () => {
      mockGetUserFromRequest.mockResolvedValue({ userId: 'invalid' });
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid user ID');
    });

    it('should extract userId from JWT', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      expect(mockGetUserFromRequest).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit (5 per hour)', async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: false });
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
    });

    it('should check rate limit with correct parameters', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        id: 'test-id',
        limit: 5,
        windowSec: 3600,
      });
    });
  });

  describe('Request Validation', () => {
    it('should validate recipientIds array (min 1)', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should validate recipientIds array (max 100)', async () => {
      const recipientIds = Array.from({ length: 101 }, (_, i) => i + 1);
      mockRequest.json.mockResolvedValue({
        recipientIds,
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should validate content (min 1 char)', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: '',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should validate content (max 5000 chars)', async () => {
      const longContent = 'a'.repeat(5001);
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: longContent,
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should validate campaignName (required)', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should validate mediaUrls format (optional)', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
        mediaUrls: ['not-a-url'],
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should validate priority range (1-10)', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
        priority: 11,
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should accept valid request', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
        mediaUrls: ['https://example.com/image.jpg'],
        priority: 5,
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);

      expect(response.status).toBe(202);
    });
  });

  describe('Recipient Verification', () => {
    it('should verify all recipients belong to user', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2, 3],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      expect(mockGetFan).toHaveBeenCalledTimes(3);
      expect(mockGetFan).toHaveBeenCalledWith(123, 1);
      expect(mockGetFan).toHaveBeenCalledWith(123, 2);
      expect(mockGetFan).toHaveBeenCalledWith(123, 3);
    });

    it('should reject if any recipient not found', async () => {
      mockGetFan.mockImplementation((userId: number, fanId: number) => {
        if (fanId === 2) return null;
        return { id: fanId, name: `Fan ${fanId}` };
      });

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2, 3],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid recipients');
      expect(data.details).toContain('2');
    });

    it('should reject if recipient belongs to different user', async () => {
      mockGetFan.mockResolvedValue(null);

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid recipients');
    });
  });

  describe('Campaign Creation', () => {
    it('should create campaign with correct data', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
        mediaUrls: ['https://example.com/image.jpg'],
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      expect(mockCreateCampaign).toHaveBeenCalledWith(123, {
        name: 'Test Campaign',
        type: 'bulk_message',
        status: 'active',
        template: {
          content: 'Test message',
          mediaUrls: ['https://example.com/image.jpg'],
        },
        targetAudience: {
          recipientIds: [1, 2],
        },
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          revenueCents: 0,
        },
      });
    });

    it('should handle empty mediaUrls', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      expect(mockCreateCampaign).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          template: expect.objectContaining({
            mediaUrls: [],
          }),
        })
      );
    });
  });

  describe('Batch Message Sending', () => {
    it('should split messages into batches of 10', async () => {
      const recipientIds = Array.from({ length: 25 }, (_, i) => i + 1);
      mockRequest.json.mockResolvedValue({
        recipientIds,
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      // Should call sendBatch 3 times (10 + 10 + 5)
      expect(mockSendBatch).toHaveBeenCalledTimes(3);
    });

    it('should include all required fields in messages', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
        mediaUrls: ['https://example.com/image.jpg'],
        priority: 7,
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      const sentMessages = mockSendBatch.mock.calls[0][0];
      expect(sentMessages).toHaveLength(2);
      expect(sentMessages[0]).toMatchObject({
        userId: '123',
        recipientId: '1',
        content: 'Test message',
        mediaUrls: ['https://example.com/image.jpg'],
        priority: 7,
      });
      expect(sentMessages[0].messageId).toBeTruthy();
      expect(sentMessages[0].metadata.campaignId).toBeTruthy();
    });

    it('should use default priority if not provided', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      const sentMessages = mockSendBatch.mock.calls[0][0];
      expect(sentMessages[0].priority).toBe(5);
    });

    it('should handle partial batch failures', async () => {
      mockSendBatch.mockResolvedValue([
        { messageId: '1', status: 'queued' },
        { messageId: '2', status: 'failed', error: 'SQS error' },
      ]);

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.queued).toBe(1);
      expect(data.failed).toBe(1);
    });

    it('should handle complete batch failure', async () => {
      mockSendBatch.mockRejectedValue(new Error('SQS unavailable'));

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.queued).toBe(0);
      expect(data.failed).toBe(2);
    });
  });

  describe('Campaign Metrics Update', () => {
    it('should update campaign metrics after sending', async () => {
      mockSendBatch.mockResolvedValue([
        { messageId: '1', status: 'queued' },
        { messageId: '2', status: 'queued' },
      ]);

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      expect(mockUpdateCampaignMetrics).toHaveBeenCalledWith(1, {
        sent: 2,
        delivered: 0,
        opened: 0,
        clicked: 0,
        revenueCents: 0,
      });
    });

    it('should update with correct sent count on partial failure', async () => {
      mockSendBatch.mockResolvedValue([
        { messageId: '1', status: 'queued' },
        { messageId: '2', status: 'failed' },
      ]);

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      expect(mockUpdateCampaignMetrics).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sent: 1,
        })
      );
    });
  });

  describe('Response Format', () => {
    it('should return 202 Accepted', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);

      expect(response.status).toBe(202);
    });

    it('should return campaignId', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.campaignId).toBe(1);
    });

    it('should return queue statistics', async () => {
      mockSendBatch.mockResolvedValue([
        { messageId: '1', status: 'queued' },
        { messageId: '2', status: 'queued' },
      ]);

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.totalRecipients).toBe(2);
      expect(data.queued).toBe(2);
      expect(data.failed).toBe(0);
      expect(data.status).toBe('queued');
    });

    it('should return estimated completion time', async () => {
      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2, 3, 4, 5],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.estimatedCompletionTime).toBeTruthy();
      expect(new Date(data.estimatedCompletionTime)).toBeInstanceOf(Date);
    });

    it('should calculate completion time based on 10 messages per minute', async () => {
      const recipientIds = Array.from({ length: 30 }, (_, i) => i + 1);
      mockRequest.json.mockResolvedValue({
        recipientIds,
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const beforeTime = Date.now();
      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      const completionTime = new Date(data.estimatedCompletionTime).getTime();
      const expectedMinutes = Math.ceil(30 / 10); // 3 minutes
      const expectedTime = beforeTime + expectedMinutes * 60 * 1000;

      // Allow 1 second tolerance
      expect(Math.abs(completionTime - expectedTime)).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle campaign creation failure', async () => {
      mockCreateCampaign.mockRejectedValue(new Error('Database error'));

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to send bulk messages');
    });

    it('should handle rate limiter service instantiation failure', async () => {
      (OnlyFansRateLimiterService as any).mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to send bulk messages');
    });

    it('should log errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateCampaign.mockRejectedValue(new Error('Test error'));

      mockRequest.json.mockResolvedValue({
        recipientIds: [1, 2],
        content: 'Test message',
        campaignName: 'Test Campaign',
      });

      const { POST } = await import('@/app/api/messages/bulk/route');
      await POST(mockRequest);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
