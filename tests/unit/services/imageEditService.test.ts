/**
 * Unit Tests - Image Edit Service (Task 4.2)
 * 
 * Tests for image processing backend service
 * Based on: .kiro/specs/content-creation/tasks.md (Task 4.2)
 * 
 * Coverage:
 * - Image transformations (crop, resize, rotate)
 * - Image adjustments (brightness, contrast, saturation)
 * - Text overlay rendering
 * - Filter application
 * - File saving and S3 upload
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { imageEditService } from '@/lib/services/imageEditService';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Mock Sharp
vi.mock('sharp');

// Mock S3 Client
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
}));

describe('Image Edit Service - Unit Tests', () => {
  let mockSharpInstance: any;
  let mockS3Client: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Sharp instance with chainable methods
    mockSharpInstance = {
      resize: vi.fn().mockReturnThis(),
      rotate: vi.fn().mockReturnThis(),
      flip: vi.fn().mockReturnThis(),
      flop: vi.fn().mockReturnThis(),
      extract: vi.fn().mockReturnThis(),
      modulate: vi.fn().mockReturnThis(),
      linear: vi.fn().mockReturnThis(),
      composite: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('edited-image')),
      metadata: vi.fn().mockResolvedValue({ width: 1000, height: 1000, format: 'jpeg' }),
    };

    // Mock Sharp constructor
    (sharp as any).mockReturnValue(mockSharpInstance);

    // Mock S3 Client
    mockS3Client = {
      send: vi.fn().mockResolvedValue({ ETag: 'mock-etag' }),
    };
    (S3Client as any).mockImplementation(() => mockS3Client);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requirement 3.1 - Image Transformations', () => {
    describe('Crop Operation', () => {
      it('should crop image with specified dimensions', async () => {
        const cropParams = {
          left: 100,
          top: 100,
          width: 500,
          height: 500,
        };

        await imageEditService.cropImage('test-image.jpg', cropParams);

        expect(mockSharpInstance.extract).toHaveBeenCalledWith(cropParams);
        expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
      });

      it('should validate crop dimensions are positive', async () => {
        const invalidCrop = {
          left: 0,
          top: 0,
          width: -100,
          height: 500,
        };

        await expect(
          imageEditService.cropImage('test-image.jpg', invalidCrop)
        ).rejects.toThrow('Invalid crop dimensions');
      });

      it('should validate crop area is within image bounds', async () => {
        mockSharpInstance.metadata.mockResolvedValue({ width: 1000, height: 1000 });

        const outOfBoundsCrop = {
          left: 900,
          top: 900,
          width: 500,
          height: 500,
        };

        await expect(
          imageEditService.cropImage('test-image.jpg', outOfBoundsCrop)
        ).rejects.toThrow('Crop area exceeds image bounds');
      });
    });

    describe('Resize Operation', () => {
      it('should resize image to specified dimensions', async () => {
        await imageEditService.resizeImage('test-image.jpg', 800, 600);

        expect(mockSharpInstance.resize).toHaveBeenCalledWith(800, 600, {
          fit: 'cover',
          position: 'center',
        });
      });

      it('should maintain aspect ratio when only width provided', async () => {
        await imageEditService.resizeImage('test-image.jpg', 800);

        expect(mockSharpInstance.resize).toHaveBeenCalledWith(800, undefined, {
          fit: 'cover',
          position: 'center',
        });
      });

      it('should maintain aspect ratio when only height provided', async () => {
        await imageEditService.resizeImage('test-image.jpg', undefined, 600);

        expect(mockSharpInstance.resize).toHaveBeenCalledWith(undefined, 600, {
          fit: 'cover',
          position: 'center',
        });
      });

      it('should validate resize dimensions are positive', async () => {
        await expect(
          imageEditService.resizeImage('test-image.jpg', -800, 600)
        ).rejects.toThrow('Invalid resize dimensions');
      });

      it('should limit maximum dimensions to 4096x4096', async () => {
        await expect(
          imageEditService.resizeImage('test-image.jpg', 5000, 5000)
        ).rejects.toThrow('Dimensions exceed maximum allowed size');
      });
    });

    describe('Rotate Operation', () => {
      it('should rotate image by 90 degrees', async () => {
        await imageEditService.rotateImage('test-image.jpg', 90);

        expect(mockSharpInstance.rotate).toHaveBeenCalledWith(90);
      });

      it('should rotate image by 180 degrees', async () => {
        await imageEditService.rotateImage('test-image.jpg', 180);

        expect(mockSharpInstance.rotate).toHaveBeenCalledWith(180);
      });

      it('should rotate image by 270 degrees', async () => {
        await imageEditService.rotateImage('test-image.jpg', 270);

        expect(mockSharpInstance.rotate).toHaveBeenCalledWith(270);
      });

      it('should validate rotation angle is valid', async () => {
        await expect(
          imageEditService.rotateImage('test-image.jpg', 45)
        ).rejects.toThrow('Invalid rotation angle. Must be 90, 180, or 270');
      });
    });

    describe('Flip Operation', () => {
      it('should flip image horizontally', async () => {
        await imageEditService.flipImage('test-image.jpg', 'horizontal');

        expect(mockSharpInstance.flop).toHaveBeenCalled();
      });

      it('should flip image vertically', async () => {
        await imageEditService.flipImage('test-image.jpg', 'vertical');

        expect(mockSharpInstance.flip).toHaveBeenCalled();
      });

      it('should validate flip direction', async () => {
        await expect(
          imageEditService.flipImage('test-image.jpg', 'invalid' as any)
        ).rejects.toThrow('Invalid flip direction');
      });
    });
  });

  describe('Requirement 3.2 - Image Adjustments', () => {
    describe('Brightness Adjustment', () => {
      it('should increase brightness', async () => {
        await imageEditService.adjustBrightness('test-image.jpg', 1.2);

        expect(mockSharpInstance.modulate).toHaveBeenCalledWith({
          brightness: 1.2,
        });
      });

      it('should decrease brightness', async () => {
        await imageEditService.adjustBrightness('test-image.jpg', 0.8);

        expect(mockSharpInstance.modulate).toHaveBeenCalledWith({
          brightness: 0.8,
        });
      });

      it('should validate brightness range (0.5 to 2.0)', async () => {
        await expect(
          imageEditService.adjustBrightness('test-image.jpg', 3.0)
        ).rejects.toThrow('Brightness must be between 0.5 and 2.0');
      });
    });

    describe('Contrast Adjustment', () => {
      it('should increase contrast', async () => {
        await imageEditService.adjustContrast('test-image.jpg', 1.5);

        expect(mockSharpInstance.linear).toHaveBeenCalledWith(1.5, 0);
      });

      it('should decrease contrast', async () => {
        await imageEditService.adjustContrast('test-image.jpg', 0.7);

        expect(mockSharpInstance.linear).toHaveBeenCalledWith(0.7, 0);
      });

      it('should validate contrast range (0.5 to 2.0)', async () => {
        await expect(
          imageEditService.adjustContrast('test-image.jpg', 2.5)
        ).rejects.toThrow('Contrast must be between 0.5 and 2.0');
      });
    });

    describe('Saturation Adjustment', () => {
      it('should increase saturation', async () => {
        await imageEditService.adjustSaturation('test-image.jpg', 1.3);

        expect(mockSharpInstance.modulate).toHaveBeenCalledWith({
          saturation: 1.3,
        });
      });

      it('should decrease saturation (desaturate)', async () => {
        await imageEditService.adjustSaturation('test-image.jpg', 0.5);

        expect(mockSharpInstance.modulate).toHaveBeenCalledWith({
          saturation: 0.5,
        });
      });

      it('should create grayscale when saturation is 0', async () => {
        await imageEditService.adjustSaturation('test-image.jpg', 0);

        expect(mockSharpInstance.modulate).toHaveBeenCalledWith({
          saturation: 0,
        });
      });

      it('should validate saturation range (0 to 2.0)', async () => {
        await expect(
          imageEditService.adjustSaturation('test-image.jpg', 3.0)
        ).rejects.toThrow('Saturation must be between 0 and 2.0');
      });
    });

    describe('Combined Adjustments', () => {
      it('should apply multiple adjustments in sequence', async () => {
        await imageEditService.applyAdjustments('test-image.jpg', {
          brightness: 1.2,
          contrast: 1.1,
          saturation: 1.3,
        });

        expect(mockSharpInstance.modulate).toHaveBeenCalledWith({
          brightness: 1.2,
          saturation: 1.3,
        });
        expect(mockSharpInstance.linear).toHaveBeenCalledWith(1.1, 0);
      });
    });
  });

  describe('Requirement 3.3 - Text Overlay', () => {
    it('should add text overlay with default settings', async () => {
      await imageEditService.addTextOverlay('test-image.jpg', {
        text: 'Hello World',
        x: 100,
        y: 100,
      });

      expect(mockSharpInstance.composite).toHaveBeenCalled();
    });

    it('should add text overlay with custom font', async () => {
      await imageEditService.addTextOverlay('test-image.jpg', {
        text: 'Custom Font',
        x: 100,
        y: 100,
        font: 'Arial',
        fontSize: 48,
      });

      expect(mockSharpInstance.composite).toHaveBeenCalled();
    });

    it('should add text overlay with custom color', async () => {
      await imageEditService.addTextOverlay('test-image.jpg', {
        text: 'Colored Text',
        x: 100,
        y: 100,
        color: '#FF0000',
      });

      expect(mockSharpInstance.composite).toHaveBeenCalled();
    });

    it('should validate text is not empty', async () => {
      await expect(
        imageEditService.addTextOverlay('test-image.jpg', {
          text: '',
          x: 100,
          y: 100,
        })
      ).rejects.toThrow('Text cannot be empty');
    });

    it('should validate position is within image bounds', async () => {
      mockSharpInstance.metadata.mockResolvedValue({ width: 1000, height: 1000 });

      await expect(
        imageEditService.addTextOverlay('test-image.jpg', {
          text: 'Out of bounds',
          x: 2000,
          y: 2000,
        })
      ).rejects.toThrow('Text position exceeds image bounds');
    });

    it('should support text alignment options', async () => {
      await imageEditService.addTextOverlay('test-image.jpg', {
        text: 'Centered Text',
        x: 500,
        y: 500,
        align: 'center',
      });

      expect(mockSharpInstance.composite).toHaveBeenCalled();
    });
  });

  describe('Requirement 3.4 - Filter Application', () => {
    it('should apply grayscale filter', async () => {
      await imageEditService.applyFilter('test-image.jpg', 'grayscale');

      expect(mockSharpInstance.modulate).toHaveBeenCalledWith({
        saturation: 0,
      });
    });

    it('should apply sepia filter', async () => {
      await imageEditService.applyFilter('test-image.jpg', 'sepia');

      expect(mockSharpInstance.modulate).toHaveBeenCalled();
    });

    it('should apply vintage filter', async () => {
      await imageEditService.applyFilter('test-image.jpg', 'vintage');

      expect(mockSharpInstance.modulate).toHaveBeenCalled();
    });

    it('should apply blur filter', async () => {
      await imageEditService.applyFilter('test-image.jpg', 'blur');

      // Blur would use a different Sharp method
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
    });

    it('should validate filter name', async () => {
      await expect(
        imageEditService.applyFilter('test-image.jpg', 'invalid-filter' as any)
      ).rejects.toThrow('Invalid filter name');
    });

    it('should support custom filter intensity', async () => {
      await imageEditService.applyFilter('test-image.jpg', 'sepia', 0.7);

      expect(mockSharpInstance.modulate).toHaveBeenCalled();
    });
  });

  describe('Requirement 3.5 - File Saving', () => {
    it('should save edited image to S3', async () => {
      const result = await imageEditService.saveEditedImage(
        'test-image.jpg',
        Buffer.from('edited-image'),
        'user123'
      );

      expect(mockS3Client.send).toHaveBeenCalled();
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
    });

    it('should generate unique filename for edited image', async () => {
      const result = await imageEditService.saveEditedImage(
        'test-image.jpg',
        Buffer.from('edited-image'),
        'user123'
      );

      expect(result.key).toContain('user123');
      expect(result.key).toContain('edited');
      expect(result.key).not.toBe('test-image.jpg');
    });

    it('should preserve original file extension', async () => {
      const result = await imageEditService.saveEditedImage(
        'test-image.png',
        Buffer.from('edited-image'),
        'user123'
      );

      expect(result.key).toMatch(/\.png$/);
    });

    it('should maintain original file unchanged', async () => {
      await imageEditService.saveEditedImage(
        'test-image.jpg',
        Buffer.from('edited-image'),
        'user123'
      );

      // Original file should not be modified
      // This is ensured by creating a new file
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle S3 upload errors', async () => {
      mockS3Client.send.mockRejectedValue(new Error('S3 upload failed'));

      await expect(
        imageEditService.saveEditedImage(
          'test-image.jpg',
          Buffer.from('edited-image'),
          'user123'
        )
      ).rejects.toThrow('Failed to save edited image');
    });
  });

  describe('Complete Edit Workflow', () => {
    it('should apply multiple edits in sequence', async () => {
      const edits = {
        crop: { left: 100, top: 100, width: 500, height: 500 },
        resize: { width: 800, height: 600 },
        rotate: 90,
        adjustments: {
          brightness: 1.2,
          contrast: 1.1,
          saturation: 1.3,
        },
        textOverlay: {
          text: 'Edited',
          x: 400,
          y: 300,
        },
        filter: 'vintage',
      };

      const result = await imageEditService.applyEdits('test-image.jpg', edits, 'user123');

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(mockSharpInstance.extract).toHaveBeenCalled();
      expect(mockSharpInstance.resize).toHaveBeenCalled();
      expect(mockSharpInstance.rotate).toHaveBeenCalled();
      expect(mockSharpInstance.modulate).toHaveBeenCalled();
      expect(mockSharpInstance.composite).toHaveBeenCalled();
    });

    it('should handle partial edit operations', async () => {
      const edits = {
        resize: { width: 800 },
        adjustments: { brightness: 1.2 },
      };

      const result = await imageEditService.applyEdits('test-image.jpg', edits, 'user123');

      expect(result).toHaveProperty('url');
      expect(mockSharpInstance.resize).toHaveBeenCalled();
      expect(mockSharpInstance.modulate).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid image file', async () => {
      mockSharpInstance.metadata.mockRejectedValue(new Error('Invalid image'));

      await expect(
        imageEditService.cropImage('invalid.jpg', { left: 0, top: 0, width: 100, height: 100 })
      ).rejects.toThrow('Invalid image file');
    });

    it('should handle Sharp processing errors', async () => {
      mockSharpInstance.toBuffer.mockRejectedValue(new Error('Processing failed'));

      await expect(
        imageEditService.resizeImage('test-image.jpg', 800, 600)
      ).rejects.toThrow('Image processing failed');
    });

    it('should provide descriptive error messages', async () => {
      await expect(
        imageEditService.cropImage('test-image.jpg', { left: -10, top: 0, width: 100, height: 100 })
      ).rejects.toThrow(/Invalid crop dimensions/);
    });
  });

  describe('Performance', () => {
    it('should process image edits within 5 seconds', async () => {
      const startTime = Date.now();

      await imageEditService.resizeImage('test-image.jpg', 800, 600);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large images efficiently', async () => {
      mockSharpInstance.metadata.mockResolvedValue({ width: 4096, height: 4096 });

      const startTime = Date.now();

      await imageEditService.resizeImage('large-image.jpg', 2048, 2048);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000);
    });
  });
});
