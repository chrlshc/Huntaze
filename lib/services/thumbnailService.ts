import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { s3Service } from './s3Service';

const execAsync = promisify(exec);

const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;
const VIDEO_THUMBNAIL_WIDTH = 640;
const VIDEO_THUMBNAIL_HEIGHT = 360;

export const thumbnailService = {
  /**
   * Generate thumbnail for image using Sharp
   */
  async generateImageThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      console.error('Image thumbnail generation error:', error);
      throw new Error('Failed to generate image thumbnail');
    }
  },

  /**
   * Generate thumbnail for video using FFmpeg
   */
  async generateVideoThumbnail(videoBuffer: Buffer): Promise<Buffer> {
    const tempDir = '/tmp';
    const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
    const thumbnailPath = path.join(tempDir, `thumb-${Date.now()}.jpg`);

    try {
      // Write video buffer to temp file
      await writeFile(videoPath, videoBuffer);

      // Extract frame at 1 second using FFmpeg
      const ffmpegCommand = `ffmpeg -i ${videoPath} -ss 00:00:01 -vframes 1 -vf scale=${VIDEO_THUMBNAIL_WIDTH}:${VIDEO_THUMBNAIL_HEIGHT} ${thumbnailPath}`;
      
      await execAsync(ffmpegCommand);

      // Read thumbnail
      const thumbnailBuffer = await sharp(thumbnailPath)
        .jpeg({ quality: 80 })
        .toBuffer();

      // Cleanup temp files
      await unlink(videoPath).catch(() => {});
      await unlink(thumbnailPath).catch(() => {});

      return thumbnailBuffer;
    } catch (error) {
      // Cleanup on error
      await unlink(videoPath).catch(() => {});
      await unlink(thumbnailPath).catch(() => {});
      
      console.error('Video thumbnail generation error:', error);
      throw new Error('Failed to generate video thumbnail');
    }
  },

  /**
   * Upload thumbnail to S3
   */
  async uploadThumbnail(
    userId: string,
    thumbnailBuffer: Buffer,
    originalFilename: string,
    type: 'image' | 'video'
  ): Promise<string> {
    const key = s3Service.generateKey(userId, `thumb-${originalFilename}`, type);

    const url = await s3Service.upload({
      key,
      body: thumbnailBuffer,
      contentType: 'image/jpeg',
      metadata: {
        userId,
        type: 'thumbnail',
      },
    });

    return url;
  },

  /**
   * Generate and upload thumbnail
   */
  async processAndUploadThumbnail(
    userId: string,
    mediaBuffer: Buffer,
    filename: string,
    type: 'image' | 'video'
  ): Promise<string> {
    let thumbnailBuffer: Buffer;

    if (type === 'image') {
      thumbnailBuffer = await this.generateImageThumbnail(mediaBuffer);
    } else {
      thumbnailBuffer = await this.generateVideoThumbnail(mediaBuffer);
    }

    const thumbnailUrl = await this.uploadThumbnail(userId, thumbnailBuffer, filename, type);
    
    return thumbnailUrl;
  },

  /**
   * Get image dimensions
   */
  async getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    } catch (error) {
      console.error('Get image dimensions error:', error);
      return { width: 0, height: 0 };
    }
  },

  /**
   * Get video metadata using FFprobe
   */
  async getVideoMetadata(videoBuffer: Buffer): Promise<{
    width: number;
    height: number;
    duration: number;
  }> {
    const tempDir = '/tmp';
    const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);

    try {
      // Write video buffer to temp file
      await writeFile(videoPath, videoBuffer);

      // Get metadata using FFprobe
      const ffprobeCommand = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json ${videoPath}`;
      
      const { stdout } = await execAsync(ffprobeCommand);
      const metadata = JSON.parse(stdout);

      // Cleanup
      await unlink(videoPath).catch(() => {});

      const stream = metadata.streams?.[0] || {};
      
      return {
        width: stream.width || 0,
        height: stream.height || 0,
        duration: Math.round(parseFloat(stream.duration || '0')),
      };
    } catch (error) {
      // Cleanup on error
      await unlink(videoPath).catch(() => {});
      
      console.error('Get video metadata error:', error);
      return { width: 0, height: 0, duration: 0 };
    }
  },
};
