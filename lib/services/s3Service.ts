/**
 * S3 Service
 * 
 * Production-ready AWS S3 integration with:
 * - Automatic retry with exponential backoff
 * - Structured error handling with correlation IDs
 * - Comprehensive TypeScript types
 * - Performance monitoring and logging
 * - Content-type detection and cache control
 * - CDN URL generation
 * 
 * @example
 * ```typescript
 * import { s3Service } from '@/lib/services/s3Service';
 * 
 * // Upload file
 * const url = await s3Service.upload({
 *   key: 'users/123/images/avatar.jpg',
 *   body: buffer,
 * });
 * 
 * // Check if file exists
 * const exists = await s3Service.exists('users/123/images/avatar.jpg');
 * 
 * // Delete file
 * await s3Service.delete('users/123/images/avatar.jpg');
 * ```
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('s3-service');

// ============================================================================
// Configuration
// ============================================================================

// Lazy initialization to ensure environment variables are loaded
let s3Client: S3Client | null = null;
let clientInitialized = false;

// Getter functions for configuration values (evaluated at runtime)
function getBucketName(): string {
  return process.env.AWS_S3_BUCKET || 'huntaze-beta-assets';
}

function getCdnUrl(): string {
  const bucket = getBucketName();
  return process.env.CDN_URL || `https://${bucket}.s3.amazonaws.com`;
}

function getAwsRegion(): string {
  return process.env.AWS_REGION || 'us-east-1';
}

/**
 * Get or create S3 client with lazy initialization
 * Implements singleton pattern with environment variable validation
 * 
 * @returns Configured S3Client instance
 * @throws {S3Error} If credentials are missing in production
 */
function getS3Client(): S3Client {
  // Return cached client if already initialized (performance optimization)
  if (s3Client && clientInitialized) {
    return s3Client;
  }
  
  const AWS_REGION = getAwsRegion();
  const correlationId = generateCorrelationId('s3-init');
  
  // Validate required environment variables
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!hasAccessKey || !hasSecretKey) {
    const errorMsg = 'AWS credentials not configured';
    logger.error(errorMsg, new Error(errorMsg), {
      correlationId,
      hasAccessKeyId: hasAccessKey,
      hasSecretAccessKey: hasSecretKey,
      nodeEnv: process.env.NODE_ENV,
    });
    
    // In production, throw error instead of just warning
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AWS S3 credentials are required in production environment');
    }
    
    logger.warn('Proceeding with empty credentials (non-production environment)', {
      correlationId,
    });
  }

  try {
    // Initialize S3 client with retry configuration
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
      },
      // Add request timeout and retry configuration
      requestHandler: {
        requestTimeout: 30000, // 30 seconds
      },
      maxAttempts: 3, // SDK-level retries (in addition to our custom retry logic)
    });

    clientInitialized = true;
    
    logger.info('S3 service initialized', {
      correlationId,
      bucket: getBucketName(),
      region: AWS_REGION,
      cdnUrl: getCdnUrl(),
      hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
    });
    
    return s3Client;
  } catch (error) {
    logger.error('Failed to initialize S3 client', error as Error, {
      correlationId,
      region: AWS_REGION,
    });
    throw error;
  }
}

/**
 * Reset S3 client (useful for testing)
 * @internal
 */
export function resetS3Client(): void {
  s3Client = null;
  clientInitialized = false;
  logger.info('S3 client reset');
}

// Legacy constants for backward compatibility (but use getters in new code)
const BUCKET_NAME = getBucketName();
const CDN_URL = getCdnUrl();
const AWS_REGION = getAwsRegion();

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Upload options for S3
 */
export interface UploadOptions {
  key: string;
  body: Buffer;
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

/**
 * S3 object metadata
 */
export interface S3ObjectMetadata {
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  etag?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  versionId?: string;
}

/**
 * S3 service error types
 */
export enum S3ErrorType {
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INVALID_KEY = 'INVALID_KEY',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CREDENTIALS_ERROR = 'CREDENTIALS_ERROR',
}

/**
 * Structured S3 error
 */
export class S3Error extends Error {
  constructor(
    public type: S3ErrorType,
    message: string,
    public correlationId: string,
    public retryable: boolean = false,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'S3Error';
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Content-Type mapping for common file types
 */
const CONTENT_TYPES: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  
  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  
  // Documents
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  
  // Web assets
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.html': 'text/html',
  
  // Media
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
};

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
};

/**
 * Retryable AWS error codes
 */
const RETRYABLE_ERROR_CODES = [
  'RequestTimeout',
  'RequestTimeoutException',
  'PriorRequestNotComplete',
  'ConnectionError',
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH',
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Check error code
  if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
    return true;
  }
  
  // Check error name
  if (error.name && RETRYABLE_ERROR_CODES.includes(error.name)) {
    return true;
  }
  
  // Check status code (5xx errors are retryable)
  if (error.$metadata?.httpStatusCode >= 500) {
    return true;
  }
  
  return false;
}

/**
 * Retry operation with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  attempt: number = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const retryable = isRetryableError(error);
    
    if (!retryable || attempt >= config.maxRetries) {
      logger.error('S3 operation failed after retries', error, {
        correlationId,
        attempt,
        retryable,
        errorCode: error.code,
        errorName: error.name,
      });
      throw error;
    }
    
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay
    );
    
    logger.warn('Retrying S3 operation', {
      correlationId,
      attempt,
      delay,
      error: error.message,
      errorCode: error.code,
    });
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, config, attempt + 1);
  }
}

/**
 * Get content type from file extension
 * 
 * @param key - S3 object key
 * @returns Content-Type header value
 */
function getContentTypeFromKey(key: string): string {
  const ext = key.substring(key.lastIndexOf('.')).toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

/**
 * Get cache control policy based on file type
 * 
 * @param key - S3 object key
 * @returns Cache-Control header value
 */
function getCacheControl(key: string): string {
  const filename = key.toLowerCase();
  
  // Immutable assets (Next.js build files with hash)
  if (filename.includes('/_next/static/') || /\.[a-f0-9]{8,}\.(js|css|woff2?)$/.test(filename)) {
    return 'public, max-age=31536000, immutable';
  }
  
  // Images and fonts
  if (/\.(jpg|jpeg|png|gif|webp|avif|woff2?|ttf|otf)$/.test(filename)) {
    return 'public, max-age=2592000'; // 30 days
  }
  
  // HTML and JSON
  if (/\.(html|json)$/.test(filename)) {
    return 'public, max-age=3600'; // 1 hour
  }
  
  // Default
  return 'public, max-age=2592000'; // 30 days
}

/**
 * Validate S3 key format
 * 
 * @param key - S3 object key to validate
 * @throws {S3Error} If key is invalid
 */
function validateKey(key: string, correlationId: string): void {
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new S3Error(
      S3ErrorType.INVALID_KEY,
      'S3 key must be a non-empty string',
      correlationId,
      false,
      { key }
    );
  }
  
  // Check for invalid characters
  if (/[^a-zA-Z0-9!_.*'()\/-]/.test(key)) {
    throw new S3Error(
      S3ErrorType.INVALID_KEY,
      'S3 key contains invalid characters',
      correlationId,
      false,
      { key }
    );
  }
  
  // Check length (S3 max key length is 1024 bytes)
  if (key.length > 1024) {
    throw new S3Error(
      S3ErrorType.INVALID_KEY,
      'S3 key exceeds maximum length of 1024 characters',
      correlationId,
      false,
      { key, length: key.length }
    );
  }
}

// ============================================================================
// S3 Service
// ============================================================================

export const s3Service = {
  /**
   * Upload file to S3 with automatic content-type detection and retry logic
   * 
   * @param options - Upload options
   * @returns CDN URL of uploaded file
   * @throws {S3Error} If upload fails after retries
   * 
   * @example
   * ```typescript
   * const url = await s3Service.upload({
   *   key: 'users/123/images/avatar.jpg',
   *   body: buffer,
   * });
   * console.log('Uploaded to:', url);
   * ```
   */
  async upload(options: UploadOptions): Promise<string> {
    const correlationId = generateCorrelationId('s3-upload');
    const startTime = Date.now();
    
    try {
      // Validate key
      validateKey(options.key, correlationId);
      
      // Validate body
      if (!options.body || !Buffer.isBuffer(options.body)) {
        throw new S3Error(
          S3ErrorType.UPLOAD_FAILED,
          'Upload body must be a Buffer',
          correlationId,
          false,
          { hasBody: !!options.body, isBuffer: Buffer.isBuffer(options.body) }
        );
      }
      
      const contentType = options.contentType || getContentTypeFromKey(options.key);
      const cacheControl = options.cacheControl || getCacheControl(options.key);
      
      logger.info('Uploading file to S3', {
        correlationId,
        key: options.key,
        contentType,
        cacheControl,
        size: options.body.length,
      });
      
      // Upload with retry
      await retryWithBackoff(
        async () => {
          const command = new PutObjectCommand({
            Bucket: getBucketName(),
            Key: options.key,
            Body: options.body,
            ContentType: contentType,
            CacheControl: cacheControl,
            Metadata: {
              ...options.metadata,
              'uploaded-at': new Date().toISOString(),
              'correlation-id': correlationId,
            },
          });
          
          return await getS3Client().send(command);
        },
        correlationId
      );
      
      const duration = Date.now() - startTime;
      const url = `${getCdnUrl()}/${options.key}`;
      
      logger.info('File uploaded successfully', {
        correlationId,
        key: options.key,
        url,
        duration,
        size: options.body.length,
      });
      
      return url;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error instanceof S3Error) {
        throw error;
      }
      
      // Map AWS errors to S3Error
      let errorType = S3ErrorType.UPLOAD_FAILED;
      let retryable = isRetryableError(error);
      
      if (error.name === 'AccessDenied' || error.code === 'AccessDenied') {
        errorType = S3ErrorType.ACCESS_DENIED;
        retryable = false;
      } else if (error.name === 'NoSuchBucket' || error.code === 'NoSuchBucket') {
        errorType = S3ErrorType.UPLOAD_FAILED;
        retryable = false;
      } else if (error.code === 'CredentialsError') {
        errorType = S3ErrorType.CREDENTIALS_ERROR;
        retryable = false;
      }
      
      logger.error('Upload failed', error, {
        correlationId,
        key: options.key,
        duration,
        errorCode: error.code,
        errorName: error.name,
      });
      
      throw new S3Error(
        errorType,
        `Failed to upload file: ${error.message}`,
        correlationId,
        retryable,
        {
          key: options.key,
          originalError: error.message,
          errorCode: error.code,
        }
      );
    }
  },

  /**
   * Delete file from S3 with retry logic
   * 
   * @param key - S3 object key to delete
   * @throws {S3Error} If deletion fails after retries
   * 
   * @example
   * ```typescript
   * await s3Service.delete('users/123/images/avatar.jpg');
   * ```
   */
  async delete(key: string): Promise<void> {
    const correlationId = generateCorrelationId('s3-delete');
    const startTime = Date.now();
    
    try {
      // Validate key
      validateKey(key, correlationId);
      
      logger.info('Deleting file from S3', {
        correlationId,
        key,
      });
      
      // Delete with retry
      await retryWithBackoff(
        async () => {
          const command = new DeleteObjectCommand({
            Bucket: getBucketName(),
            Key: key,
          });
          
          return await getS3Client().send(command);
        },
        correlationId
      );
      
      const duration = Date.now() - startTime;
      
      logger.info('File deleted successfully', {
        correlationId,
        key,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error instanceof S3Error) {
        throw error;
      }
      
      // Map AWS errors to S3Error
      let errorType = S3ErrorType.DELETE_FAILED;
      let retryable = isRetryableError(error);
      
      if (error.name === 'AccessDenied' || error.code === 'AccessDenied') {
        errorType = S3ErrorType.ACCESS_DENIED;
        retryable = false;
      } else if (error.name === 'NoSuchKey' || error.code === 'NoSuchKey') {
        // Not an error - object doesn't exist (idempotent delete)
        logger.info('Object not found during delete (idempotent)', {
          correlationId,
          key,
        });
        return;
      }
      
      logger.error('Delete failed', error, {
        correlationId,
        key,
        duration,
        errorCode: error.code,
        errorName: error.name,
      });
      
      throw new S3Error(
        errorType,
        `Failed to delete file: ${error.message}`,
        correlationId,
        retryable,
        {
          key,
          originalError: error.message,
          errorCode: error.code,
        }
      );
    }
  },

  /**
   * Get signed URL for temporary access to private objects
   * 
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL for temporary access
   * @throws {S3Error} If URL generation fails
   * 
   * @example
   * ```typescript
   * const url = await s3Service.getSignedUrl('users/123/private/document.pdf', 3600);
   * console.log('Temporary URL:', url);
   * ```
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const correlationId = generateCorrelationId('s3-signed-url');
    const startTime = Date.now();
    
    try {
      // Validate key
      validateKey(key, correlationId);
      
      // Validate expiresIn
      if (typeof expiresIn !== 'number' || expiresIn <= 0 || expiresIn > 604800) {
        throw new S3Error(
          S3ErrorType.INVALID_KEY,
          'expiresIn must be between 1 and 604800 seconds (7 days)',
          correlationId,
          false,
          { expiresIn }
        );
      }
      
      logger.info('Generating signed URL', {
        correlationId,
        key,
        expiresIn,
      });
      
      const command = new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      });
      
      const url = await getSignedUrl(getS3Client(), command, { expiresIn });
      
      const duration = Date.now() - startTime;
      
      logger.info('Signed URL generated', {
        correlationId,
        key,
        expiresIn,
        duration,
      });
      
      return url;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error instanceof S3Error) {
        throw error;
      }
      
      logger.error('Failed to generate signed URL', error, {
        correlationId,
        key,
        duration,
        errorCode: error.code,
        errorName: error.name,
      });
      
      throw new S3Error(
        S3ErrorType.UPLOAD_FAILED,
        `Failed to generate signed URL: ${error.message}`,
        correlationId,
        false,
        {
          key,
          originalError: error.message,
          errorCode: error.code,
        }
      );
    }
  },

  /**
   * Generate unique S3 key for file upload
   * 
   * @param userId - User ID
   * @param filename - Original filename
   * @param type - File type (image or video)
   * @returns Generated S3 key
   * 
   * @example
   * ```typescript
   * const key = s3Service.generateKey('123', 'avatar.jpg', 'image');
   * // Returns: 'users/123/images/1234567890-abc123.jpg'
   * ```
   */
  generateKey(userId: string, filename: string, type: 'image' | 'video'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = filename.split('.').pop()?.toLowerCase() || 'bin';
    
    // Sanitize extension (remove any non-alphanumeric characters)
    const sanitizedExtension = extension.replace(/[^a-z0-9]/g, '');
    
    return `users/${userId}/${type}s/${timestamp}-${randomString}.${sanitizedExtension}`;
  },

  /**
   * Extract S3 key from CDN URL
   * 
   * @param url - CDN URL
   * @returns S3 object key
   * 
   * @example
   * ```typescript
   * const key = s3Service.extractKeyFromUrl('https://cdn.example.com/users/123/images/avatar.jpg');
   * // Returns: 'users/123/images/avatar.jpg'
   * ```
   */
  extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading slash
    } catch (error) {
      logger.warn('Failed to parse URL', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return url; // Return as-is if not a valid URL
    }
  },

  /**
   * Check if object exists in S3
   * 
   * @param key - S3 object key
   * @returns True if object exists, false otherwise
   * @throws {S3Error} If check fails (excluding NotFound)
   * 
   * @example
   * ```typescript
   * const exists = await s3Service.exists('users/123/images/avatar.jpg');
   * if (exists) {
   *   console.log('File exists');
   * }
   * ```
   */
  async exists(key: string): Promise<boolean> {
    const correlationId = generateCorrelationId('s3-exists');
    const startTime = Date.now();
    
    try {
      // Validate key
      validateKey(key, correlationId);
      
      logger.info('Checking if object exists', {
        correlationId,
        key,
      });
      
      // Check with retry
      await retryWithBackoff(
        async () => {
          const command = new HeadObjectCommand({
            Bucket: getBucketName(),
            Key: key,
          });
          
          return await getS3Client().send(command);
        },
        correlationId
      );
      
      const duration = Date.now() - startTime;
      
      logger.info('Object exists', {
        correlationId,
        key,
        duration,
      });
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // NotFound is expected - return false
      if (error.name === 'NotFound' || error.code === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        logger.info('Object not found', {
          correlationId,
          key,
          duration,
        });
        return false;
      }
      
      // Other errors should be thrown
      if (error instanceof S3Error) {
        throw error;
      }
      
      logger.error('Failed to check object existence', error, {
        correlationId,
        key,
        duration,
        errorCode: error.code,
        errorName: error.name,
      });
      
      throw new S3Error(
        S3ErrorType.NETWORK_ERROR,
        `Failed to check if object exists: ${error.message}`,
        correlationId,
        isRetryableError(error),
        {
          key,
          originalError: error.message,
          errorCode: error.code,
        }
      );
    }
  },

  /**
   * Get object metadata from S3
   * 
   * @param key - S3 object key
   * @returns Object metadata
   * @throws {S3Error} If object not found or metadata fetch fails
   * 
   * @example
   * ```typescript
   * const metadata = await s3Service.getMetadata('users/123/images/avatar.jpg');
   * console.log('Content-Type:', metadata.contentType);
   * console.log('Size:', metadata.contentLength);
   * ```
   */
  async getMetadata(key: string): Promise<S3ObjectMetadata> {
    const correlationId = generateCorrelationId('s3-metadata');
    const startTime = Date.now();
    
    try {
      // Validate key
      validateKey(key, correlationId);
      
      logger.info('Fetching object metadata', {
        correlationId,
        key,
      });
      
      // Fetch with retry
      const response = await retryWithBackoff(
        async () => {
          const command = new HeadObjectCommand({
            Bucket: getBucketName(),
            Key: key,
          });
          
          return await getS3Client().send(command);
        },
        correlationId
      );
      
      const duration = Date.now() - startTime;
      
      const metadata: S3ObjectMetadata = {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata,
        cacheControl: response.CacheControl,
        versionId: response.VersionId,
      };
      
      logger.info('Metadata fetched successfully', {
        correlationId,
        key,
        duration,
        contentType: metadata.contentType,
        contentLength: metadata.contentLength,
      });
      
      return metadata;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error instanceof S3Error) {
        throw error;
      }
      
      // Map AWS errors to S3Error
      let errorType = S3ErrorType.NETWORK_ERROR;
      let retryable = isRetryableError(error);
      
      if (error.name === 'NotFound' || error.code === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        errorType = S3ErrorType.NOT_FOUND;
        retryable = false;
      } else if (error.name === 'AccessDenied' || error.code === 'AccessDenied') {
        errorType = S3ErrorType.ACCESS_DENIED;
        retryable = false;
      }
      
      logger.error('Failed to fetch metadata', error, {
        correlationId,
        key,
        duration,
        errorCode: error.code,
        errorName: error.name,
      });
      
      throw new S3Error(
        errorType,
        `Failed to fetch metadata: ${error.message}`,
        correlationId,
        retryable,
        {
          key,
          originalError: error.message,
          errorCode: error.code,
        }
      );
    }
  },
};
