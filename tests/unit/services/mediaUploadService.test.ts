/**
 * Unit Tests - Media Upload Service
 * 
 * Tests for media upload functionality
 * Based on: .kiro/specs/content-creation/tasks.md (Task 2.1)
 * 
 * Coverage:
 * - File validation (type, size, format)
 * - S3 upload operations
 * - Unique filename generation
 * - Error handling
 * - Progress tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mediaUploadService } from '@/lib/services/mediaUploadService';

// Mock AWS S3
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
}));

// Mock crypto for unique filenames
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => 'abc123def456'),
  })),
}));

describe('Media Upload Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('File Validation', () => {
    it('should accept valid image formats (JPEG, PNG, GIF, WEBP)', () => {
      const validFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      validFormats.forEach(format => {
        const file = new File(['content'], 'test.jpg', { type: format });
        const result = mediaUploadService.validateFileType(file);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept valid video formats (MP4, MOV, AVI)', () => {
      const validFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      
      validFormats.forEach(format => {
        const file = new File(['content'], 'test.mp4', { type: format });
        const result = mediaUploadService.validateFileType(file);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid file formats', () => {
      const invalidFormats = ['application/pdf', 'text/plain', 'audio/mp3'];
      
      invalidFormats.forEach(format => {
        const file = new File(['content'], 'test.pdf', { type: format });
        const result = mediaUploadService.validateFileType(file);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid file type');
      });
    });

    it('should enforce maximum file size for images (10MB)', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      
      const result = mediaUploadService.validateFileSize(largeFile, 'image');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    it('should enforce maximum file size for videos (100MB)', () => {
      const largeFile = new File([new ArrayBuffer(101 * 1024 * 1024)], 'large.mp4', {
        type: 'video/mp4',
      });
      
      const result = mediaUploadService.validateFileSize(largeFile, 'video');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    it('should accept files within size limits', () => {
      const validImage = new File([new ArrayBuffer(5 * 1024 * 1024)], 'valid.jpg', {
        type: 'image/jpeg',
      });
      
      const result = mediaUploadService.validateFileSize(validImage, 'image');
      expect(result.valid).toBe(true);
    });
  });

  describe('Filename Generation', () => {
    it('should generate unique filenames', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const filename1 = mediaUploadService.generateUniqueFilename(file, userId);
      const filename2 = mediaUploadService.generateUniqueFilename(file, userId);
      
      expect(filename1).not.toBe(filename2);
    });

    it('should include user ID in filename path', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const filename = mediaUploadService.generateUniqueFilename(file, userId);
      
      expect(filename).toContain(`user-${userId}`);
    });

    it('should include date in filename path', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const filename = mediaUploadService.generateUniqueFilename(file, userId);
      const today = new Date().toISOString().split('T')[0];
      
      expect(filename).toContain(today);
    });

    it('should preserve file extension', () => {
      const extensions = ['jpg', 'png', 'gif', 'mp4', 'mov'];
      const userId = 123;
      
      extensions.forEach(ext => {
        const file = new File(['content'], `test.${ext}`, { type: 'image/jpeg' });
        const filename = mediaUploadService.generateUniqueFilename(file, userId);
        
        expect(filename).toMatch(new RegExp(`\\.${ext}$`));
      });
    });

    it('should sanitize original filename', () => {
      const file = new File(['content'], 'test file (1) [copy].jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const filename = mediaUploadService.generateUniqueFilename(file, userId);
      
      expect(filename).not.toContain(' ');
      expect(filename).not.toContain('(');
      expect(filename).not.toContain(')');
      expect(filename).not.toContain('[');
      expect(filename).not.toContain(']');
    });
  });

  describe('S3 Upload Operations', () => {
    it('should upload file to S3 with correct parameters', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn().mockResolvedValue({ ETag: '"abc123"' });
      (S3Client as any).mockImplementation(() => ({
        send: mockSend,
      }));
      
      await mediaUploadService.uploadToS3(file, userId);
      
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return S3 URL after successful upload', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const result = await mediaUploadService.uploadToS3(file, userId);
      
      expect(result.url).toBeTruthy();
      expect(result.url).toMatch(/^https?:\/\//);
    });

    it('should handle S3 upload errors', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn().mockRejectedValue(new Error('S3 Error'));
      (S3Client as any).mockImplementation(() => ({
        send: mockSend,
      }));
      
      await expect(mediaUploadService.uploadToS3(file, userId)).rejects.toThrow('S3 Error');
    });

    it('should set correct content type in S3', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      
      await mediaUploadService.uploadToS3(file, userId);
      
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/jpeg',
        })
      );
    });

    it('should set public-read ACL for uploaded files', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      
      await mediaUploadService.uploadToS3(file, userId);
      
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ACL: 'public-read',
        })
      );
    });
  });

  describe('Progress Tracking', () => {
    it('should track upload progress', async () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      const userId = 123;
      const onProgress = vi.fn();
      
      await mediaUploadService.uploadToS3(file, userId, { onProgress });
      
      expect(onProgress).toHaveBeenCalled();
    });

    it('should report progress as percentage', async () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      const userId = 123;
      const progressValues: number[] = [];
      const onProgress = vi.fn((progress) => progressValues.push(progress));
      
      await mediaUploadService.uploadToS3(file, userId, { onProgress });
      
      progressValues.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should report 100% progress on completion', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      let finalProgress = 0;
      const onProgress = vi.fn((progress) => {
        finalProgress = progress;
      });
      
      await mediaUploadService.uploadToS3(file, userId, { onProgress });
      
      expect(finalProgress).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for missing file', async () => {
      const userId = 123;
      
      await expect(
        mediaUploadService.uploadToS3(null as any, userId)
      ).rejects.toThrow('File is required');
    });

    it('should throw error for missing user ID', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(
        mediaUploadService.uploadToS3(file, null as any)
      ).rejects.toThrow('User ID is required');
    });

    it('should throw error for invalid file type', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const userId = 123;
      
      await expect(
        mediaUploadService.uploadToS3(file, userId)
      ).rejects.toThrow('Invalid file type');
    });

    it('should throw error for file size exceeding limit', async () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const userId = 123;
      
      await expect(
        mediaUploadService.uploadToS3(largeFile, userId)
      ).rejects.toThrow('File size exceeds');
    });

    it('should handle network errors gracefully', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn().mockRejectedValue(new Error('Network error'));
      (S3Client as any).mockImplementation(() => ({
        send: mockSend,
      }));
      
      await expect(
        mediaUploadService.uploadToS3(file, userId)
      ).rejects.toThrow('Network error');
    });
  });

  describe('Complete Upload Flow', () => {
    it('should validate, generate filename, and upload successfully', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const result = await mediaUploadService.upload(file, userId);
      
      expect(result.success).toBe(true);
      expect(result.url).toBeTruthy();
      expect(result.filename).toBeTruthy();
      expect(result.size).toBe(file.size);
      expect(result.type).toBe(file.type);
    });

    it('should return metadata after upload', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 123;
      
      const result = await mediaUploadService.upload(file, userId);
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('uploadedAt');
    });

    it('should handle complete upload failure', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const userId = 123;
      
      const result = await mediaUploadService.upload(file, userId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
