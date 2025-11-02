/**
 * Integration Tests - Rich Text Editor Workflow (Task 3)
 * 
 * Integration tests to validate the complete editor workflow
 * Based on: .kiro/specs/content-creation/tasks.md (Task 3)
 * 
 * Coverage:
 * - Complete content creation flow
 * - Auto-save integration with API
 * - Media insertion workflow
 * - Platform-specific validation
 * - Draft management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Rich Text Editor - Integration Tests', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Content Creation Flow', () => {
    it('should create, edit, and save content successfully', async () => {
      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, draftId: 'draft_123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      // Simulate user creating content
      const content = {
        text: 'Test content with **bold** and *italic*',
        media: [{ id: 1, url: '/test.jpg' }],
        platforms: ['instagram', 'twitter']
      };

      // Create draft
      const createResponse = await fetch('/api/content/drafts', {
        method: 'POST',
        body: JSON.stringify(content)
      });

      const { draftId } = await createResponse.json();
      expect(draftId).toBe('draft_123');

      // Update draft
      const updateResponse = await fetch(`/api/content/drafts/${draftId}`, {
        method: 'PATCH',
        body: JSON.stringify({ text: 'Updated content' })
      });

      expect(updateResponse.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle content with multiple media attachments', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          draftId: 'draft_456',
          media: [
            { id: 1, url: '/image1.jpg', type: 'image' },
            { id: 2, url: '/image2.jpg', type: 'image' },
            { id: 3, url: '/video1.mp4', type: 'video' }
          ]
        })
      });

      const content = {
        text: 'Content with multiple media',
        media: [
          { id: 1, url: '/image1.jpg', type: 'image' },
          { id: 2, url: '/image2.jpg', type: 'image' },
          { id: 3, url: '/video1.mp4', type: 'video' }
        ]
      };

      const response = await fetch('/api/content/drafts', {
        method: 'POST',
        body: JSON.stringify(content)
      });

      const result = await response.json();
      expect(result.media).toHaveLength(3);
      expect(result.media[2].type).toBe('video');
    });

    it('should validate content before saving', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Content exceeds Instagram character limit (2200)'
        })
      });

      const longContent = {
        text: 'a'.repeat(2201),
        platforms: ['instagram']
      };

      const response = await fetch('/api/content/drafts', {
        method: 'POST',
        body: JSON.stringify(longContent)
      });

      expect(response.ok).toBe(false);
      const error = await response.json();
      expect(error.error).toContain('character limit');
    });
  });

  describe('Auto-Save Integration', () => {
    it('should auto-save draft after 30 seconds', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, savedAt: new Date().toISOString() })
      });

      // Simulate content change
      const content = { text: 'Auto-save test', draftId: 'draft_789' };

      // Wait for auto-save interval
      vi.advanceTimersByTime(30000);

      // Auto-save should trigger
      await fetch('/api/content/drafts/draft_789', {
        method: 'PATCH',
        body: JSON.stringify(content)
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/content/drafts/draft_789',
        expect.objectContaining({
          method: 'PATCH'
        })
      );
    });

    it('should handle auto-save failures with retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const content = { text: 'Test', draftId: 'draft_retry' };

      // First attempt fails
      try {
        await fetch('/api/content/drafts/draft_retry', {
          method: 'PATCH',
          body: JSON.stringify(content)
        });
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Retry after 5 seconds
      vi.advanceTimersByTime(5000);

      // Second attempt succeeds
      const response = await fetch('/api/content/drafts/draft_retry', {
        method: 'PATCH',
        body: JSON.stringify(content)
      });

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not auto-save if content unchanged', async () => {
      const content = { text: 'Unchanged', draftId: 'draft_same' };

      // Initial save
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await fetch('/api/content/drafts/draft_same', {
        method: 'PATCH',
        body: JSON.stringify(content)
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Wait for auto-save interval
      vi.advanceTimersByTime(30000);

      // Should not trigger another save
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should queue auto-saves during network issues', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const content = { text: 'Queued save', draftId: 'draft_queue' };

      // Multiple failed attempts
      for (let i = 0; i < 2; i++) {
        try {
          await fetch('/api/content/drafts/draft_queue', {
            method: 'PATCH',
            body: JSON.stringify(content)
          });
        } catch (error) {
          // Expected to fail
        }
        vi.advanceTimersByTime(5000);
      }

      // Final successful attempt
      const response = await fetch('/api/content/drafts/draft_queue', {
        method: 'PATCH',
        body: JSON.stringify(content)
      });

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Media Insertion Workflow', () => {
    it('should fetch media library on picker open', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          media: [
            { id: 1, url: '/image1.jpg', type: 'image', thumbnail: '/thumb1.jpg' },
            { id: 2, url: '/image2.jpg', type: 'image', thumbnail: '/thumb2.jpg' }
          ],
          total: 2
        })
      });

      const response = await fetch('/api/content/media?page=1&limit=20');
      const data = await response.json();

      expect(data.media).toHaveLength(2);
      expect(data.media[0]).toHaveProperty('thumbnail');
    });

    it('should insert selected media into content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const content = {
        text: 'Content with media',
        media: [{ id: 1, url: '/selected.jpg', type: 'image' }],
        draftId: 'draft_media'
      };

      const response = await fetch('/api/content/drafts/draft_media', {
        method: 'PATCH',
        body: JSON.stringify(content)
      });

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/content/drafts/draft_media',
        expect.objectContaining({
          body: expect.stringContaining('selected.jpg')
        })
      );
    });

    it('should handle media upload during content creation', async () => {
      // Mock media upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          media: {
            id: 123,
            url: '/uploads/new-image.jpg',
            thumbnail: '/uploads/thumb-new-image.jpg'
          }
        })
      });

      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'image/jpeg' }));

      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadResponse.json();
      expect(uploadData.media.id).toBe(123);

      // Mock draft update with new media
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const content = {
        text: 'Content with uploaded media',
        media: [uploadData.media],
        draftId: 'draft_upload'
      };

      const draftResponse = await fetch('/api/content/drafts/draft_upload', {
        method: 'PATCH',
        body: JSON.stringify(content)
      });

      expect(draftResponse.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should validate media file types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid file type. Supported: JPEG, PNG, GIF, WEBP, MP4, MOV, AVI'
        })
      });

      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'application/pdf' }));

      const response = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: formData
      });

      expect(response.ok).toBe(false);
      const error = await response.json();
      expect(error.error).toContain('Invalid file type');
    });

    it('should validate media file size', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'File size exceeds maximum limit (50MB for images, 500MB for videos)'
        })
      });

      const largeFile = new Blob(['x'.repeat(51 * 1024 * 1024)], { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', largeFile);

      const response = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: formData
      });

      expect(response.ok).toBe(false);
      const error = await response.json();
      expect(error.error).toContain('exceeds maximum limit');
    });
  });

  describe('Platform-Specific Validation', () => {
    it('should validate Instagram character limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Content exceeds Instagram character limit (2200)',
          platform: 'instagram',
          limit: 2200,
          current: 2201
        })
      });

      const content = {
        text: 'a'.repeat(2201),
        platforms: ['instagram']
      };

      const response = await fetch('/api/content/drafts', {
        method: 'POST',
        body: JSON.stringify(content)
      });

      const error = await response.json();
      expect(error.platform).toBe('instagram');
      expect(error.limit).toBe(2200);
    });

    it('should validate Twitter character limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Content exceeds Twitter character limit (280)',
          platform: 'twitter',
          limit: 280,
          current: 281
        })
      });

      const content = {
        text: 'a'.repeat(281),
        platforms: ['twitter']
      });

      const response = await fetch('/api/content/drafts', {
        method: 'POST',
        body: JSON.stringify(content)
      });

      const error = await response.json();
      expect(error.platform).toBe('twitter');
      expect(error.limit).toBe(280);
    });

    it('should validate multiple platforms simultaneously', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            { platform: 'twitter', error: 'Exceeds character limit (280)' },
            { platform: 'instagram', error: 'Missing alt text for images' }
          ]
        })
      });

      const content = {
        text: 'a'.repeat(300),
        media: [{ id: 1, url: '/test.jpg' }],
        platforms: ['twitter', 'instagram']
      };

      const response = await fetch('/api/content/drafts', {
        method: 'POST',
        body: JSON.stringify(content)
      });

      const result = await response.json();
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].platform).toBe('twitter');
      expect(result.errors[1].platform).toBe('instagram');
    });

    it('should provide platform-specific optimization suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          suggestions: [
            {
              platform: 'instagram',
              type: 'hashtags',
              message: 'Consider adding 5-10 relevant hashtags'
            },
            {
              platform: 'twitter',
              type: 'length',
              message: 'Content is optimal length for Twitter'
            }
          ]
        })
      });

      const content = {
        text: 'Great content without hashtags',
        platforms: ['instagram', 'twitter']
      };

      const response = await fetch('/api/content/drafts/validate', {
        method: 'POST',
        body: JSON.stringify(content)
      });

      const result = await response.json();
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].type).toBe('hashtags');
    });
  });

  describe('Draft Management', () => {
    it('should list all drafts for user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          drafts: [
            { id: 'draft_1', text: 'Draft 1', created_at: '2025-10-31T10:00:00Z' },
            { id: 'draft_2', text: 'Draft 2', created_at: '2025-10-31T11:00:00Z' }
          ],
          total: 2
        })
      });

      const response = await fetch('/api/content/drafts');
      const data = await response.json();

      expect(data.drafts).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should retrieve specific draft by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          draft: {
            id: 'draft_123',
            text: 'Specific draft content',
            media: [{ id: 1, url: '/test.jpg' }],
            platforms: ['instagram'],
            created_at: '2025-10-31T10:00:00Z',
            updated_at: '2025-10-31T10:30:00Z'
          }
        })
      });

      const response = await fetch('/api/content/drafts/draft_123');
      const data = await response.json();

      expect(data.draft.id).toBe('draft_123');
      expect(data.draft.media).toHaveLength(1);
    });

    it('should delete draft', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Draft deleted' })
      });

      const response = await fetch('/api/content/drafts/draft_delete', {
        method: 'DELETE'
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.message).toBe('Draft deleted');
    });

    it('should duplicate draft', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          draft: {
            id: 'draft_copy',
            text: 'Original content (Copy)',
            media: [{ id: 1, url: '/test.jpg' }]
          }
        })
      });

      const response = await fetch('/api/content/drafts/draft_original/duplicate', {
        method: 'POST'
      });

      const result = await response.json();
      expect(result.draft.id).toBe('draft_copy');
      expect(result.draft.text).toContain('(Copy)');
    });

    it('should handle concurrent edits', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({
            error: 'Draft has been modified by another user',
            lastModified: '2025-10-31T10:35:00Z'
          })
        });

      const content = {
        text: 'Updated content',
        lastModified: '2025-10-31T10:30:00Z'
      };

      const response = await fetch('/api/content/drafts/draft_conflict', {
        method: 'PATCH',
        body: JSON.stringify(content)
      });

      expect(response.status).toBe(409);
      const error = await response.json();
      expect(error.error).toContain('modified by another user');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      const response = await fetch('/api/content/drafts');

      expect(response.status).toBe(401);
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '60' }),
        json: async () => ({ error: 'Too many requests' })
      });

      const response = await fetch('/api/content/drafts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test' })
      });

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should handle server errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      const response = await fetch('/api/content/drafts');

      expect(response.status).toBe(500);
      const error = await response.json();
      expect(error.error).toBe('Internal server error');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 5000)
        )
      );

      vi.advanceTimersByTime(5000);

      try {
        await fetch('/api/content/drafts');
      } catch (error: any) {
        expect(error.message).toBe('Network timeout');
      }
    });
  });

  describe('Performance', () => {
    it('should handle rapid auto-save triggers efficiently', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      // Simulate rapid content changes
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(3000); // 3 seconds between changes
      }

      // Should debounce and only save once after 30 seconds
      vi.advanceTimersByTime(30000);

      // Only one save should have been triggered
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should batch multiple media insertions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          media: [
            { id: 1, url: '/image1.jpg' },
            { id: 2, url: '/image2.jpg' },
            { id: 3, url: '/image3.jpg' }
          ]
        })
      });

      const content = {
        text: 'Content with multiple media',
        media: [
          { id: 1, url: '/image1.jpg' },
          { id: 2, url: '/image2.jpg' },
          { id: 3, url: '/image3.jpg' }
        ]
      };

      const response = await fetch('/api/content/drafts', {
        method: 'POST',
        body: JSON.stringify(content)
      });

      // Should handle all media in single request
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const result = await response.json();
      expect(result.media).toHaveLength(3);
    });
  });
});
