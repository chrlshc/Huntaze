/**
 * Integration Tests - Content Media API Endpoints
 * 
 * Tests for media upload and management API endpoints
 * Based on: .kiro/specs/content-creation/tasks.md (Task 2)
 * 
 * Coverage:
 * - Media upload endpoint
 * - Media library listing
 * - Media deletion
 * - Thumbnail generation
 * - Storage quota tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as uploadMedia } from '@/app/api/content/media/upload/route';
import { GET as listMedia } from '@/app/api/content/media/route';
import { DELETE as deleteMedia } from '@/app/api/content/media/[id]/route';

// Mock authentication
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve({
    user: { id: '123', email: 'test@example.com' },
  })),
}));

// Mock S3
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ ETag: '"abc123"' }),
  })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

// Mock Sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('thumbnail')),
  })),
}));

describe('Content Media API - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/content/media/upload', () => {
    it('should upload image successfully', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.media).toBeDefined();
      expect(data.media.url).toBeTruthy();
    });

    it('should upload video successfully', async () => {
      const formData = new FormData();
      const file = new File(['test video'], 'test.mp4', { type: 'video/mp4' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.media.type).toBe('video');
    });

    it('should generate thumbnail for uploaded image', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);
      const data = await response.json();

      expect(data.media.thumbnail_url).toBeTruthy();
    });

    it('should reject file exceeding size limit', async () => {
      const formData = new FormData();
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );
      formData.append('file', largeFile);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('File size exceeds');
    });

    it('should reject invalid file type', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid file type');
    });

    it('should require authentication', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValueOnce(null);

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);

      expect(response.status).toBe(401);
    });

    it('should track storage quota', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);
      const data = await response.json();

      expect(data.quota).toBeDefined();
      expect(data.quota.used).toBeGreaterThan(0);
    });

    it('should reject upload when quota exceeded', async () => {
      // Mock quota exceeded scenario
      vi.mock('@/lib/db/repositories/mediaAssetsRepository', () => ({
        mediaAssetsRepository: {
          getTotalStorageUsed: vi.fn().mockResolvedValue(1024 * 1024 * 1024), // 1GB
        },
      }));

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Storage quota exceeded');
    });
  });

  describe('GET /api/content/media', () => {
    it('should list user media', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/media', {
        method: 'GET',
      });

      const response = await listMedia(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.media).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/content/media?limit=10&offset=20',
        { method: 'GET' }
      );

      const response = await listMedia(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(20);
    });

    it('should filter by media type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/content/media?type=image',
        { method: 'GET' }
      );

      const response = await listMedia(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      data.media.forEach((item: any) => {
        expect(item.type).toBe('image');
      });
    });

    it('should search by filename', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/content/media?search=test',
        { method: 'GET' }
      );

      const response = await listMedia(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.media).toBeInstanceOf(Array);
    });

    it('should filter by date range', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-12-31';
      const request = new NextRequest(
        `http://localhost:3000/api/content/media?startDate=${startDate}&endDate=${endDate}`,
        { method: 'GET' }
      );

      const response = await listMedia(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.media).toBeInstanceOf(Array);
    });

    it('should require authentication', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/content/media', {
        method: 'GET',
      });

      const response = await listMedia(request);

      expect(response.status).toBe(401);
    });

    it('should return storage quota information', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/media', {
        method: 'GET',
      });

      const response = await listMedia(request);
      const data = await response.json();

      expect(data.quota).toBeDefined();
      expect(data.quota.total).toBeGreaterThan(0);
      expect(data.quota.used).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DELETE /api/content/media/[id]', () => {
    it('should delete media successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/media/1', {
        method: 'DELETE',
      });

      const response = await deleteMedia(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should delete file from S3', async () => {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn().mockResolvedValue({});
      (S3Client as any).mockImplementation(() => ({
        send: mockSend,
      }));

      const request = new NextRequest('http://localhost:3000/api/content/media/1', {
        method: 'DELETE',
      });

      await deleteMedia(request, { params: { id: '1' } });

      expect(mockSend).toHaveBeenCalled();
    });

    it('should delete thumbnail from S3', async () => {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn().mockResolvedValue({});
      (S3Client as any).mockImplementation(() => ({
        send: mockSend,
      }));

      const request = new NextRequest('http://localhost:3000/api/content/media/1', {
        method: 'DELETE',
      });

      await deleteMedia(request, { params: { id: '1' } });

      // Should delete both original and thumbnail
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should update storage quota after deletion', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/media/1', {
        method: 'DELETE',
      });

      const response = await deleteMedia(request, { params: { id: '1' } });
      const data = await response.json();

      expect(data.quota).toBeDefined();
      expect(data.quota.freed).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent media', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/media/999', {
        method: 'DELETE',
      });

      const response = await deleteMedia(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
    });

    it('should prevent deletion of media in use', async () => {
      // Mock media being referenced by content
      vi.mock('@/lib/db/repositories/contentItemsRepository', () => ({
        contentItemsRepository: {
          findByMediaId: vi.fn().mockResolvedValue([{ id: 1 }]),
        },
      }));

      const request = new NextRequest('http://localhost:3000/api/content/media/1', {
        method: 'DELETE',
      });

      const response = await deleteMedia(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('in use');
    });

    it('should require authentication', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/content/media/1', {
        method: 'DELETE',
      });

      const response = await deleteMedia(request, { params: { id: '1' } });

      expect(response.status).toBe(401);
    });

    it('should prevent deletion of other users media', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/media/1', {
        method: 'DELETE',
      });

      const response = await deleteMedia(request, { params: { id: '1' } });

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle S3 upload failures', async () => {
      const { S3Client } = await import('@aws-sdk/client-s3');
      (S3Client as any).mockImplementation(() => ({
        send: vi.fn().mockRejectedValue(new Error('S3 Error')),
      }));

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });

    it('should handle database errors', async () => {
      vi.mock('@/lib/db', () => ({
        pool: {
          query: vi.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const request = new NextRequest('http://localhost:3000/api/content/media', {
        method: 'GET',
      });

      const response = await listMedia(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });

    it('should handle thumbnail generation failures', async () => {
      const sharp = (await import('sharp')).default;
      (sharp as any).mockImplementation(() => ({
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockRejectedValue(new Error('Sharp error')),
      }));

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/content/media/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadMedia(request);
      const data = await response.json();

      // Should still succeed but without thumbnail
      expect(response.status).toBe(200);
      expect(data.media.thumbnail_url).toBeNull();
    });
  });
});
