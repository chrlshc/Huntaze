/**
 * Asset Optimizer Service
 * Handles image optimization, multi-format generation, and S3/CloudFront integration
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import sharp from 'sharp';

// Types
export interface ImageInput {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

export interface OptimizedImage {
  formats: {
    avif?: Buffer;
    webp?: Buffer;
    jpeg?: Buffer;
  };
  sizes: {
    thumbnail: ImageSize;
    medium: ImageSize;
    large: ImageSize;
    original: ImageSize;
  };
  metadata: ImageMetadata;
}

export interface ImageSize {
  buffer: Buffer;
  width: number;
  height: number;
  fileSize: number;
}

export interface ImageMetadata {
  originalWidth: number;
  originalHeight: number;
  format: string;
  hasAlpha: boolean;
}

export interface S3UploadOptions {
  bucket: string;
  key: string;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface S3Object {
  bucket: string;
  key: string;
  url: string;
  cdnUrl?: string;
  etag?: string;
}

export interface ImageTransformations {
  width?: number;
  height?: number;
  format?: 'avif' | 'webp' | 'jpeg';
  quality?: number;
}

export interface AssetMetadata {
  id: string;
  originalKey: string;
  s3Key: string;
  cdnUrl: string;
  formats: {
    avif?: string;
    webp?: string;
    jpeg?: string;
  };
  sizes: {
    thumbnail: AssetSize;
    medium: AssetSize;
    large: AssetSize;
    original: AssetSize;
  };
  contentType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  uploadedAt: Date;
  lastModified: Date;
}

export interface AssetSize {
  url: string;
  width: number;
  height: number;
  fileSize: number;
}

// Configuration
const SIZE_CONFIGS = {
  thumbnail: { width: 150, height: 150 },
  medium: { width: 800, height: 800 },
  large: { width: 1920, height: 1920 },
} as const;

const QUALITY_SETTINGS = {
  avif: 75,
  webp: 80,
  jpeg: 85,
} as const;

const CACHE_CONTROL = 'public, max-age=31536000, immutable'; // 1 year

class AssetOptimizerService {
  private s3Client: S3Client;
  private cloudFrontClient: CloudFrontClient;
  private bucket: string;
  private cloudFrontDistributionId?: string;
  private cloudFrontDomain?: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    this.cloudFrontClient = new CloudFrontClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    this.bucket = process.env.AWS_S3_ASSETS_BUCKET || '';
    this.cloudFrontDistributionId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;
    this.cloudFrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
  }

  /**
   * Optimize an image: generate multiple formats and sizes
   */
  async optimizeImage(input: ImageInput): Promise<OptimizedImage> {
    const image = sharp(input.buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: missing dimensions');
    }

    const imageMetadata: ImageMetadata = {
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      format: metadata.format || 'unknown',
      hasAlpha: metadata.hasAlpha || false,
    };

    // Generate formats
    const formats = await this.generateFormats(image, imageMetadata);

    // Generate sizes
    const sizes = await this.generateSizes(image, imageMetadata);

    return {
      formats,
      sizes,
      metadata: imageMetadata,
    };
  }

  /**
   * Generate multiple formats (AVIF, WebP, JPEG)
   */
  private async generateFormats(
    image: sharp.Sharp,
    metadata: ImageMetadata
  ): Promise<OptimizedImage['formats']> {
    const formats: OptimizedImage['formats'] = {};

    try {
      // AVIF - best compression, modern browsers
      formats.avif = await image
        .clone()
        .avif({ quality: QUALITY_SETTINGS.avif })
        .toBuffer();
    } catch (error) {
      console.warn('AVIF generation failed:', error);
    }

    try {
      // WebP - good compression, wide support
      formats.webp = await image
        .clone()
        .webp({ quality: QUALITY_SETTINGS.webp })
        .toBuffer();
    } catch (error) {
      console.warn('WebP generation failed:', error);
    }

    // JPEG - fallback, universal support
    formats.jpeg = await image
      .clone()
      .jpeg({ quality: QUALITY_SETTINGS.jpeg, progressive: true })
      .toBuffer();

    return formats;
  }

  /**
   * Generate multiple sizes (thumbnail, medium, large, original)
   */
  private async generateSizes(
    image: sharp.Sharp,
    metadata: ImageMetadata
  ): Promise<OptimizedImage['sizes']> {
    const sizes: Partial<OptimizedImage['sizes']> = {};

    // Thumbnail
    const thumbnailBuffer = await image
      .clone()
      .resize(SIZE_CONFIGS.thumbnail.width, SIZE_CONFIGS.thumbnail.height, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer();
    
    const thumbnailMeta = await sharp(thumbnailBuffer).metadata();
    sizes.thumbnail = {
      buffer: thumbnailBuffer,
      width: thumbnailMeta.width || SIZE_CONFIGS.thumbnail.width,
      height: thumbnailMeta.height || SIZE_CONFIGS.thumbnail.height,
      fileSize: thumbnailBuffer.length,
    };

    // Medium
    const mediumBuffer = await image
      .clone()
      .resize(SIZE_CONFIGS.medium.width, SIZE_CONFIGS.medium.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();
    
    const mediumMeta = await sharp(mediumBuffer).metadata();
    sizes.medium = {
      buffer: mediumBuffer,
      width: mediumMeta.width || SIZE_CONFIGS.medium.width,
      height: mediumMeta.height || SIZE_CONFIGS.medium.height,
      fileSize: mediumBuffer.length,
    };

    // Large
    const largeBuffer = await image
      .clone()
      .resize(SIZE_CONFIGS.large.width, SIZE_CONFIGS.large.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();
    
    const largeMeta = await sharp(largeBuffer).metadata();
    sizes.large = {
      buffer: largeBuffer,
      width: largeMeta.width || SIZE_CONFIGS.large.width,
      height: largeMeta.height || SIZE_CONFIGS.large.height,
      fileSize: largeBuffer.length,
    };

    // Original
    const originalBuffer = await image.clone().toBuffer();
    sizes.original = {
      buffer: originalBuffer,
      width: metadata.originalWidth,
      height: metadata.originalHeight,
      fileSize: originalBuffer.length,
    };

    return sizes as OptimizedImage['sizes'];
  }

  /**
   * Upload a file to S3
   */
  async uploadToS3(file: Buffer, options: S3UploadOptions): Promise<S3Object> {
    const command = new PutObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
      Body: file,
      ContentType: options.contentType,
      CacheControl: options.cacheControl || CACHE_CONTROL,
      Metadata: options.metadata,
    });

    const response = await this.s3Client.send(command);

    const url = `https://${options.bucket}.s3.amazonaws.com/${options.key}`;
    const cdnUrl = this.cloudFrontDomain
      ? `https://${this.cloudFrontDomain}/${options.key}`
      : undefined;

    return {
      bucket: options.bucket,
      key: options.key,
      url,
      cdnUrl,
      etag: response.ETag,
    };
  }

  /**
   * Upload optimized image with all formats and sizes
   */
  async uploadOptimizedImage(
    optimized: OptimizedImage,
    baseKey: string
  ): Promise<AssetMetadata> {
    const uploadPromises: Promise<S3Object>[] = [];
    const formats: AssetMetadata['formats'] = {};
    const sizes: Partial<AssetMetadata['sizes']> = {};

    // Upload all format/size combinations
    for (const [formatName, formatBuffer] of Object.entries(optimized.formats)) {
      if (!formatBuffer) continue;

      for (const [sizeName, sizeData] of Object.entries(optimized.sizes)) {
        const key = `${baseKey}/${sizeName}.${formatName}`;
        const contentType = `image/${formatName}`;

        uploadPromises.push(
          this.uploadToS3(sizeData.buffer, {
            bucket: this.bucket,
            key,
            contentType,
            metadata: {
              width: sizeData.width.toString(),
              height: sizeData.height.toString(),
              size: sizeName,
              format: formatName,
            },
          })
        );
      }
    }

    const results = await Promise.all(uploadPromises);

    // Organize results
    results.forEach((result) => {
      const parts = result.key.split('/');
      const filename = parts[parts.length - 1];
      const [sizeName, formatName] = filename.split('.');

      if (!formats[formatName as keyof typeof formats]) {
        formats[formatName as keyof typeof formats] = result.cdnUrl || result.url;
      }

      const sizeData = optimized.sizes[sizeName as keyof typeof optimized.sizes];
      if (sizeData && !sizes[sizeName as keyof typeof sizes]) {
        sizes[sizeName as keyof typeof sizes] = {
          url: result.cdnUrl || result.url,
          width: sizeData.width,
          height: sizeData.height,
          fileSize: sizeData.fileSize,
        };
      }
    });

    const now = new Date();

    return {
      id: baseKey,
      originalKey: baseKey,
      s3Key: baseKey,
      cdnUrl: this.cloudFrontDomain
        ? `https://${this.cloudFrontDomain}/${baseKey}`
        : `https://${this.bucket}.s3.amazonaws.com/${baseKey}`,
      formats,
      sizes: sizes as AssetMetadata['sizes'],
      contentType: 'image/jpeg',
      fileSize: optimized.sizes.original.fileSize,
      dimensions: {
        width: optimized.metadata.originalWidth,
        height: optimized.metadata.originalHeight,
      },
      uploadedAt: now,
      lastModified: now,
    };
  }

  /**
   * Generate CloudFront URL with optional transformations
   */
  generateCDNUrl(key: string, transformations?: ImageTransformations): string {
    if (!this.cloudFrontDomain) {
      return `https://${this.bucket}.s3.amazonaws.com/${key}`;
    }

    let url = `https://${this.cloudFrontDomain}/${key}`;

    if (transformations) {
      const params = new URLSearchParams();
      
      if (transformations.width) params.append('w', transformations.width.toString());
      if (transformations.height) params.append('h', transformations.height.toString());
      if (transformations.format) params.append('f', transformations.format);
      if (transformations.quality) params.append('q', transformations.quality.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return url;
  }

  /**
   * Invalidate CloudFront cache for specific paths
   */
  async invalidateCache(paths: string[]): Promise<void> {
    if (!this.cloudFrontDistributionId) {
      console.warn('CloudFront distribution ID not configured, skipping cache invalidation');
      return;
    }

    const command = new CreateInvalidationCommand({
      DistributionId: this.cloudFrontDistributionId,
      InvalidationBatch: {
        CallerReference: `invalidation-${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths.map(path => path.startsWith('/') ? path : `/${path}`),
        },
      },
    });

    await this.cloudFrontClient.send(command);
  }

  /**
   * Check if an object exists in S3
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
let assetOptimizerInstance: AssetOptimizerService | null = null;

export function getAssetOptimizer(): AssetOptimizerService {
  if (!assetOptimizerInstance) {
    assetOptimizerInstance = new AssetOptimizerService();
  }
  return assetOptimizerInstance;
}

// For testing: reset singleton
export function resetAssetOptimizer(): void {
  assetOptimizerInstance = null;
}

export default AssetOptimizerService;
