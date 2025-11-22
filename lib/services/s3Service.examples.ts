/**
 * S3 Service Usage Examples
 * 
 * Practical examples demonstrating best practices for using the S3 service.
 * 
 * @see lib/services/s3Service.README.md for complete documentation
 */

import { s3Service, S3Error, S3ErrorType } from './s3Service';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('s3-examples');

// ============================================================================
// Example 1: Basic File Upload
// ============================================================================

/**
 * Upload a user avatar image
 */
export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<string> {
  try {
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique key
    const key = s3Service.generateKey(userId, file.name, 'image');
    
    // Upload to S3
    const url = await s3Service.upload({
      key,
      body: buffer,
      metadata: {
        userId,
        originalFilename: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });
    
    logger.info('Avatar uploaded', { userId, url });
    
    return url;
  } catch (error) {
    if (error instanceof S3Error) {
      logger.error('Failed to upload avatar', error, {
        userId,
        errorType: error.type,
        retryable: error.retryable,
      });
    }
    throw error;
  }
}

// ============================================================================
// Example 2: Upload with Retry Logic
// ============================================================================

/**
 * Upload file with custom retry logic
 */
export async function uploadWithRetry(
  key: string,
  buffer: Buffer,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = await s3Service.upload({ key, body: buffer });
      
      logger.info('Upload successful', {
        key,
        attempt,
        url,
      });
      
      return url;
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof S3Error && !error.retryable) {
        // Don't retry non-retryable errors
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        logger.warn('Upload failed, retrying', {
          key,
          attempt,
          delay,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Upload failed after retries');
}

// ============================================================================
// Example 3: Batch Upload
// ============================================================================

/**
 * Upload multiple files in parallel
 */
export async function uploadBatch(
  files: Array<{ key: string; buffer: Buffer }>
): Promise<string[]> {
  const correlationId = `batch-upload-${Date.now()}`;
  
  logger.info('Starting batch upload', {
    correlationId,
    count: files.length,
  });
  
  try {
    // Upload all files in parallel
    const urls = await Promise.all(
      files.map(async ({ key, buffer }) => {
        try {
          return await s3Service.upload({ key, body: buffer });
        } catch (error) {
          logger.error('Failed to upload file in batch', error as Error, {
            correlationId,
            key,
          });
          throw error;
        }
      })
    );
    
    logger.info('Batch upload completed', {
      correlationId,
      count: urls.length,
    });
    
    return urls;
  } catch (error) {
    logger.error('Batch upload failed', error as Error, {
      correlationId,
    });
    throw error;
  }
}

// ============================================================================
// Example 4: Upload with Progress Tracking
// ============================================================================

/**
 * Upload file with progress callback
 */
export async function uploadWithProgress(
  key: string,
  buffer: Buffer,
  onProgress?: (progress: number) => void
): Promise<string> {
  const totalSize = buffer.length;
  let uploadedSize = 0;
  
  // Simulate progress (in real implementation, use multipart upload)
  const progressInterval = setInterval(() => {
    uploadedSize = Math.min(uploadedSize + totalSize / 10, totalSize);
    const progress = (uploadedSize / totalSize) * 100;
    
    if (onProgress) {
      onProgress(progress);
    }
    
    if (uploadedSize >= totalSize) {
      clearInterval(progressInterval);
    }
  }, 100);
  
  try {
    const url = await s3Service.upload({ key, body: buffer });
    
    clearInterval(progressInterval);
    
    if (onProgress) {
      onProgress(100);
    }
    
    return url;
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}

// ============================================================================
// Example 5: Delete Old Files
// ============================================================================

/**
 * Delete old user files (cleanup)
 */
export async function deleteOldUserFiles(
  userId: string,
  keys: string[]
): Promise<void> {
  const correlationId = `cleanup-${userId}-${Date.now()}`;
  
  logger.info('Starting file cleanup', {
    correlationId,
    userId,
    count: keys.length,
  });
  
  const results = await Promise.allSettled(
    keys.map(key => s3Service.delete(key))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  logger.info('File cleanup completed', {
    correlationId,
    userId,
    succeeded,
    failed,
  });
  
  if (failed > 0) {
    logger.warn('Some files failed to delete', {
      correlationId,
      userId,
      failed,
    });
  }
}

// ============================================================================
// Example 6: Check and Upload (Idempotent)
// ============================================================================

/**
 * Upload file only if it doesn't exist (idempotent)
 */
export async function uploadIfNotExists(
  key: string,
  buffer: Buffer
): Promise<{ url: string; uploaded: boolean }> {
  // Check if file already exists
  const exists = await s3Service.exists(key);
  
  if (exists) {
    logger.info('File already exists, skipping upload', { key });
    
    return {
      url: `${process.env.CDN_URL}/${key}`,
      uploaded: false,
    };
  }
  
  // Upload file
  const url = await s3Service.upload({ key, body: buffer });
  
  logger.info('File uploaded', { key, url });
  
  return {
    url,
    uploaded: true,
  };
}

// ============================================================================
// Example 7: Generate Temporary Access URL
// ============================================================================

/**
 * Generate temporary URL for private file download
 */
export async function generateDownloadUrl(
  key: string,
  expiresInMinutes: number = 60
): Promise<string> {
  try {
    // Check if file exists
    const exists = await s3Service.exists(key);
    
    if (!exists) {
      throw new Error('File not found');
    }
    
    // Generate signed URL
    const url = await s3Service.getSignedUrl(key, expiresInMinutes * 60);
    
    logger.info('Download URL generated', {
      key,
      expiresInMinutes,
    });
    
    return url;
  } catch (error) {
    logger.error('Failed to generate download URL', error as Error, {
      key,
    });
    throw error;
  }
}

// ============================================================================
// Example 8: Get File Info
// ============================================================================

/**
 * Get detailed file information
 */
export async function getFileInfo(key: string) {
  try {
    const metadata = await s3Service.getMetadata(key);
    
    return {
      key,
      url: `${process.env.CDN_URL}/${key}`,
      contentType: metadata.contentType,
      size: metadata.contentLength,
      lastModified: metadata.lastModified,
      etag: metadata.etag,
      metadata: metadata.metadata,
    };
  } catch (error) {
    if (error instanceof S3Error && error.type === S3ErrorType.NOT_FOUND) {
      return null;
    }
    throw error;
  }
}

// ============================================================================
// Example 9: Replace File (Delete + Upload)
// ============================================================================

/**
 * Replace existing file with new content
 */
export async function replaceFile(
  key: string,
  buffer: Buffer
): Promise<string> {
  const correlationId = `replace-${Date.now()}`;
  
  try {
    // Check if file exists
    const exists = await s3Service.exists(key);
    
    if (exists) {
      // Delete old file
      await s3Service.delete(key);
      
      logger.info('Old file deleted', {
        correlationId,
        key,
      });
    }
    
    // Upload new file
    const url = await s3Service.upload({ key, body: buffer });
    
    logger.info('New file uploaded', {
      correlationId,
      key,
      url,
    });
    
    return url;
  } catch (error) {
    logger.error('Failed to replace file', error as Error, {
      correlationId,
      key,
    });
    throw error;
  }
}

// ============================================================================
// Example 10: Upload with Validation
// ============================================================================

/**
 * Upload file with validation
 */
export async function uploadWithValidation(
  userId: string,
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): Promise<string> {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;
  
  // Validate file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }
  
  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Convert to buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Generate key
  const key = s3Service.generateKey(userId, file.name, 'image');
  
  // Upload
  const url = await s3Service.upload({
    key,
    body: buffer,
    contentType: file.type,
    metadata: {
      userId,
      originalFilename: file.name,
      fileSize: file.size.toString(),
      uploadedAt: new Date().toISOString(),
    },
  });
  
  logger.info('File uploaded with validation', {
    userId,
    key,
    url,
    size: file.size,
    type: file.type,
  });
  
  return url;
}

// ============================================================================
// Example 11: API Route Integration
// ============================================================================

/**
 * Example Next.js API route handler
 */
export async function handleFileUpload(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }
    
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File too large (max 10MB)',
      };
    }
    
    // Upload file
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = s3Service.generateKey('user-123', file.name, 'image');
    const url = await s3Service.upload({ key, body: buffer });
    
    return {
      success: true,
      data: {
        url,
        key,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
    };
  } catch (error) {
    logger.error('Upload handler error', error as Error);
    
    if (error instanceof S3Error) {
      return {
        success: false,
        error: error.message,
        type: error.type,
        retryable: error.retryable,
      };
    }
    
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

// ============================================================================
// Example 12: Cleanup Orphaned Files
// ============================================================================

/**
 * Delete files that are no longer referenced in database
 */
export async function cleanupOrphanedFiles(
  allKeys: string[],
  referencedKeys: string[]
): Promise<{ deleted: number; failed: number }> {
  const orphanedKeys = allKeys.filter(key => !referencedKeys.includes(key));
  
  logger.info('Starting orphaned files cleanup', {
    total: allKeys.length,
    referenced: referencedKeys.length,
    orphaned: orphanedKeys.length,
  });
  
  if (orphanedKeys.length === 0) {
    return { deleted: 0, failed: 0 };
  }
  
  const results = await Promise.allSettled(
    orphanedKeys.map(key => s3Service.delete(key))
  );
  
  const deleted = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  logger.info('Orphaned files cleanup completed', {
    deleted,
    failed,
  });
  
  return { deleted, failed };
}
