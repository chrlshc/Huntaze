import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { s3Helpers, S3_BUCKETS } from '@/lib/aws/s3-client';
import { analytics } from '@/lib/analytics/realtime-analytics';
import { requireUser, HttpError } from '@/lib/server-auth';
import { makeReqLogger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  try {
    const user = await requireUser();
    const log = makeReqLogger({ requestId, userId: user.id, route: pathname, method: request.method });

    const body = await request.json();
    const { filename, contentType, fileSize } = body;

    if (!filename || !contentType) {
      log.warn('media_upload_missing_fields', { filename: !!filename, contentType: !!contentType });
      const r = NextResponse.json(
        { error: 'Filename and contentType are required', requestId },
        { status: 400 }
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Validate file size (max 50MB)
    if (fileSize && fileSize > 50 * 1024 * 1024) {
      log.warn('media_upload_file_too_large', { fileSize });
      const r = NextResponse.json(
        { error: 'File size exceeds 50MB limit', requestId },
        { status: 400 }
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Generate unique key for the file
    const key = s3Helpers.generateMediaKey(user.id, filename);

    // Generate presigned URL for upload
    const presignedUrl = await s3Helpers.getPresignedUploadUrl(
      S3_BUCKETS.MEDIA,
      key,
      contentType,
      3600 // 1 hour expiry
    );

    // Track analytics
    await analytics.trackEvent({
      userId: user.id,
      eventType: 'media_upload_requested',
      properties: {
        filename,
        contentType,
        fileSize,
        key,
      },
    });

    const res = NextResponse.json({
      success: true,
      presignedUrl,
      key,
      bucket: S3_BUCKETS.MEDIA,
      expires: new Date(Date.now() + 3600 * 1000).toISOString(),
      requestId,
    });
    res.headers.set('X-Request-Id', requestId);
    return res;
  } catch (error: any) {
    if (error?.status) {
      const r = NextResponse.json({ error: error.message, requestId }, { status: error.status });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    const log = makeReqLogger({ requestId, route: pathname, method: request.method });
    log.error('media_upload_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json(
      { 
        error: 'Failed to generate upload URL',
        requestId,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 500 }
    );
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  try {
    const user = await requireUser();
    const log = makeReqLogger({ requestId, userId: user.id, route: pathname, method: request.method });

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix') || `uploads/${user.id}/`;
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100');

    // List user's files
    const files = await s3Helpers.listFiles(
      S3_BUCKETS.MEDIA,
      prefix,
      maxKeys
    );

    // Get metadata and presigned URLs for each file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const metadata = await s3Helpers.getFileMetadata(
          S3_BUCKETS.MEDIA,
          file.Key!
        );
        
        const downloadUrl = await s3Helpers.getPresignedDownloadUrl(
          S3_BUCKETS.MEDIA,
          file.Key!,
          3600 // 1 hour expiry
        );

        return {
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified,
          contentType: metadata?.contentType,
          downloadUrl,
        };
      })
    );

    const res = NextResponse.json({
      success: true,
      files: filesWithUrls,
      count: filesWithUrls.length,
      requestId,
    });
    res.headers.set('X-Request-Id', requestId);
    return res;
  } catch (error: any) {
    const log = makeReqLogger({ requestId, route: pathname, method: request.method });
    log.error('media_list_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json(
      { 
        error: 'Failed to list media files',
        requestId,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 500 }
    );
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
