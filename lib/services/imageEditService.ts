import sharp from 'sharp';
import { s3Service } from './s3Service';
import { mediaAssetsRepository } from '../db/repositories/mediaAssetsRepository';

export interface ImageEditOptions {
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  resize?: {
    width: number;
    height: number;
  };
  rotate?: number; // degrees
  flip?: 'horizontal' | 'vertical';
  adjustments?: {
    brightness?: number; // -100 to 100
    contrast?: number; // -100 to 100
    saturation?: number; // -100 to 100
  };
  filters?: string[]; // 'grayscale', 'sepia', 'blur', 'sharpen'
  textOverlays?: Array<{
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
  }>;
}

export const imageEditService = {
  /**
   * Apply edits to an image
   */
  async editImage(
    imageBuffer: Buffer,
    options: ImageEditOptions
  ): Promise<Buffer> {
    let image = sharp(imageBuffer);

    // Apply crop
    if (options.crop) {
      image = image.extract({
        left: Math.round(options.crop.x),
        top: Math.round(options.crop.y),
        width: Math.round(options.crop.width),
        height: Math.round(options.crop.height),
      });
    }

    // Apply resize
    if (options.resize) {
      image = image.resize(options.resize.width, options.resize.height, {
        fit: 'cover',
      });
    }

    // Apply rotation
    if (options.rotate) {
      image = image.rotate(options.rotate);
    }

    // Apply flip
    if (options.flip === 'horizontal') {
      image = image.flop();
    } else if (options.flip === 'vertical') {
      image = image.flip();
    }

    // Apply adjustments
    if (options.adjustments) {
      const modulate: any = {};
      
      if (options.adjustments.brightness !== undefined) {
        // Convert -100 to 100 range to 0.5 to 1.5
        modulate.brightness = 1 + (options.adjustments.brightness / 100);
      }
      
      if (options.adjustments.saturation !== undefined) {
        // Convert -100 to 100 range to 0 to 2
        modulate.saturation = 1 + (options.adjustments.saturation / 100);
      }

      if (Object.keys(modulate).length > 0) {
        image = image.modulate(modulate);
      }

      // Contrast adjustment
      if (options.adjustments.contrast !== undefined) {
        const contrastValue = 1 + (options.adjustments.contrast / 100);
        image = image.linear(contrastValue, -(128 * contrastValue) + 128);
      }
    }

    // Apply filters
    if (options.filters) {
      for (const filter of options.filters) {
        switch (filter) {
          case 'grayscale':
            image = image.grayscale();
            break;
          case 'blur':
            image = image.blur(5);
            break;
          case 'sharpen':
            image = image.sharpen();
            break;
        }
      }
    }

    // Convert to buffer
    return await image.jpeg({ quality: 90 }).toBuffer();
  },

  /**
   * Save edited image
   */
  async saveEditedImage(
    userId: string,
    originalMediaId: string,
    editedBuffer: Buffer,
    options: ImageEditOptions
  ): Promise<{ id: string; url: string }> {
    // Get original media
    const originalMedia = await mediaAssetsRepository.findById(originalMediaId);
    if (!originalMedia) {
      throw new Error('Original media not found');
    }

    // Generate new filename
    const timestamp = Date.now();
    const newFilename = `edited-${timestamp}-${originalMedia.filename}`;

    // Upload to S3
    const key = s3Service.generateKey(userId, newFilename, 'image');
    const url = await s3Service.upload({
      key,
      body: editedBuffer,
      contentType: 'image/jpeg',
      metadata: {
        userId,
        originalMediaId,
        edits: JSON.stringify(options),
      },
    });

    // Get dimensions
    const metadata = await sharp(editedBuffer).metadata();

    // Create new media record
    const newMedia = await mediaAssetsRepository.create({
      userId,
      type: 'image',
      filename: newFilename,
      originalUrl: url,
      sizeBytes: editedBuffer.length,
      width: metadata.width,
      height: metadata.height,
      mimeType: 'image/jpeg',
      metadata: {
        originalMediaId,
        edits: options,
      },
    });

    return {
      id: newMedia.id,
      url: newMedia.originalUrl,
    };
  },
};
