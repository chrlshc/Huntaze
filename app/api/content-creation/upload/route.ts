import { NextRequest } from 'next/server';
import { withErrorHandling, jsonError } from '@/src/lib/http/errors';
import { MediaAssetSchema } from '@/src/lib/api/schemas';
import { z } from 'zod';
import { getServerAuth } from '@/lib/server-auth';

// File upload validation
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = {
  photo: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const metadata = formData.get('metadata') as string;

      if (!file) {
        return jsonError('VALIDATION_ERROR', 'No file provided', 400);
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return jsonError('VALIDATION_ERROR', `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`, 400);
      }

      // Parse metadata
      let parsedMetadata;
      try {
        parsedMetadata = JSON.parse(metadata || '{}');
      } catch {
        return jsonError('VALIDATION_ERROR', 'Invalid metadata JSON', 400);
      }

      // Determine content type
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      let contentType: 'photo' | 'video';
      if (isImage) {
        contentType = 'photo';
        if (!ALLOWED_TYPES.photo.includes(file.type)) {
          return jsonError('VALIDATION_ERROR', 'Invalid image format. Allowed: JPEG, PNG, WebP', 400);
        }
      } else if (isVideo) {
        contentType = 'video';
        if (!ALLOWED_TYPES.video.includes(file.type)) {
          return jsonError('VALIDATION_ERROR', 'Invalid video format. Allowed: MP4, WebM, QuickTime', 400);
        }
      } else {
        return jsonError('VALIDATION_ERROR', 'Unsupported file type', 400);
      }

      // Mock file processing - replace with actual upload to CDN/S3
      const fileId = crypto.randomUUID();
      const fileName = `${fileId}-${file.name}`;
      
      // Simulate file processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get image/video dimensions (mock)
      const dimensions = isImage 
        ? { width: 1920, height: 1080 } 
        : { width: 1920, height: 1080 };

      // Create asset record
      const newAsset = {
        id: fileId,
        creatorId: auth.user.id,
        title: parsedMetadata.title || file.name.replace(/\.[^/.]+$/, ''),
        description: parsedMetadata.description || '',
        type: contentType,
        status: 'draft' as const,
        thumbnailUrl: `/uploads/thumbnails/${fileId}-thumb.jpg`,
        originalUrl: `/uploads/${fileName}`,
        fileSize: file.size,
        duration: isVideo ? 120 : undefined, // Mock duration for videos
        dimensions,
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: {
          views: 0,
          engagement: 0,
          revenue: 0,
          roi: 0
        },
        tags: parsedMetadata.tags || [],
        compliance: {
          status: 'pending' as const,
          checkedAt: new Date(),
          violations: [],
          score: 0
        },
        uploadProgress: 100 // Upload complete
      };

      // Trigger compliance check (async)
      // In real implementation, this would be a background job
      setTimeout(async () => {
        // Mock compliance check result
        console.log(`Compliance check completed for asset ${fileId}`);
      }, 5000);

      const validatedAsset = MediaAssetSchema.parse(newAsset);

      return Response.json({
        success: true,
        data: validatedAsset,
        timestamp: new Date(),
        requestId: crypto.randomUUID()
      });

    } catch (error) {
      console.error('Upload error:', error);
      return jsonError('UPLOAD_ERROR', 'Failed to process upload', 500);
    }
  });
}

// Get upload progress (for chunked uploads)
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const url = new URL(request.url);
    const uploadId = url.searchParams.get('uploadId');

    if (!uploadId) {
      return jsonError('VALIDATION_ERROR', 'Upload ID required', 400);
    }

    // Mock progress tracking - replace with actual implementation
    const mockProgress = {
      uploadId,
      progress: 75,
      status: 'uploading' as const,
      bytesUploaded: 3750000,
      totalBytes: 5000000,
      estimatedTimeRemaining: 30 // seconds
    };

    return Response.json({
      success: true,
      data: mockProgress,
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    });
  });
}