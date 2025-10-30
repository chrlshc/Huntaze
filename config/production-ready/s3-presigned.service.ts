/**
 * S3 Presigned URLs Service - Production Ready 2025
 * 
 * Features:
 * - IAM Role only (NO static keys)
 * - Content-Disposition for filename preservation
 * - Server-side encryption
 * - Expiration control
 * - Content-Type validation
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// NO ACCESS KEYS - IAM Role only
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.S3_BUCKET || 'huntaze-content';

// Allowed content types
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
];

// Max file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 500 * 1024 * 1024, // 500 MB
  document: 20 * 1024 * 1024, // 20 MB
};

interface PresignedUploadOptions {
  userId: string;
  fileName: string;
  contentType: string;
  expiresIn?: number; // seconds
}

interface PresignedDownloadOptions {
  key: string;
  expiresIn?: number; // seconds
  inline?: boolean; // true = view in browser, false = download
}

/**
 * Generate presigned URL for upload
 */
export async function generateUploadUrl(options: PresignedUploadOptions) {
  const { userId, fileName, contentType, expiresIn = 60 } = options;
  
  // Validate content type
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Content type ${contentType} not allowed`);
  }
  
  // Generate unique key
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(fileName);
  const key = `${userId}/${timestamp}-${sanitizedFileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentDisposition: `inline; filename="${encodeURIComponent(sanitizedFileName)}"`,
    ServerSideEncryption: 'AES256',
    Metadata: {
      'uploaded-by': userId,
      'original-filename': sanitizedFileName,
      'upload-timestamp': timestamp.toString(),
    },
  });
  
  const url = await getSignedUrl(s3Client, command, {
    expiresIn,
    signableHeaders: new Set(['content-type']),
  });
  
  return {
    url,
    key,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

/**
 * Generate presigned URL for download
 */
export async function generateDownloadUrl(options: PresignedDownloadOptions) {
  const { key, expiresIn = 3600, inline = true } = options;
  
  // Extract filename from key
  const fileName = key.split('/').pop() || 'download';
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: inline
      ? `inline; filename="${encodeURIComponent(fileName)}"`
      : `attachment; filename="${encodeURIComponent(fileName)}"`,
  });
  
  const url = await getSignedUrl(s3Client, command, {
    expiresIn,
  });
  
  return {
    url,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

/**
 * Sanitize filename to prevent path traversal
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .substring(0, 255); // Limit length
}

/**
 * Validate file size based on content type
 */
export function validateFileSize(contentType: string, size: number): boolean {
  if (contentType.startsWith('image/')) {
    return size <= MAX_FILE_SIZES.image;
  } else if (contentType.startsWith('video/')) {
    return size <= MAX_FILE_SIZES.video;
  } else if (contentType === 'application/pdf') {
    return size <= MAX_FILE_SIZES.document;
  }
  return false;
}

/**
 * Get max file size for content type
 */
export function getMaxFileSize(contentType: string): number {
  if (contentType.startsWith('image/')) {
    return MAX_FILE_SIZES.image;
  } else if (contentType.startsWith('video/')) {
    return MAX_FILE_SIZES.video;
  } else if (contentType === 'application/pdf') {
    return MAX_FILE_SIZES.document;
  }
  return 0;
}
