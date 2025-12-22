/**
 * Unit tests for GET /api/content/tasks
 * 
 * Tests:
 * - Filtering by status
 * - Filtering by platform
 * - Limit of results
 * - Sorting by date (DESC)
 * 
 * Requirements: 3.1, 3.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/content/tasks/route';
import { getPrismaClient } from '@/lib/db-client';

// Mock dependencies
vi.mock('@/lib/db-client');
vi.mock('@/lib/api/middleware/rate-limit', () => ({
  withRateLimit: (handler: any) => handler,
}));
vi.mock('@/lib/api/middleware/auth', () => ({
  withAuth: (handler: any) => handler,
  AuthenticatedRequest: {} as any,
}));

describe('GET /api/content/tasks', () => {
  let mockPrisma: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Prisma client
    mockPrisma = {
      contentTask: {
        findMany: vi.fn(),
      },
    };
    vi.mocked(getPrismaClient).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock request
  function createMockRequest(queryParams: Record<string, string> = {}, userId: string = '1') {
    const url = new URL('http://localhost:3000/api/content/tasks');
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return {
      url: url.toString(),
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

  // Helper to create mock task
  function createMockTask(overrides: any = {}) {
    return {
      id: 'task-123',
      userId: 1,
      platform: 'TIKTOK',
      status: 'PENDING',
      sourceType: 'UPLOAD',
      sourceUrl: null,
      assetKey: 'uploads/user1/video.mp4',
      caption: 'Test caption',
      hook: null,
      body: null,
      cta: null,
      trendLabel: null,
      scheduledAt: null,
      startedAt: null,
      postedAt: null,
      externalPostId: null,
      errorMessage: null,
      attemptCount: 0,
      createdAt: new Date('2025-01-15T10:00:00Z'),
      updatedAt: new Date('2025-01-15T10:00:00Z'),
      ...overrides,
    };
  }

  describe('Basic retrieval', () => {
    it('should retrieve all tasks for authenticated user', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', platform: 'TIKTOK' }),
        createMockTask({ id: 'task-2', platform: 'INSTAGRAM' }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest();
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tasks).toHaveLength(2);
      expect(data.data.tasks[0].id).toBe('task-1');
      expect(data.data.tasks[1].id).toBe('task-2');

      // Verify Prisma was called with correct parameters
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200, // Default limit
      });
    });

    it('should return empty array when no tasks exist', async () => {
      mockPrisma.contentTask.findMany.mockResolvedValue([]);

      const req = createMockRequest();
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tasks).toHaveLength(0);
    });

    it('should include all task fields in response', async () => {
      const mockTask = createMockTask({
        id: 'task-full',
        platform: 'INSTAGRAM',
        status: 'POSTED',
        sourceType: 'URL',
        sourceUrl: 'https://example.com/video.mp4',
        assetKey: null,
        caption: 'Full caption',
        hook: 'Hook text',
        body: 'Body text',
        cta: 'CTA text',
        trendLabel: '#trending',
        scheduledAt: new Date('2025-01-20T10:00:00Z'),
        startedAt: new Date('2025-01-20T10:05:00Z'),
        postedAt: new Date('2025-01-20T10:10:00Z'),
        externalPostId: 'ext-123',
        errorMessage: null,
        attemptCount: 1,
      });

      mockPrisma.contentTask.findMany.mockResolvedValue([mockTask]);

      const req = createMockRequest();
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.tasks[0]).toMatchObject({
        id: 'task-full',
        userId: 1,
        platform: 'INSTAGRAM',
        status: 'POSTED',
        sourceType: 'URL',
        sourceUrl: 'https://example.com/video.mp4',
        assetKey: null,
        caption: 'Full caption',
        hook: 'Hook text',
        body: 'Body text',
        cta: 'CTA text',
        trendLabel: '#trending',
        scheduledAt: '2025-01-20T10:00:00.000Z',
        startedAt: '2025-01-20T10:05:00.000Z',
        postedAt: '2025-01-20T10:10:00.000Z',
        externalPostId: 'ext-123',
        errorMessage: null,
        attemptCount: 1,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('Filtering by status', () => {
    it('should filter tasks by PENDING status', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', status: 'PENDING' }),
        createMockTask({ id: 'task-2', status: 'PENDING' }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({ status: 'PENDING' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tasks).toHaveLength(2);

      // Verify filter was applied
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200,
      });
    });

    it('should filter tasks by PROCESSING status', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', status: 'PROCESSING' }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({ status: 'PROCESSING' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PROCESSING',
          }),
        })
      );
    });

    it('should filter tasks by POSTED status', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', status: 'POSTED' }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({ status: 'POSTED' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'POSTED',
          }),
        })
      );
    });

    it('should filter tasks by FAILED status', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', status: 'FAILED' }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({ status: 'FAILED' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      );
    });

    it('should reject invalid status parameter', async () => {
      const req = createMockRequest({ status: 'INVALID_STATUS' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Invalid status parameter');
      expect(data.error.details.validStatuses).toEqual(['PENDING', 'PROCESSING', 'POSTED', 'FAILED']);

      // Should not call database
      expect(mockPrisma.contentTask.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Filtering by platform', () => {
    it('should filter tasks by TIKTOK platform', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', platform: 'TIKTOK' }),
        createMockTask({ id: 'task-2', platform: 'TIKTOK' }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({ platform: 'TIKTOK' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tasks).toHaveLength(2);

      // Verify filter was applied
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          platform: 'TIKTOK',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200,
      });
    });

    it('should filter tasks by INSTAGRAM platform', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', platform: 'INSTAGRAM' }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({ platform: 'INSTAGRAM' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            platform: 'INSTAGRAM',
          }),
        })
      );
    });

    it('should reject invalid platform parameter', async () => {
      const req = createMockRequest({ platform: 'INVALID_PLATFORM' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Invalid platform parameter');
      expect(data.error.details.validPlatforms).toEqual(['TIKTOK', 'INSTAGRAM']);

      // Should not call database
      expect(mockPrisma.contentTask.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Combined filters', () => {
    it('should filter by both status and platform', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', status: 'POSTED', platform: 'TIKTOK' }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({ status: 'POSTED', platform: 'TIKTOK' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify both filters were applied
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          status: 'POSTED',
          platform: 'TIKTOK',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200,
      });
    });

    it('should filter by status, platform, and limit', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({
        status: 'PENDING',
        platform: 'INSTAGRAM',
        limit: '50',
      });
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          status: 'PENDING',
          platform: 'INSTAGRAM',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });
    });
  });

  describe('Limit parameter', () => {
    it('should use default limit of 200 when not specified', async () => {
      mockPrisma.contentTask.findMany.mockResolvedValue([]);

      const req = createMockRequest();
      await GET(req);

      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 200,
        })
      );
    });

    it('should respect custom limit parameter', async () => {
      mockPrisma.contentTask.findMany.mockResolvedValue([]);

      const req = createMockRequest({ limit: '50' });
      await GET(req);

      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should accept limit of 1', async () => {
      mockPrisma.contentTask.findMany.mockResolvedValue([]);

      const req = createMockRequest({ limit: '1' });
      await GET(req);

      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        })
      );
    });

    it('should accept limit of 1000', async () => {
      mockPrisma.contentTask.findMany.mockResolvedValue([]);

      const req = createMockRequest({ limit: '1000' });
      await GET(req);

      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000,
        })
      );
    });

    it('should reject limit less than 1', async () => {
      const req = createMockRequest({ limit: '0' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Invalid limit parameter');
      expect(data.error.details.message).toBe('Limit must be between 1 and 1000');

      expect(mockPrisma.contentTask.findMany).not.toHaveBeenCalled();
    });

    it('should reject limit greater than 1000', async () => {
      const req = createMockRequest({ limit: '1001' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Invalid limit parameter');

      expect(mockPrisma.contentTask.findMany).not.toHaveBeenCalled();
    });

    it('should reject non-numeric limit', async () => {
      const req = createMockRequest({ limit: 'abc' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Invalid limit parameter');

      expect(mockPrisma.contentTask.findMany).not.toHaveBeenCalled();
    });

    it('should reject negative limit', async () => {
      const req = createMockRequest({ limit: '-10' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);

      expect(mockPrisma.contentTask.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Sorting by date', () => {
    it('should sort tasks by createdAt DESC', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-3', createdAt: new Date('2025-01-15T12:00:00Z') }),
        createMockTask({ id: 'task-2', createdAt: new Date('2025-01-15T11:00:00Z') }),
        createMockTask({ id: 'task-1', createdAt: new Date('2025-01-15T10:00:00Z') }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest();
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.tasks).toHaveLength(3);

      // Verify order is preserved (newest first)
      expect(data.data.tasks[0].id).toBe('task-3');
      expect(data.data.tasks[1].id).toBe('task-2');
      expect(data.data.tasks[2].id).toBe('task-1');

      // Verify orderBy was applied
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        })
      );
    });

    it('should maintain DESC order with filters', async () => {
      const mockTasks = [
        createMockTask({
          id: 'task-2',
          status: 'POSTED',
          createdAt: new Date('2025-01-15T11:00:00Z'),
        }),
        createMockTask({
          id: 'task-1',
          status: 'POSTED',
          createdAt: new Date('2025-01-15T10:00:00Z'),
        }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({ status: 'POSTED' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.tasks[0].id).toBe('task-2');
      expect(data.data.tasks[1].id).toBe('task-1');

      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          status: 'POSTED',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200,
      });
    });
  });

  describe('User isolation', () => {
    it('should only return tasks for authenticated user', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', userId: 42 }),
      ];

      mockPrisma.contentTask.findMany.mockResolvedValue(mockTasks);

      const req = createMockRequest({}, '42');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.tasks[0].userId).toBe(42);

      // Verify userId filter was applied
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 42,
          }),
        })
      );
    });

    it('should not return tasks from other users', async () => {
      mockPrisma.contentTask.findMany.mockResolvedValue([]);

      const req = createMockRequest({}, '1');
      await GET(req);

      // Verify only user 1's tasks are queried
      expect(mockPrisma.contentTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
          }),
        })
      );
    });
  });

  describe('Database errors', () => {
    it('should return 500 if database is unavailable', async () => {
      vi.mocked(getPrismaClient).mockReturnValue(null);

      const req = createMockRequest();
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Database unavailable');
    });

    it('should handle database query errors gracefully', async () => {
      mockPrisma.contentTask.findMany.mockRejectedValue(new Error('Database connection lost'));

      const req = createMockRequest();
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
