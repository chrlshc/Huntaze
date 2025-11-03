/**
 * Unit Tests - Instagram Publish Service
 * 
 * Tests for Instagram content publishing functionality
 * Based on: .kiro/specs/social-integrations/tasks.md (Task 10.1)
 * 
 * Coverage:
 * - createContainer() for photos and videos
 * - createCarousel() for multiple items
 * - getContainerStatus() for status checking
 * - pollContainerStatus() with timeout handling
 * - publishContainer() to Instagram
 * - publishMedia() complete flow
 * - publishCarousel() complete flow
 * - Error handling for all scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  InstagramPublishService,
  type CreateContainerParams,
  type CreateCarouselParams,
} from '../../../lib/services/instagramPublish';

// Mock fetch globally
global.fetch = vi.fn();

describe('InstagramPublishService', () => {
  let service: InstagramPublishService;

  beforeEach(() => {
    service = new InstagramPublishService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createContainer()', () => {
    it('should create image container successfully', async () => {
      const mockResponse = { id: 'container_123' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const params: CreateContainerParams = {
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
        caption: 'Test caption',
      };

      const result = await service.createContainer(params);

      expect(result).toEqual({ id: 'container_123' });
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/ig_user_123/media',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should create video container with cover URL', async () => {
      const mockResponse = { id: 'container_456' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const params: CreateContainerParams = {
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        mediaType: 'VIDEO',
        mediaUrl: 'https://example.com/video.mp4',
        coverUrl: 'https://example.com/cover.jpg',
        caption: 'Video caption',
      };

      const result = await service.createContainer(params);

      expect(result).toEqual({ id: 'container_456' });
      expect(fetch).toHaveBeenCalled();
    });

    it('should create carousel item without caption', async () => {
      const mockResponse = { id: 'carousel_item_789' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const params: CreateContainerParams = {
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
        isCarouselItem: true,
        caption: 'Should not be included',
      };

      const result = await service.createContainer(params);

      expect(result).toEqual({ id: 'carousel_item_789' });
    });

    it('should include location ID when provided', async () => {
      const mockResponse = { id: 'container_with_location' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const params: CreateContainerParams = {
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
        locationId: 'location_123',
      };

      await service.createContainer(params);

      const callBody = JSON.parse(
        (fetch as any).mock.calls[0][1].body
      );
      expect(callBody.location_id).toBe('location_123');
    });

    it('should throw error when API returns error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Invalid media URL' },
        }),
      } as Response);

      const params: CreateContainerParams = {
        igUserId: 'ig_user_123',
        accessToken: 'invalid_token',
        mediaType: 'IMAGE',
        mediaUrl: 'invalid_url',
      };

      await expect(service.createContainer(params)).rejects.toThrow(
        'Failed to create container: Invalid media URL'
      );
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const params: CreateContainerParams = {
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
      };

      await expect(service.createContainer(params)).rejects.toThrow(
        'Failed to create container: Network error'
      );
    });
  });

  describe('createCarousel()', () => {
    it('should create carousel with multiple items', async () => {
      // Mock child container creations
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'child_1' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'child_2' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'carousel_123' }),
        } as Response);

      const params: CreateCarouselParams = {
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        children: [
          { mediaType: 'IMAGE', mediaUrl: 'https://example.com/img1.jpg' },
          { mediaType: 'IMAGE', mediaUrl: 'https://example.com/img2.jpg' },
        ],
        caption: 'Carousel caption',
      };

      const result = await service.createCarousel(params);

      expect(result).toEqual({ id: 'carousel_123' });
      expect(fetch).toHaveBeenCalledTimes(3); // 2 children + 1 carousel
    });

    it('should create carousel with video items', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'video_child_1' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'carousel_video_123' }),
        } as Response);

      const params: CreateCarouselParams = {
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        children: [
          {
            mediaType: 'VIDEO',
            mediaUrl: 'https://example.com/video.mp4',
            coverUrl: 'https://example.com/cover.jpg',
          },
        ],
      };

      const result = await service.createCarousel(params);

      expect(result).toEqual({ id: 'carousel_video_123' });
    });

    it('should throw error if child creation fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Invalid child media' },
        }),
      } as Response);

      const params: CreateCarouselParams = {
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        children: [
          { mediaType: 'IMAGE', mediaUrl: 'invalid_url' },
        ],
      };

      await expect(service.createCarousel(params)).rejects.toThrow(
        'Failed to create carousel'
      );
    });

    it('should throw error if carousel creation fails', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'child_1' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: { message: 'Carousel creation failed' },
          }),
        } as Response);

      const params: CreateCarouselParams = {
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        children: [
          { mediaType: 'IMAGE', mediaUrl: 'https://example.com/img.jpg' },
        ],
      };

      await expect(service.createCarousel(params)).rejects.toThrow(
        'Failed to create carousel: Carousel creation failed'
      );
    });
  });

  describe('getContainerStatus()', () => {
    it('should return FINISHED status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status_code: 'FINISHED' }),
      } as Response);

      const result = await service.getContainerStatus(
        'container_123',
        'access_token_123'
      );

      expect(result).toEqual({ status_code: 'FINISHED' });
    });

    it('should return IN_PROGRESS status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status_code: 'IN_PROGRESS' }),
      } as Response);

      const result = await service.getContainerStatus(
        'container_123',
        'access_token_123'
      );

      expect(result).toEqual({ status_code: 'IN_PROGRESS' });
    });

    it('should return ERROR status with message', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 'ERROR',
          error_message: 'Invalid media format',
        }),
      } as Response);

      const result = await service.getContainerStatus(
        'container_123',
        'access_token_123'
      );

      expect(result).toEqual({
        status_code: 'ERROR',
        error_message: 'Invalid media format',
      });
    });

    it('should throw error when API call fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { message: 'Container not found' },
        }),
      } as Response);

      await expect(
        service.getContainerStatus('invalid_container', 'access_token_123')
      ).rejects.toThrow('Failed to get container status: Container not found');
    });
  });

  describe('pollContainerStatus()', () => {
    it('should return when status is FINISHED', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status_code: 'FINISHED' }),
      } as Response);

      const result = await service.pollContainerStatus(
        'container_123',
        'access_token_123',
        5,
        100
      );

      expect(result).toEqual({ status_code: 'FINISHED' });
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should poll multiple times until FINISHED', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status_code: 'IN_PROGRESS' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status_code: 'IN_PROGRESS' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status_code: 'FINISHED' }),
        } as Response);

      const result = await service.pollContainerStatus(
        'container_123',
        'access_token_123',
        5,
        10 // Short interval for testing
      );

      expect(result).toEqual({ status_code: 'FINISHED' });
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error when status is ERROR', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 'ERROR',
          error_message: 'Processing failed',
        }),
      } as Response);

      await expect(
        service.pollContainerStatus('container_123', 'access_token_123', 5, 100)
      ).rejects.toThrow('Container error: Processing failed');
    });

    it('should throw error when status is EXPIRED', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status_code: 'EXPIRED' }),
      } as Response);

      await expect(
        service.pollContainerStatus('container_123', 'access_token_123', 5, 100)
      ).rejects.toThrow('Container expired');
    });

    it('should timeout after max attempts', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ status_code: 'IN_PROGRESS' }),
      } as Response);

      await expect(
        service.pollContainerStatus('container_123', 'access_token_123', 3, 10)
      ).rejects.toThrow('Container status polling timed out');

      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('publishContainer()', () => {
    it('should publish container successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'media_123' }),
      } as Response);

      const result = await service.publishContainer({
        igUserId: 'ig_user_123',
        containerId: 'container_123',
        accessToken: 'access_token_123',
      });

      expect(result).toEqual({ id: 'media_123' });
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/ig_user_123/media_publish',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error when publish fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Container not ready' },
        }),
      } as Response);

      await expect(
        service.publishContainer({
          igUserId: 'ig_user_123',
          containerId: 'container_123',
          accessToken: 'access_token_123',
        })
      ).rejects.toThrow('Failed to publish container: Container not ready');
    });
  });

  describe('publishMedia()', () => {
    it('should complete full publish flow', async () => {
      // Mock create container
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'container_123' }),
      } as Response);

      // Mock poll status (FINISHED immediately)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status_code: 'FINISHED' }),
      } as Response);

      // Mock publish
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'media_123' }),
      } as Response);

      const result = await service.publishMedia({
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
        caption: 'Test caption',
      });

      expect(result).toEqual({ id: 'media_123' });
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error if container creation fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Invalid media' },
        }),
      } as Response);

      await expect(
        service.publishMedia({
          igUserId: 'ig_user_123',
          accessToken: 'access_token_123',
          mediaType: 'IMAGE',
          mediaUrl: 'invalid_url',
        })
      ).rejects.toThrow('Failed to publish media');
    });

    it('should throw error if polling fails', async () => {
      // Mock create container
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'container_123' }),
      } as Response);

      // Mock poll status (ERROR)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 'ERROR',
          error_message: 'Processing failed',
        }),
      } as Response);

      await expect(
        service.publishMedia({
          igUserId: 'ig_user_123',
          accessToken: 'access_token_123',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/image.jpg',
        })
      ).rejects.toThrow('Failed to publish media');
    });
  });

  describe('publishCarousel()', () => {
    it('should complete full carousel publish flow', async () => {
      // Mock child container creations
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'child_1' }),
      } as Response);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'child_2' }),
      } as Response);

      // Mock carousel container creation
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'carousel_123' }),
      } as Response);

      // Mock poll status
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status_code: 'FINISHED' }),
      } as Response);

      // Mock publish
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'media_carousel_123' }),
      } as Response);

      const result = await service.publishCarousel({
        igUserId: 'ig_user_123',
        accessToken: 'access_token_123',
        children: [
          { mediaType: 'IMAGE', mediaUrl: 'https://example.com/img1.jpg' },
          { mediaType: 'IMAGE', mediaUrl: 'https://example.com/img2.jpg' },
        ],
        caption: 'Carousel caption',
      });

      expect(result).toEqual({ id: 'media_carousel_123' });
      expect(fetch).toHaveBeenCalledTimes(5); // 2 children + carousel + poll + publish
    });
  });

  describe('getMediaDetails()', () => {
    it('should fetch media details successfully', async () => {
      const mockDetails = {
        id: 'media_123',
        media_type: 'IMAGE',
        media_url: 'https://example.com/image.jpg',
        permalink: 'https://instagram.com/p/abc123',
        timestamp: '2025-10-31T12:00:00Z',
        caption: 'Test caption',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetails,
      } as Response);

      const result = await service.getMediaDetails(
        'media_123',
        'access_token_123'
      );

      expect(result).toEqual(mockDetails);
    });

    it('should throw error when fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { message: 'Media not found' },
        }),
      } as Response);

      await expect(
        service.getMediaDetails('invalid_media', 'access_token_123')
      ).rejects.toThrow('Failed to get media details: Media not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle permission errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: { message: 'Permission denied' },
        }),
      } as Response);

      await expect(
        service.createContainer({
          igUserId: 'ig_user_123',
          accessToken: 'invalid_token',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/image.jpg',
        })
      ).rejects.toThrow('Permission denied');
    });

    it('should handle rate limit errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: { message: 'Rate limit exceeded' },
        }),
      } as Response);

      await expect(
        service.createContainer({
          igUserId: 'ig_user_123',
          accessToken: 'access_token_123',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/image.jpg',
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid media format errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Invalid media format' },
        }),
      } as Response);

      await expect(
        service.createContainer({
          igUserId: 'ig_user_123',
          accessToken: 'access_token_123',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/invalid.txt',
        })
      ).rejects.toThrow('Invalid media format');
    });
  });
});
