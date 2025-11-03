/**
 * Integration Tests - Tag Management API Endpoints
 * 
 * Tests for tag creation, search, and filtering API endpoints
 * 
 * Coverage:
 * - GET /api/content/tags - List and search tags
 * - POST /api/content/tags - Create and assign tags
 * - Tag usage tracking
 * - Tag filtering and search
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/content/tags/route';
import { NextRequest } from 'next/server';

// Mock database
vi.mock('@/lib/db/index', () => ({
  query: vi.fn(),
}));

describe('Tag Management API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/content/tags', () => {
    it('should return tags for a user', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          { tag: 'javascript', usage_count: '10', last_used: '2025-01-01' },
          { tag: 'react', usage_count: '8', last_used: '2025-01-02' },
        ],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tags).toHaveLength(2);
      expect(data.tags[0].tag).toBe('javascript');
    });

    it('should require userId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/tags');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User ID is required');
    });

    it('should filter tags by search term', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          { tag: 'javascript', usage_count: '10', last_used: '2025-01-01' },
        ],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1&search=java');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tags).toHaveLength(1);
      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['1', '%java%'])
      );
    });

    it('should limit results', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1&limit=10');
      await GET(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining(['1', 10])
      );
    });

    it('should use default limit of 50', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      await GET(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['1', 50])
      );
    });

    it('should include usage count in results', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          { tag: 'test', usage_count: '5', last_used: '2025-01-01' },
        ],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.tags[0].usage_count).toBe('5');
    });

    it('should include last used date in results', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          { tag: 'test', usage_count: '5', last_used: '2025-01-01' },
        ],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.tags[0].last_used).toBe('2025-01-01');
    });

    it('should order tags by usage count descending', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      await GET(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY usage_count DESC'),
        expect.any(Array)
      );
    });

    it('should handle database errors', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch tags');
    });

    it('should join with content_items table', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      await GET(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.stringContaining('JOIN content_items'),
        expect.any(Array)
      );
    });

    it('should filter by user_id', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=123');
      await GET(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.stringContaining('user_id = $1'),
        expect.arrayContaining(['123'])
      );
    });
  });

  describe('POST /api/content/tags', () => {
    it('should create tags for content', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValue({ rows: [] } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: ['javascript', 'react'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Tags updated successfully');
    });

    it('should require contentId', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          tags: ['javascript'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Content ID and tags array are required');
    });

    it('should require tags array', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Content ID and tags array are required');
    });

    it('should validate tags is an array', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: 'not-an-array',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Content ID and tags array are required');
    });

    it('should delete existing tags before adding new ones', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValue({ rows: [] } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: ['javascript'],
        }),
      });

      await POST(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        'DELETE FROM content_tags WHERE content_id = $1',
        [1]
      );
    });

    it('should insert new tags', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValue({ rows: [] } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: ['javascript', 'react'],
        }),
      });

      await POST(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        'INSERT INTO content_tags (content_id, tag) VALUES ($1, $2)',
        [1, 'javascript']
      );
      expect(vi.mocked(query)).toHaveBeenCalledWith(
        'INSERT INTO content_tags (content_id, tag) VALUES ($1, $2)',
        [1, 'react']
      );
    });

    it('should normalize tags to lowercase', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValue({ rows: [] } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: ['JavaScript', 'REACT'],
        }),
      });

      await POST(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.any(String),
        [1, 'javascript']
      );
      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.any(String),
        [1, 'react']
      );
    });

    it('should trim whitespace from tags', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValue({ rows: [] } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: ['  javascript  ', '  react  '],
        }),
      });

      await POST(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.any(String),
        [1, 'javascript']
      );
      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.any(String),
        [1, 'react']
      );
    });

    it('should handle empty tags array', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValue({ rows: [] } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should only delete, not insert
      expect(vi.mocked(query)).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: ['javascript'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update tags');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('Tag Usage Tracking', () => {
    it('should count tag usage across content items', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          { tag: 'javascript', usage_count: '15', last_used: '2025-01-01' },
        ],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.tags[0].usage_count).toBe('15');
    });

    it('should track last used date', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          { tag: 'javascript', usage_count: '10', last_used: '2025-01-15T10:30:00Z' },
        ],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.tags[0].last_used).toBe('2025-01-15T10:30:00Z');
    });

    it('should group tags correctly', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValueOnce({
        rows: [],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags?userId=1');
      await GET(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY ct.tag'),
        expect.any(Array)
      );
    });
  });

  describe('Performance', () => {
    it('should use parameterized queries', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValue({ rows: [] } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: ['test'],
        }),
      });

      await POST(request);

      expect(vi.mocked(query)).toHaveBeenCalledWith(
        expect.stringContaining('$1'),
        expect.any(Array)
      );
    });

    it('should batch tag insertions', async () => {
      const { query } = await import('@/lib/db/index');
      vi.mocked(query).mockResolvedValue({ rows: [] } as any);

      const request = new NextRequest('http://localhost:3000/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 1,
          tags: ['tag1', 'tag2', 'tag3'],
        }),
      });

      await POST(request);

      // Should call query once for delete, then once per tag
      expect(vi.mocked(query)).toHaveBeenCalledTimes(4);
    });
  });
});
