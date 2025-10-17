import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const S3_BUCKETS = {
  MEDIA: process.env.S3_MEDIA_BUCKET || 'huntaze-media',
  VAULT: process.env.S3_VAULT_BUCKET || 'huntaze-vault',
  EXPORTS: process.env.S3_EXPORTS_BUCKET || 'huntaze-exports',
  ANALYTICS: process.env.S3_ANALYTICS_BUCKET || 'huntaze-analytics',
} as const;

export const s3Helpers = {
  // Upload file to S3
  async uploadFile(bucket: string, key: string, body: Buffer | Uint8Array | string, contentType?: string) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    
    return await s3Client.send(command);
  },

  // Upload large file with progress tracking
  async uploadLargeFile(bucket: string, key: string, body: any, contentType?: string, onProgress?: (progress: number) => void) {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    });

    upload.on('httpUploadProgress', (progress) => {
      if (onProgress && progress.loaded && progress.total) {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percentage);
      }
    });

    return await upload.done();
  },

  // Get file from S3
  async getFile(bucket: string, key: string) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    return response.Body;
  },

  // Delete file from S3
  async deleteFile(bucket: string, key: string) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    return await s3Client.send(command);
  },

  // List files in S3 bucket
  async listFiles(bucket: string, prefix?: string, maxKeys = 1000) {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });
    
    const response = await s3Client.send(command);
    return response.Contents || [];
  },

  // Generate presigned URL for upload
  async getPresignedUploadUrl(bucket: string, key: string, contentType?: string, expiresIn = 3600) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  },

  // Generate presigned URL for download
  async getPresignedDownloadUrl(bucket: string, key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  },

  // Generate unique key for media uploads
  generateMediaKey(userId: string, filename: string, folder = 'uploads') {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${folder}/${userId}/${timestamp}-${sanitizedFilename}`;
  },

  // Get file metadata
  async getFileMetadata(bucket: string, key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      
      const response = await s3Client.send(command);
      
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }
};

export { s3Client };
