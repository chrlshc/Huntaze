/**
 * Content Service - Unit Tests
 * 
 * Tests core business logic for content management
 * Requirements: 7.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentService } from '@/lib/api/services/content.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    content: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ContentService', () => {
  let service: ContentService;
  const mockUserId = 123;

  beforeEach(() => {
    service = new ContentService();
    vi.clearAllMocks();
  });

  describe('listContent', () => {
    it('should list content with pagination', async () => {
      const mockContent = [
        {
          id: '1',
          userId: mockUserId,
          title: 'Test Content',
          type: 'image',
          platform: 'instagram',
          status: 'draft',
          tags: [],
          mediaIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.content.findMany).mockResolvedValue(mockContent as any);
      vi.mocked(prisma.content.count).mockResolvedValue(1);

      const result = await service.listContent({
        userId: mockUserId,
        limit: 10,
        offset: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.content.findMany).mockResolvedValue([]);
      vi.mocked(prisma.content.count).mockResolvedValue(0);

      await service.listContent({
        userId: mockUserId,
        status: 'published',
      });

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
        })
      );
    });

    it('should validate limit bounds', async () => {
      await expect(
        service.listContent({
          userId: mockUserId,
          limit: 0,
        })
      ).rejects.toThrow('Limit must be between 1 and 100');
    });
  });

  describe('createContent', () => {
    it('should create content with valid data', async () => {
      const mockContent = {
        id: '1',
        userId: mockUserId,
        title: 'New Content',
        type: 'image',
        platform: 'instagram',
        status: 'draft',
        tags: [],
        mediaIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.content.create).mockResolvedValue(mockContent as any);

      const result = await service.createContent(mockUserId, {
        title: 'New Content',
        type: 'image',
        platform: 'instagram',
        status: 'draft',
      });

      expect(result.title).toBe('New Content');
      expect(prisma.content.create).toHaveBeenCalled();
    });

    it('should reject empty title', async () => {
      await expect(
        service.createContent(mockUserId, {
          title: '',
          type: 'image',
          platform: 'instagram',
          status: 'draft',
        })
      ).rejects.toThrow('Title is required');
    });

    it('should reject title over 200 characters', async () => {
      await expect(
        service.createContent(mockUserId, {
          title: 'a'.repeat(201),
          type: 'image',
          platform: 'instagram',
          status: 'draft',
        })
      ).rejects.toThrow('Title must be 200 characters or less');
    });
  });

  describe('updateContent', () => {
    it('should update content with ownership verification', async () => {
      const mockContent = {
        id: '1',
        userId: mockUserId,
        title: 'Original',
        status: 'draft',
      };

      vi.mocked(prisma.content.findFirst).mockResolvedValue(mockContent as any);
      vi.mocked(prisma.content.update).mockResolvedValue({
        ...mockContent,
        title: 'Updated',
      } as any);

      const result = await service.updateContent(mockUserId, '1', {
        title: 'Updated',
      });

      expect(result.title).toBe('Updated');
    });

    it('should reject update for non-existent content', async () => {
      vi.mocked(prisma.content.findFirst).mockResolvedValue(null);

      await expect(
        service.updateContent(mockUserId, 'non-existent', { title: 'Updated' })
      ).rejects.toThrow('Content not found or access denied');
    });

    it('should set publishedAt when status changes to published', async () => {
      const mockContent = {
        id: '1',
        userId: mockUserId,
        status: 'draft',
      };

      vi.mocked(prisma.content.findFirst).mockResolvedValue(mockContent as any);
      vi.mocked(prisma.content.update).mockResolvedValue({
        ...mockContent,
        status: 'published',
        publishedAt: new Date(),
      } as any);

      await service.updateContent(mockUserId, '1', { status: 'published' });

      expect(prisma.content.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publishedAt: expect.any(Date) }),
        })
      );
    });
  });

  describe('deleteContent', () => {
    it('should delete content with ownership verification', async () => {
      const mockContent = {
        id: '1',
        userId: mockUserId,
      };

      vi.mocked(prisma.content.findFirst).mockResolvedValue(mockContent as any);
      vi.mocked(prisma.content.delete).mockResolvedValue(mockContent as any);

      await service.deleteContent(mockUserId, '1');

      expect(prisma.content.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should reject delete for non-existent content', async () => {
      vi.mocked(prisma.content.findFirst).mockResolvedValue(null);

      await expect(
        service.deleteContent(mockUserId, 'non-existent')
      ).rejects.toThrow('Content not found or access denied');
    });
  });
});
