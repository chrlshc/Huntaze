import { s3Service } from './s3Service';
import { thumbnailService } from './thumbnailService';
import { mediaAssetsRepository } from '../db/repositories/mediaAssetsRepository';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export interface UploadResult {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  size: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const mediaUploadService = {
  /**
   * Validate file before upload
   */
  validateFile(file: File, type: 'image' | 'video'): ValidationError | null {
    // Check file type
    if (type === 'image') {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
          field: 'file',
          message: `Invalid image type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        };
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return {
          field: 'file',
          message: `Image size exceeds maximum of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        };
      }
    } else if (type === 'video') {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return {
          field: 'file',
          message: `Invalid video type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
        };
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return {
          field: 'file',
          message: `Video size exceeds maximum of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
        };
      }
    }

    return null;
  },

  /**
   * Check storage quota
   */
  async checkStorageQuota(userId: string, fileSize: number): Promise<boolean> {
    const quota = await mediaAssetsRepository.getStorageUsage(userId);
    return (quota.usedBytes + fileSize) <= quota.quotaBytes;
  },

  /**
   * Upload media file
   */
  async uploadMedia(
    userId: string,
    file: Buffer,
    filename: string,
    mimeType: string,
    metadata?: {
      width?: number;
      height?: number;
      duration?: number;
    }
  ): Promise<UploadResult> {
    // Determine type
    const type: 'image' | 'video' = mimeType.startsWith('image/') ? 'image' : 'video';

    // Check storage quota
    const hasQuota = await this.checkStorageQuota(userId, file.length);
    if (!hasQuota) {
      throw new Error('Storage quota exceeded');
    }

    // Get metadata if not provided
    let width = metadata?.width;
    let height = metadata?.height;
    let duration = metadata?.duration;

    if (type === 'image' && (!width || !height)) {
      const dimensions = await thumbnailService.getImageDimensions(file);
      width = dimensions.width;
      height = dimensions.height;
    } else if (type === 'video' && (!width || !height || !duration)) {
      const videoMetadata = await thumbnailService.getVideoMetadata(file);
      width = videoMetadata.width;
      height = videoMetadata.height;
      duration = videoMetadata.duration;
    }

    // Generate S3 key
    const key = s3Service.generateKey(userId, filename, type);

    // Upload to S3
    const url = await s3Service.upload({
      key,
      body: file,
      contentType: mimeType,
      metadata: {
        userId,
        originalFilename: filename,
      },
    });

    // Generate and upload thumbnail
    let thumbnailUrl: string | undefined;
    try {
      thumbnailUrl = await thumbnailService.processAndUploadThumbnail(
        userId,
        file,
        filename,
        type
      );
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      // Continue without thumbnail
    }

    // Create database record
    const mediaAsset = await mediaAssetsRepository.create({
      userId,
      type,
      filename,
      originalUrl: url,
      thumbnailUrl,
      sizeBytes: file.length,
      width,
      height,
      durationSeconds: duration,
      mimeType,
    });

    return {
      id: mediaAsset.id,
      url: mediaAsset.originalUrl,
      thumbnailUrl: mediaAsset.thumbnailUrl,
      type: mediaAsset.type,
      size: mediaAsset.sizeBytes,
      width: mediaAsset.width,
      height: mediaAsset.height,
      duration: mediaAsset.durationSeconds,
    };
  },

  /**
   * Delete media file
   */
  async deleteMedia(userId: string, mediaId: string): Promise<void> {
    // Get media asset
    const media = await mediaAssetsRepository.findById(mediaId);
    
    if (!media) {
      throw new Error('Media not found');
    }

    if (media.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Check if media is used in content
    const isUsed = await mediaAssetsRepository.isUsedInContent(mediaId);
    if (isUsed) {
      throw new Error('Cannot delete media that is used in content');
    }

    // Delete from S3
    const key = s3Service.extractKeyFromUrl(media.originalUrl);
    await s3Service.delete(key);

    // Delete thumbnail if exists
    if (media.thumbnailUrl) {
      const thumbnailKey = s3Service.extractKeyFromUrl(media.thumbnailUrl);
      await s3Service.delete(thumbnailKey);
    }

    // Delete from database
    await mediaAssetsRepository.delete(mediaId);
  },

  /**
   * Get storage usage
   */
  async getStorageUsage(userId: string): Promise<{
    used: number;
    quota: number;
    percentage: number;
  }> {
    const quota = await mediaAssetsRepository.getStorageUsage(userId);
    
    return {
      used: quota.usedBytes,
      quota: quota.quotaBytes,
      percentage: Math.round((quota.usedBytes / quota.quotaBytes) * 100),
    };
  },
};
