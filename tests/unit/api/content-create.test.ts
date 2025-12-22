/**
 * Unit tests for POST /api/content/create
 * 
 * Tests:
 * - Task creation with sourceType UPLOAD
 * - Task creation with sourceType URL
 * - Zod validation (invalid inputs)
 * - SQS enqueue after DB creation
 * - Rollback if SQS fails
 * 
 * Requirements: 1.1, 1.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/content/create/route';
import { getPrismaClient } from '@/lib/db-client';
import * as sqsModule from '@/lib/sqs';

// Mock dependencies
vi.mock('@/lib/db-client');
vi.mock('@/lib/sqs');
vi.mock('@/lib/api/middleware/rate-limit', () => ({
  withRateLimit: (handler: any) => handler,
}));
vi.mock('@/lib/api/middleware/auth', () => ({
  withAuth: (handler: any) => handler,
  AuthenticatedRequest: {} as any,
}));

describe('POST /api/content/create', () => {
  let mockPrisma: any;
  let mockEnqueuePostContent: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Prisma client
    mockPrisma = {
      contentTask: {
        create: vi.fn(),
        delete: vi.fn(),
      },
    };
    vi.mocked(getPrismaClient).mockReturnValue(mockPrisma);

    // Mock SQS enqueue
    mockEnqueuePostContent = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(sqsModule, 'enqueuePostContent').mockImplementation(mockEnqueuePostContent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock request
  function createMockRequest(body: any, userId: string = '1') {
    return {
      json: vi.fn().mockResolvedValue(body),
      headers: new Headers({
        'content-type': 'application/json',
      }),
      user: {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        onboardingCompleted: true,
      },
    } as any;
  }

  describe('Task creation with sourceType UPLOAD', () => {
    it('should create task with UPLOAD sourceType and assetKey', async () => {
      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Check this out! #viral',
          hook: '🔥 Amazing content',
          body: 'This is the main content',
          cta: 'Follow for more!',
        },
        trendLabel: '#trending',
      };

      const mockTask = {
        id: 'task-123',
        userId: 1,
        platform: 'TIKTOK',
        status: 'PENDING',
        sourceType: 'UPLOAD',
        sourceUrl: null,
        assetKey: 'uploads/user1/video.mp4',
        caption: 'Check this out! #viral',
        hook: '🔥 Amazing content',
        body: 'This is the main content',
        cta: 'Follow for more!',
        trendLabel: '#trending',
        scheduledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        postedAt: null,
        externalPostId: null,
        errorMessage: null,
        attemptCount: 0,
      };

      mockPrisma.contentTask.create.mockResolvedValue(mockTask);

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.tasks).toHaveLength(1);
      expect(data.data.tasks[0]).toMatchObject({
        id: 'task-123',
        platform: 'TIKTOK',
        status: 'PENDING',
        sourceType: 'UPLOAD',
        assetKey: 'uploads/user1/video.mp4',
        caption: 'Check this out! #viral',
      });

      // Verify DB create was called
      expect(mockPrisma.contentTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          platform: 'TIKTOK',
          status: 'PENDING',
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        }),
      });

      // Verify SQS enqueue was called
      expect(mockEnqueuePostContent).toHaveBeenCalledWith('task-123');
    });

    it('should create tasks for multiple platforms', async () => {
      const requestBody = {
        platforms: ['TIKTOK', 'INSTAGRAM'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Multi-platform post',
        },
      };

      const mockTikTokTask = {
        id: 'task-tiktok',
        userId: 1,
        platform: 'TIKTOK',
        status: 'PENDING',
        sourceType: 'UPLOAD',
        assetKey: 'uploads/user1/video.mp4',
        caption: 'Multi-platform post',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInstagramTask = {
        id: 'task-instagram',
        userId: 1,
        platform: 'INSTAGRAM',
        status: 'PENDING',
        sourceType: 'UPLOAD',
        assetKey: 'uploads/user1/video.mp4',
        caption: 'Multi-platform post',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.contentTask.create
        .mockResolvedValueOnce(mockTikTokTask)
        .mockResolvedValueOnce(mockInstagramTask);

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.tasks).toHaveLength(2);
      expect(data.data.tasks[0].platform).toBe('TIKTOK');
      expect(data.data.tasks[1].platform).toBe('INSTAGRAM');

      // Verify both tasks were enqueued
      expect(mockEnqueuePostContent).toHaveBeenCalledTimes(2);
      expect(mockEnqueuePostContent).toHaveBeenCalledWith('task-tiktok');
      expect(mockEnqueuePostContent).toHaveBeenCalledWith('task-instagram');
    });
  });

  describe('Task creation with sourceType URL', () => {
    it('should create task with URL sourceType and sourceUrl', async () => {
      const requestBody = {
        platforms: ['INSTAGRAM'],
        asset: {
          sourceType: 'URL',
          sourceUrl: 'https://example.com/video.mp4',
        },
        script: {
          caption: 'Video from URL',
        },
      };

      const mockTask = {
        id: 'task-456',
        userId: 1,
        platform: 'INSTAGRAM',
        status: 'PENDING',
        sourceType: 'URL',
        sourceUrl: 'https://example.com/video.mp4',
        assetKey: null,
        caption: 'Video from URL',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.contentTask.create.mockResolvedValue(mockTask);

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.tasks[0]).toMatchObject({
        sourceType: 'URL',
        sourceUrl: 'https://example.com/video.mp4',
        assetKey: null,
      });

      // Verify DB create was called with correct data
      expect(mockPrisma.contentTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceType: 'URL',
          sourceUrl: 'https://example.com/video.mp4',
          assetKey: null,
        }),
      });
    });
  });

  describe('Zod validation', () => {
    it('should reject request with no platforms', async () => {
      const requestBody = {
        platforms: [],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Test',
        },
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BAD_REQUEST');
      expect(data.error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'platforms',
            message: 'At least one platform is required',
          }),
        ])
      );
    });

    it('should reject UPLOAD without assetKey', async () => {
      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          // Missing assetKey
        },
        script: {
          caption: 'Test',
        },
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('assetKey is required for UPLOAD'),
          }),
        ])
      );
    });

    it('should reject URL without sourceUrl', async () => {
      const requestBody = {
        platforms: ['INSTAGRAM'],
        asset: {
          sourceType: 'URL',
          // Missing sourceUrl
        },
        script: {
          caption: 'Test',
        },
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('sourceUrl is required for URL'),
          }),
        ])
      );
    });

    it('should reject invalid sourceUrl format', async () => {
      const requestBody = {
        platforms: ['INSTAGRAM'],
        asset: {
          sourceType: 'URL',
          sourceUrl: 'not-a-valid-url',
        },
        script: {
          caption: 'Test',
        },
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject empty caption', async () => {
      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: '',
        },
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'script.caption',
            message: 'Caption is required',
          }),
        ])
      );
    });

    it('should reject caption that is too long', async () => {
      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'a'.repeat(2201), // Exceeds 2200 char limit
        },
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'script.caption',
            message: 'Caption too long',
          }),
        ])
      );
    });

    it('should reject invalid platform', async () => {
      const requestBody = {
        platforms: ['INVALID_PLATFORM'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Test',
        },
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject invalid scheduledAt format', async () => {
      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Test',
        },
        scheduledAt: 'not-a-date',
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('SQS enqueue after DB creation', () => {
    it('should enqueue task to SQS after successful DB creation', async () => {
      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Test',
        },
      };

      const mockTask = {
        id: 'task-789',
        userId: 1,
        platform: 'TIKTOK',
        status: 'PENDING',
        sourceType: 'UPLOAD',
        assetKey: 'uploads/user1/video.mp4',
        caption: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.contentTask.create.mockResolvedValue(mockTask);

      const req = createMockRequest(requestBody);
      const response = await POST(req);

      expect(response.status).toBe(201);

      // Verify enqueue was called with correct taskId
      expect(mockEnqueuePostContent).toHaveBeenCalledWith('task-789');
      expect(mockEnqueuePostContent).toHaveBeenCalledTimes(1);
    });

    it('should enqueue all tasks in order', async () => {
      const requestBody = {
        platforms: ['TIKTOK', 'INSTAGRAM'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Test',
        },
      };

      mockPrisma.contentTask.create
        .mockResolvedValueOnce({
          id: 'task-1',
          platform: 'TIKTOK',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'task-2',
          platform: 'INSTAGRAM',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const req = createMockRequest(requestBody);
      await POST(req);

      // Verify both tasks were enqueued
      expect(mockEnqueuePostContent).toHaveBeenNthCalledWith(1, 'task-1');
      expect(mockEnqueuePostContent).toHaveBeenNthCalledWith(2, 'task-2');
    });
  });

  describe('Rollback if SQS fails', () => {
    it('should delete task from DB if SQS enqueue fails', async () => {
      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Test',
        },
      };

      const mockTask = {
        id: 'task-rollback',
        userId: 1,
        platform: 'TIKTOK',
        status: 'PENDING',
        sourceType: 'UPLOAD',
        assetKey: 'uploads/user1/video.mp4',
        caption: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.contentTask.create.mockResolvedValue(mockTask);
      mockEnqueuePostContent.mockRejectedValue(new Error('SQS unavailable'));

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      // Should return error since all platforms failed
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);

      // Verify task was deleted (rollback)
      expect(mockPrisma.contentTask.delete).toHaveBeenCalledWith({
        where: { id: 'task-rollback' },
      });
    });

    it('should rollback only failed platforms in multi-platform request', async () => {
      const requestBody = {
        platforms: ['TIKTOK', 'INSTAGRAM'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Test',
        },
      };

      const mockTikTokTask = {
        id: 'task-tiktok-success',
        platform: 'TIKTOK',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInstagramTask = {
        id: 'task-instagram-fail',
        platform: 'INSTAGRAM',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.contentTask.create
        .mockResolvedValueOnce(mockTikTokTask)
        .mockResolvedValueOnce(mockInstagramTask);

      // TikTok succeeds, Instagram fails
      mockEnqueuePostContent
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('SQS error'));

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      // Should succeed with warning
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.tasks).toHaveLength(1);
      expect(data.data.tasks[0].id).toBe('task-tiktok-success');
      expect(data.data.warnings).toBeDefined();
      expect(data.data.warnings[0].failedPlatforms).toContain('INSTAGRAM');

      // Verify only failed task was deleted
      expect(mockPrisma.contentTask.delete).toHaveBeenCalledWith({
        where: { id: 'task-instagram-fail' },
      });
      expect(mockPrisma.contentTask.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle DB creation failure gracefully', async () => {
      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Test',
        },
      };

      mockPrisma.contentTask.create.mockRejectedValue(new Error('DB error'));

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);

      // Should not attempt to enqueue if DB creation failed
      expect(mockEnqueuePostContent).not.toHaveBeenCalled();
    });
  });

  describe('Scheduled tasks', () => {
    it('should create task with scheduledAt timestamp', async () => {
      const scheduledDate = new Date('2025-12-31T10:00:00Z');
      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Scheduled post',
        },
        scheduledAt: scheduledDate.toISOString(),
      };

      const mockTask = {
        id: 'task-scheduled',
        userId: 1,
        platform: 'TIKTOK',
        status: 'PENDING',
        sourceType: 'UPLOAD',
        assetKey: 'uploads/user1/video.mp4',
        caption: 'Scheduled post',
        scheduledAt: scheduledDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.contentTask.create.mockResolvedValue(mockTask);

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.tasks[0].scheduledAt).toBe(scheduledDate.toISOString());

      // Verify DB create was called with scheduledAt
      expect(mockPrisma.contentTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          scheduledAt: scheduledDate,
        }),
      });
    });
  });

  describe('Database unavailable', () => {
    it('should return 500 if database is unavailable', async () => {
      vi.mocked(getPrismaClient).mockReturnValue(null);

      const requestBody = {
        platforms: ['TIKTOK'],
        asset: {
          sourceType: 'UPLOAD',
          assetKey: 'uploads/user1/video.mp4',
        },
        script: {
          caption: 'Test',
        },
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Database unavailable');
    });
  });
});
