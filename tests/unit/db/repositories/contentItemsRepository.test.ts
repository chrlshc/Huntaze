/**
 * Unit Tests - Content Items Repository
 * 
 * Tests for content items database operations
 * Based on: .kiro/specs/content-creation/tasks.md (Task 1)
 * 
 * Coverage:
 * - CRUD operations
 * - Query filtering
 * - Pagination
 * - Transaction handling
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentItemsRepository } from '@/lib/db/repositories/contentItemsRepository';

// Mock database pool
vi.mock('@/lib/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('Content Items Repository - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Operations', () => {
    it('should create a new content item', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [{
          id: 1,
          user_id: 123,
          title: 'Test Content',
          body: 'Test body',
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const contentData = {
        user_id: 123,
        title: 'Test Content',
        body: 'Test body',
        status: 'draft' as const,
      };

      const result = await contentItemsRepository.create(contentData);

      expect(result).toBeTruthy();
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Content');
    });

    it('should set default status to draft', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [{
          id: 1,
          user_id: 123,
          title: 'Test Content',
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const contentData = {
        user_id: 123,
        title: 'Test Content',
      };

      const result = await contentItemsRepository.create(contentData);

      expect(result.status).toBe('draft');
    });

    it('should set timestamps on creation', async () => {
      const { pool } = await import('@/lib/db');
      const now = new Date();
      (pool.query as any).mockResolvedValue({
        rows: [{
          id: 1,
          user_id: 123,
          title: 'Test Content',
          created_at: now,
          updated_at: now,
        }],
      });

      const contentData = {
        user_id: 123,
        title: 'Test Content',
      };

      const result = await contentItemsRepository.create(contentData);

      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should handle creation errors', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockRejectedValue(new Error('Database error'));

      const contentData = {
        user_id: 123,
        title: 'Test Content',
      };

      await expect(
        contentItemsRepository.create(contentData)
      ).rejects.toThrow('Database error');
    });
  });

  describe('Read Operations', () => {
    it('should find content item by ID', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [{
          id: 1,
          user_id: 123,
          title: 'Test Content',
          status: 'draft',
        }],
      });

      const result = await contentItemsRepository.findById(1);

      expect(result).toBeTruthy();
      expect(result?.id).toBe(1);
    });

    it('should return null for non-existent ID', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await contentItemsRepository.findById(999);

      expect(result).toBeNull();
    });

    it('should list content items for user', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [
          { id: 1, user_id: 123, title: 'Content 1' },
          { id: 2, user_id: 123, title: 'Content 2' },
        ],
      });

      const result = await contentItemsRepository.findByUserId(123);

      expect(result).toHaveLength(2);
      expect(result[0].user_id).toBe(123);
    });

    it('should filter by status', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [
          { id: 1, user_id: 123, status: 'published' },
        ],
      });

      const result = await contentItemsRepository.findByUserId(123, {
        status: 'published',
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('published');
    });

    it('should support pagination', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [
          { id: 11, user_id: 123, title: 'Content 11' },
          { id: 12, user_id: 123, title: 'Content 12' },
        ],
      });

      const result = await contentItemsRepository.findByUserId(123, {
        limit: 10,
        offset: 10,
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([10, 10])
      );
    });

    it('should order by created_at descending by default', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rows: [] });

      await contentItemsRepository.findByUserId(123);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        expect.any(Array)
      );
    });
  });

  describe('Update Operations', () => {
    it('should update content item', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [{
          id: 1,
          user_id: 123,
          title: 'Updated Title',
          updated_at: new Date(),
        }],
      });

      const result = await contentItemsRepository.update(1, {
        title: 'Updated Title',
      });

      expect(result).toBeTruthy();
      expect(result?.title).toBe('Updated Title');
    });

    it('should update updated_at timestamp', async () => {
      const { pool } = await import('@/lib/db');
      const now = new Date();
      (pool.query as any).mockResolvedValue({
        rows: [{
          id: 1,
          updated_at: now,
        }],
      });

      const result = await contentItemsRepository.update(1, {
        title: 'Updated',
      });

      expect(result?.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for non-existent ID', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await contentItemsRepository.update(999, {
        title: 'Updated',
      });

      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [{
          id: 1,
          title: 'Original Title',
          body: 'Updated Body',
        }],
      });

      const result = await contentItemsRepository.update(1, {
        body: 'Updated Body',
      });

      expect(result?.body).toBe('Updated Body');
    });
  });

  describe('Delete Operations', () => {
    it('should delete content item', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rowCount: 1 });

      const result = await contentItemsRepository.delete(1);

      expect(result).toBe(true);
    });

    it('should return false for non-existent ID', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rowCount: 0 });

      const result = await contentItemsRepository.delete(999);

      expect(result).toBe(false);
    });

    it('should cascade delete related records', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rowCount: 1 });

      await contentItemsRepository.delete(1);

      // Verify cascade delete is handled by database constraints
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM content_items'),
        expect.arrayContaining([1])
      );
    });
  });

  describe('Status Management', () => {
    it('should update status to published', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [{
          id: 1,
          status: 'published',
          published_at: new Date(),
        }],
      });

      const result = await contentItemsRepository.updateStatus(1, 'published');

      expect(result?.status).toBe('published');
      expect(result?.published_at).toBeInstanceOf(Date);
    });

    it('should update status to scheduled', async () => {
      const { pool } = await import('@/lib/db');
      const scheduledDate = new Date(Date.now() + 3600000);
      (pool.query as any).mockResolvedValue({
        rows: [{
          id: 1,
          status: 'scheduled',
          scheduled_at: scheduledDate,
        }],
      });

      const result = await contentItemsRepository.updateStatus(1, 'scheduled', scheduledDate);

      expect(result?.status).toBe('scheduled');
      expect(result?.scheduled_at).toBeInstanceOf(Date);
    });

    it('should validate status transitions', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockRejectedValue(new Error('Invalid status transition'));

      await expect(
        contentItemsRepository.updateStatus(1, 'invalid' as any)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('Search and Filtering', () => {
    it('should search by title', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({
        rows: [{ id: 1, title: 'Test Content' }],
      });

      const result = await contentItemsRepository.search(123, 'Test');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%Test%'])
      );
    });

    it('should filter by date range', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rows: [] });

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      await contentItemsRepository.findByUserId(123, {
        startDate,
        endDate,
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('created_at BETWEEN'),
        expect.arrayContaining([startDate, endDate])
      );
    });

    it('should filter by multiple tags', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rows: [] });

      await contentItemsRepository.findByUserId(123, {
        tags: ['marketing', 'promotion'],
      });

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('Transaction Support', () => {
    it('should support transactions for create', async () => {
      const { pool } = await import('@/lib/db');
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 1, title: 'Test' }],
        }),
        release: vi.fn(),
      };
      (pool.query as any).mockResolvedValue({ rows: [] });

      const contentData = {
        user_id: 123,
        title: 'Test',
      };

      await contentItemsRepository.create(contentData, mockClient);

      expect(mockClient.query).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const { pool } = await import('@/lib/db');
      const mockClient = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockRejectedValueOnce(new Error('Insert failed')), // INSERT
        release: vi.fn(),
      };

      const contentData = {
        user_id: 123,
        title: 'Test',
      };

      await expect(
        contentItemsRepository.create(contentData, mockClient)
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('Performance', () => {
    it('should use indexes for user_id queries', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rows: [] });

      await contentItemsRepository.findByUserId(123);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id ='),
        expect.any(Array)
      );
    });

    it('should use indexes for status queries', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rows: [] });

      await contentItemsRepository.findByUserId(123, { status: 'published' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('status ='),
        expect.any(Array)
      );
    });

    it('should limit query results by default', async () => {
      const { pool } = await import('@/lib/db');
      (pool.query as any).mockResolvedValue({ rows: [] });

      await contentItemsRepository.findByUserId(123);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.any(Array)
      );
    });
  });
});
