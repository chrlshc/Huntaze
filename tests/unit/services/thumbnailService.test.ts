/**
 * Unit Tests - Thumbnail Generation Service
 * 
 * Tests for thumbnail generation functionality
 * Based on: .kiro/specs/content-creation/tasks.md (Task 2.2)
 * 
 * Coverage:
 * - Image thumbnail generation
 * - Video thumbnail extraction
 * - Dimension handling
 * - Compression optimization
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { thumbnailService } from '@/lib/services/thumbnailService';

// Mock Sharp for image processing
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('thumbnail')),
    metadata: vi.fn().mockResolvedValue({ width: 1920, height: 1080 }),
  })),
}));

// Mock FFmpeg for video processing
vi.mock('fluent-ffmpeg', () => ({
  default: vi.fn(() => ({
    screenshots: vi.fn().mockReturnThis(),
    on: vi.fn(function(event, callback) {
      if (event === 'end') {
        callback();
      }
      return this;
    }),
  })),
}));

describe('Thumbnail Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image Thumbnail Generation', () => {
    it('should generate thumbnail for JPEG images', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      const result = await thumbnailService.generateImageThumbnail(imageBuffer, 'image/jpeg');
      
      expect(result).toBeTruthy();
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should generate thumbnail for PNG images', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      const result = await thumbnailService.generateImageThumbnail(imageBuffer, 'image/png');
      
      expect(result).toBeTruthy();
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should resize image to 300x300 pixels', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const sharp = (await import('sharp')).default;
      
      await thumbnailService.generateImageThumbnail(imageBuffer, 'image/jpeg');
      
      expect(sharp).toHaveBeenCalled();
      const instance = (sharp as any).mock.results[0].value;
      expect(instance.resize).toHaveBeenCalledWith(300, 300, expect.any(Object));
    });

    it('should maintain aspect ratio when resizing', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const sharp = (await import('sharp')).default;
      
      await thumbnailService.generateImageThumbnail(imageBuffer, 'image/jpeg');
      
      const instance = (sharp as any).mock.results[0].value;
      expect(instance.resize).toHaveBeenCalledWith(
        300,
        300,
        expect.objectContaining({ fit: 'cover' })
      );
    });

    it('should apply JPEG compression for JPEG images', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const sharp = (await import('sharp')).default;
      
      await thumbnailService.generateImageThumbnail(imageBuffer, 'image/jpeg');
      
      const instance = (sharp as any).mock.results[0].value;
      expect(instance.jpeg).toHaveBeenCalledWith(expect.objectContaining({ quality: 80 }));
    });

    it('should apply PNG compression for PNG images', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const sharp = (await import('sharp')).default;
      
      await thumbnailService.generateImageThumbnail(imageBuffer, 'image/png');
      
      const instance = (sharp as any).mock.results[0].value;
      expect(instance.png).toHaveBeenCalledWith(expect.objectContaining({ compressionLevel: 9 }));
    });

    it('should handle corrupted image data', async () => {
      const sharp = (await import('sharp')).default;
      (sharp as any).mockImplementationOnce(() => ({
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockRejectedValue(new Error('Invalid image')),
      }));
      
      const imageBuffer = Buffer.from('corrupted-data');
      
      await expect(
        thumbnailService.generateImageThumbnail(imageBuffer, 'image/jpeg')
      ).rejects.toThrow('Invalid image');
    });
  });

  describe('Video Thumbnail Extraction', () => {
    it('should extract thumbnail from video at 1-second mark', async () => {
      const videoPath = '/tmp/test-video.mp4';
      const ffmpeg = (await import('fluent-ffmpeg')).default;
      
      await thumbnailService.generateVideoThumbnail(videoPath);
      
      expect(ffmpeg).toHaveBeenCalledWith(videoPath);
      const instance = (ffmpeg as any).mock.results[0].value;
      expect(instance.screenshots).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamps: ['00:00:01.000'],
        })
      );
    });

    it('should generate thumbnail with 640x360 dimensions', async () => {
      const videoPath = '/tmp/test-video.mp4';
      const ffmpeg = (await import('fluent-ffmpeg')).default;
      
      await thumbnailService.generateVideoThumbnail(videoPath);
      
      const instance = (ffmpeg as any).mock.results[0].value;
      expect(instance.screenshots).toHaveBeenCalledWith(
        expect.objectContaining({
          size: '640x360',
        })
      );
    });

    it('should save thumbnail to specified output path', async () => {
      const videoPath = '/tmp/test-video.mp4';
      const outputPath = '/tmp/thumbnails';
      const ffmpeg = (await import('fluent-ffmpeg')).default;
      
      await thumbnailService.generateVideoThumbnail(videoPath, outputPath);
      
      const instance = (ffmpeg as any).mock.results[0].value;
      expect(instance.screenshots).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: outputPath,
        })
      );
    });

    it('should return thumbnail filename', async () => {
      const videoPath = '/tmp/test-video.mp4';
      
      const result = await thumbnailService.generateVideoThumbnail(videoPath);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\.png$/);
    });

    it('should handle video processing errors', async () => {
      const ffmpeg = (await import('fluent-ffmpeg')).default;
      (ffmpeg as any).mockImplementationOnce(() => ({
        screenshots: vi.fn().mockReturnThis(),
        on: vi.fn(function(event, callback) {
          if (event === 'error') {
            callback(new Error('FFmpeg error'));
          }
          return this;
        }),
      }));
      
      const videoPath = '/tmp/invalid-video.mp4';
      
      await expect(
        thumbnailService.generateVideoThumbnail(videoPath)
      ).rejects.toThrow('FFmpeg error');
    });

    it('should handle missing video file', async () => {
      const videoPath = '/tmp/nonexistent.mp4';
      
      await expect(
        thumbnailService.generateVideoThumbnail(videoPath)
      ).rejects.toThrow();
    });
  });

  describe('S3 Upload Integration', () => {
    it('should upload image thumbnail to S3', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId = 123;
      const filename = 'test.jpg';
      
      const result = await thumbnailService.generateAndUploadImageThumbnail(
        imageBuffer,
        'image/jpeg',
        userId,
        filename
      );
      
      expect(result.url).toBeTruthy();
      expect(result.url).toMatch(/^https?:\/\//);
    });

    it('should upload video thumbnail to S3', async () => {
      const videoPath = '/tmp/test-video.mp4';
      const userId = 123;
      const filename = 'test.mp4';
      
      const result = await thumbnailService.generateAndUploadVideoThumbnail(
        videoPath,
        userId,
        filename
      );
      
      expect(result.url).toBeTruthy();
      expect(result.url).toMatch(/^https?:\/\//);
    });

    it('should include thumbnail suffix in S3 key', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId = 123;
      const filename = 'test.jpg';
      
      const result = await thumbnailService.generateAndUploadImageThumbnail(
        imageBuffer,
        'image/jpeg',
        userId,
        filename
      );
      
      expect(result.key).toContain('thumbnail');
    });

    it('should organize thumbnails by user ID', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId = 123;
      const filename = 'test.jpg';
      
      const result = await thumbnailService.generateAndUploadImageThumbnail(
        imageBuffer,
        'image/jpeg',
        userId,
        filename
      );
      
      expect(result.key).toContain(`user-${userId}`);
    });
  });

  describe('Optimization', () => {
    it('should compress thumbnails to reduce file size', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const sharp = (await import('sharp')).default;
      
      await thumbnailService.generateImageThumbnail(imageBuffer, 'image/jpeg');
      
      const instance = (sharp as any).mock.results[0].value;
      expect(instance.jpeg).toHaveBeenCalledWith(
        expect.objectContaining({ quality: expect.any(Number) })
      );
    });

    it('should use progressive JPEG for better loading', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const sharp = (await import('sharp')).default;
      
      await thumbnailService.generateImageThumbnail(imageBuffer, 'image/jpeg');
      
      const instance = (sharp as any).mock.results[0].value;
      expect(instance.jpeg).toHaveBeenCalledWith(
        expect.objectContaining({ progressive: true })
      );
    });

    it('should optimize PNG compression level', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const sharp = (await import('sharp')).default;
      
      await thumbnailService.generateImageThumbnail(imageBuffer, 'image/png');
      
      const instance = (sharp as any).mock.results[0].value;
      expect(instance.png).toHaveBeenCalledWith(
        expect.objectContaining({ compressionLevel: 9 })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid image buffer', async () => {
      await expect(
        thumbnailService.generateImageThumbnail(null as any, 'image/jpeg')
      ).rejects.toThrow();
    });

    it('should throw error for unsupported image format', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      await expect(
        thumbnailService.generateImageThumbnail(imageBuffer, 'image/bmp')
      ).rejects.toThrow('Unsupported format');
    });

    it('should throw error for invalid video path', async () => {
      await expect(
        thumbnailService.generateVideoThumbnail('')
      ).rejects.toThrow();
    });

    it('should handle S3 upload failures', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId = 123;
      const filename = 'test.jpg';
      
      // Mock S3 failure
      vi.mock('@aws-sdk/client-s3', () => ({
        S3Client: vi.fn(() => ({
          send: vi.fn().mockRejectedValue(new Error('S3 Error')),
        })),
        PutObjectCommand: vi.fn(),
      }));
      
      await expect(
        thumbnailService.generateAndUploadImageThumbnail(
          imageBuffer,
          'image/jpeg',
          userId,
          filename
        )
      ).rejects.toThrow('S3 Error');
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract image dimensions', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      const metadata = await thumbnailService.getImageMetadata(imageBuffer);
      
      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);
    });

    it('should calculate aspect ratio', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      const metadata = await thumbnailService.getImageMetadata(imageBuffer);
      
      expect(metadata.aspectRatio).toBeCloseTo(16 / 9, 2);
    });

    it('should detect image format', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      const metadata = await thumbnailService.getImageMetadata(imageBuffer);
      
      expect(metadata.format).toBeTruthy();
    });
  });
});
