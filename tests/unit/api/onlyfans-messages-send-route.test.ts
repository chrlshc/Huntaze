/**
 * Unit Tests - OnlyFans Messages Send API Route
 * Tests for Task 4: POST /api/onlyfans/messages/send
 * 
 * Coverage:
 * - Authentication validation
 * - Request body validation
 * - Rate limiter status checks
 * - Success responses (HTTP 202)
 * - Error responses (HTTP 400, 401, 500, 503)
 * - Logging and metrics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/onlyfans/messages/send/route';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/services/onlyfans-rate-limiter.service', () => ({
  createOnlyFansRateLimiterService: vi.fn(),
  OnlyFansMessageSchema: {},
}));

vi.mock('@/lib/services/intelligent-queue-manager', () => ({
  getIntelligentQueueManager: vi.fn(),
}));

vi.mock('@/lib/services/cloudwatch-metrics.service', () => ({
  CloudWatchMetricsService: vi.fn(),
}));

vi.mock('@/lib/config/rate-limiter.config', () => ({
  getRateLimiterStatus: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({})),
}));

import { getServerSession } from 'next-auth';
import { createOnlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';
import { getIntelligentQueueManager } from '@/lib/services/intelligent-queue-manager';
import { getRateLimiterStatus } from '@/lib/config/rate-limiter.config';

describe('POST /api/onlyfans/messages/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session exists but user is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        expires: '2025-12-31',
      } as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should proceed when user is authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      } as any);

      vi.mocked(getRateLimiterStatus).mockReturnValue({
        configured: false,
        enabled: false,
        active: false,
        queueUrl: '',
        region: 'us-east-1',
        features: {},
      } as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);

      expect(response.status).not.toBe(401);
    });
  });

  describe('Rate Limiter Status Check', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      } as any);
    });

    it('should return 503 when rate limiter is not active', async () => {
      vi.mocked(getRateLimiterStatus).mockReturnValue({
        configured: true,
        enabled: false,
        active: false,
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
        region: 'us-east-1',
        features: {},
      } as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Rate limiter service unavailable');
      expect(console.warn).toHaveBeenCalledWith(
        '[API] Rate limiter not active',
        expect.any(Object)
      );
    });

    it('should return 503 when rate limiter is not configured', async () => {
      vi.mocked(getRateLimiterStatus).mockReturnValue({
        configured: false,
        enabled: true,
        active: false,
        queueUrl: '',
        region: 'us-east-1',
        features: {},
      } as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
    });

    it('should proceed when rate limiter is active', async () => {
      vi.mocked(getRateLimiterStatus).mockReturnValue({
        configured: true,
        enabled: true,
        active: true,
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
        region: 'us-east-1',
        features: {},
      } as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);

      expect(response.status).not.toBe(503);
    });
  });

  describe('Request Body Validation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      } as any);

      vi.mocked(getRateLimiterStatus).mockReturnValue({
        configured: true,
        enabled: true,
        active: true,
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
        region: 'us-east-1',
        features: {},
      } as any);
    });

    it('should return 400 when recipientId is missing', async () => {
      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'recipientId',
            message: expect.stringContaining('required'),
          }),
        ])
      );
    });

    it('should return 400 when content is missing', async () => {
      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when content is too long', async () => {
      const longContent = 'a'.repeat(10001);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: longContent,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'content',
            message: expect.stringContaining('too long'),
          }),
        ])
      );
    });

    it('should return 400 when mediaUrls contains invalid URLs', async () => {
      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
          mediaUrls: ['not-a-url', 'also-invalid'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 when priority is invalid', async () => {
      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
          priority: 'invalid',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should accept valid request with all fields', async () => {
      const mockService = {
        sendMessage: vi.fn().mockResolvedValue({
          success: true,
          messageId: 'msg-123',
          queuedAt: new Date(),
          sqsMessageId: 'sqs-456',
        }),
      };

      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);
      vi.mocked(getIntelligentQueueManager).mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
          mediaUrls: ['https://example.com/image.jpg'],
          priority: 'high',
          metadata: { campaignId: 'campaign-789' },
        }),
      });

      const response = await POST(request);

      expect(response.status).not.toBe(400);
    });
  });

  describe('Success Response', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      } as any);

      vi.mocked(getRateLimiterStatus).mockReturnValue({
        configured: true,
        enabled: true,
        active: true,
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
        region: 'us-east-1',
        features: {},
      } as any);

      vi.mocked(getIntelligentQueueManager).mockResolvedValue({} as any);
    });

    it('should return 202 when message is queued successfully', async () => {
      const queuedAt = new Date('2025-10-29T10:00:00Z');

      const mockService = {
        sendMessage: vi.fn().mockResolvedValue({
          success: true,
          messageId: 'msg-123',
          queuedAt,
          sqsMessageId: 'sqs-456',
        }),
      };

      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.success).toBe(true);
      expect(data.messageId).toBe('msg-123');
      expect(data.queuedAt).toBe(queuedAt.toISOString());
      expect(data.sqsMessageId).toBe('sqs-456');
      expect(data.estimatedDelivery).toBeDefined();
    });

    it('should calculate estimated delivery time (+1 minute)', async () => {
      const queuedAt = new Date('2025-10-29T10:00:00Z');

      const mockService = {
        sendMessage: vi.fn().mockResolvedValue({
          success: true,
          messageId: 'msg-123',
          queuedAt,
        }),
      };

      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const estimatedDelivery = new Date(data.estimatedDelivery);
      const expectedDelivery = new Date(queuedAt.getTime() + 60000);

      expect(estimatedDelivery.getTime()).toBe(expectedDelivery.getTime());
    });

    it('should log successful request', async () => {
      const mockService = {
        sendMessage: vi.fn().mockResolvedValue({
          success: true,
          messageId: 'msg-123',
          queuedAt: new Date(),
          sqsMessageId: 'sqs-456',
        }),
      };

      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      await POST(request);

      expect(console.info).toHaveBeenCalledWith(
        '[API] Message send request processed',
        expect.objectContaining({
          userId: 'user-123',
          messageId: 'msg-123',
          recipientId: 'recipient-123',
          success: true,
          sqsMessageId: 'sqs-456',
        })
      );
    });
  });

  describe('Error Response', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      } as any);

      vi.mocked(getRateLimiterStatus).mockReturnValue({
        configured: true,
        enabled: true,
        active: true,
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
        region: 'us-east-1',
        features: {},
      } as any);

      vi.mocked(getIntelligentQueueManager).mockResolvedValue({} as any);
    });

    it('should return 500 when service returns failure', async () => {
      const mockService = {
        sendMessage: vi.fn().mockResolvedValue({
          success: false,
          messageId: 'msg-123',
          queuedAt: new Date(),
          error: 'SQS unavailable',
        }),
      };

      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('SQS unavailable');
      expect(data.messageId).toBe('msg-123');
    });

    it('should return 500 when service throws error', async () => {
      const mockService = {
        sendMessage: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };

      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Unexpected error');
    });

    it('should log errors', async () => {
      const mockService = {
        sendMessage: vi.fn().mockRejectedValue(new Error('Test error')),
      };

      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      await POST(request);

      expect(console.error).toHaveBeenCalledWith(
        '[API] Unexpected error in message send',
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
        })
      );
    });

    it('should include fallbackUsed flag in error response', async () => {
      const mockService = {
        sendMessage: vi.fn().mockResolvedValue({
          success: false,
          messageId: 'msg-123',
          queuedAt: new Date(),
          error: 'SQS unavailable',
          fallbackUsed: true,
        }),
      };

      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.fallbackUsed).toBe(true);
    });
  });

  describe('Service Integration', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      } as any);

      vi.mocked(getRateLimiterStatus).mockReturnValue({
        configured: true,
        enabled: true,
        active: true,
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
        region: 'us-east-1',
        features: {},
      } as any);
    });

    it('should initialize services correctly', async () => {
      const mockQueueManager = {};
      const mockService = {
        sendMessage: vi.fn().mockResolvedValue({
          success: true,
          messageId: 'msg-123',
          queuedAt: new Date(),
        }),
      };

      vi.mocked(getIntelligentQueueManager).mockResolvedValue(mockQueueManager as any);
      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
        }),
      });

      await POST(request);

      expect(getIntelligentQueueManager).toHaveBeenCalled();
      expect(createOnlyFansRateLimiterService).toHaveBeenCalledWith(
        mockQueueManager,
        expect.any(Object), // PrismaClient
        expect.any(Object)  // CloudWatchMetricsService
      );
    });

    it('should call sendMessage with correct parameters', async () => {
      const mockService = {
        sendMessage: vi.fn().mockResolvedValue({
          success: true,
          messageId: 'msg-123',
          queuedAt: new Date(),
        }),
      };

      vi.mocked(getIntelligentQueueManager).mockResolvedValue({} as any);
      vi.mocked(createOnlyFansRateLimiterService).mockReturnValue(mockService as any);

      const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: 'recipient-123',
          content: 'Test message',
          mediaUrls: ['https://example.com/image.jpg'],
          priority: 'high',
        }),
      });

      await POST(request);

      expect(mockService.sendMessage).toHaveBeenCalledWith('user-123', {
        recipientId: 'recipient-123',
        content: 'Test message',
        mediaUrls: ['https://example.com/image.jpg'],
        priority: 'high',
      });
    });
  });
});

describe('GET /api/onlyfans/messages/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return rate limiter status', async () => {
    vi.mocked(getRateLimiterStatus).mockReturnValue({
      configured: true,
      enabled: true,
      active: true,
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
      region: 'us-east-1',
      features: {
        circuitBreaker: true,
        fallbackToDb: true,
        metrics: true,
      },
    } as any);

    const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.configured).toBe(true);
    expect(data.enabled).toBe(true);
    expect(data.active).toBe(true);
    expect(data.queueUrl).toBe('https://sqs.us-east-1.amazonaws.com/123/queue');
    expect(data.region).toBe('us-east-1');
    expect(data.features).toEqual({
      circuitBreaker: true,
      fallbackToDb: true,
      metrics: true,
    });
  });

  it('should return 500 when getRateLimiterStatus throws error', async () => {
    vi.mocked(getRateLimiterStatus).mockImplementation(() => {
      throw new Error('Configuration error');
    });

    const request = new NextRequest('http://localhost/api/onlyfans/messages/send', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to get status');
    expect(data.details).toBe('Configuration error');
  });
});
