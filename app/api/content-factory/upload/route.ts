import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET || 'huntaze-videos-production';

const s3Client = new S3Client({ region: REGION });

interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: PresignedUrlRequest = await request.json();
    const { fileName, contentType, fileSize } = body;

    // Validate request
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: mp4, mov, webm' },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 500MB' },
        { status: 400 }
      );
    }

    // Generate unique S3 key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 8);
    const extension = fileName.split('.').pop() || 'mp4';
    const s3Key = `uploads/${timestamp}_${randomId}.${extension}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ContentType: contentType,
      ContentLength: fileSize,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({
      presignedUrl,
      s3Key,
      bucket: BUCKET,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
