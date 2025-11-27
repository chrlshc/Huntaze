/**
 * S3 Storage Service - Production AWS Integration
 * 
 * This module provides file storage using AWS S3 instead of local filesystem.
 * On AWS infrastructure (EC2, Lambda, App Runner), local storage is ephemeral
 * and will be lost on restart. S3 is the only reliable way to persist files.
 * 
 * Features:
 * - File upload to S3 with automatic content-type detection
 * - CORS configuration for browser uploads
 * - Security policies (private by default)
 * - Presigned URLs for secure downloads
 * - File deletion and existence checks
 * 
 * @module lib/aws/s3-storage
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'huntaze-user-files';

// S3 Client (singleton)
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3Client;
}

/**
 * File upload options
 */
export interface UploadOptions {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  acl?: 'private' | 'public-read';
}

/**
 * Upload file to S3
 * 
 * @param options Upload configuration
 * @returns S3 object URL
 */
export async function uploadFile(options: UploadOptions): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType || 'application/octet-stream',
    Metadata: options.metadata,
    CacheControl: options.cacheControl || 'public, max-age=31536000',
    ACL: options.acl || 'private',
  });

  await client.send(command);

  // Return S3 URL (will be replaced by CloudFront URL in production)
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${options.key}`;
}

/**
 * Get presigned URL for secure file download
 * 
 * @param key S3 object key
 * @param expiresIn URL expiration in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete file from S3
 * 
 * @param key S3 object key
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await client.send(command);
}

/**
 * Check if file exists in S3
 * 
 * @param key S3 object key
 * @returns true if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = getS3Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Configure S3 bucket with CORS and security policies
 * This should be run once during infrastructure setup
 */
export async function configureBucket(): Promise<void> {
  const client = getS3Client();

  // Create bucket if it doesn't exist
  try {
    await client.send(
      new CreateBucketCommand({
        Bucket: S3_BUCKET,
      })
    );
  } catch (error: any) {
    // Ignore if bucket already exists
    if (error.name !== 'BucketAlreadyOwnedByYou' && error.name !== 'BucketAlreadyExists') {
      throw error;
    }
  }

  // Configure CORS for browser uploads
  await client.send(
    new PutBucketCorsCommand({
      Bucket: S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: [
              process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              'https://*.huntaze.com',
            ],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    })
  );

  // Configure bucket policy (private by default, presigned URLs for access)
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'DenyInsecureTransport',
        Effect: 'Deny',
        Principal: '*',
        Action: 's3:*',
        Resource: [
          `arn:aws:s3:::${S3_BUCKET}/*`,
          `arn:aws:s3:::${S3_BUCKET}`,
        ],
        Condition: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      },
    ],
  };

  await client.send(
    new PutBucketPolicyCommand({
      Bucket: S3_BUCKET,
      Policy: JSON.stringify(bucketPolicy),
    })
  );
}

/**
 * S3 Storage Service
 */
export const s3Storage = {
  uploadFile,
  getPresignedUrl,
  deleteFile,
  fileExists,
  configureBucket,
};
