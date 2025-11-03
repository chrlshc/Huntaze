import { NextRequest, NextResponse } from 'next/server';
import { mediaUploadService } from '@/lib/services/mediaUploadService';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for video uploads

/**
 * POST /api/content/media/upload
 * Upload media file (image or video)
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from session/auth (placeholder - implement your auth)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: { code: 'MISSING_FILE', message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Determine type from mime type
    const type = file.type.startsWith('image/') ? 'image' : 'video';

    // Validate file
    const validationError = mediaUploadService.validateFile(file, type);
    if (validationError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', ...validationError } },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract metadata if provided
    const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
    const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined;

    // Upload media
    const result = await mediaUploadService.uploadMedia(
      userId,
      buffer,
      file.name,
      file.type,
      { width, height, duration }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Media upload error:', error);

    if (error.message === 'Storage quota exceeded') {
      return NextResponse.json(
        { error: { code: 'QUOTA_EXCEEDED', message: 'Storage quota exceeded' } },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: { code: 'UPLOAD_FAILED', message: error.message || 'Failed to upload media' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/media/upload
 * Get storage usage
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    const usage = await mediaUploadService.getStorageUsage(userId);

    return NextResponse.json({
      success: true,
      data: usage,
    });

  } catch (error: any) {
    console.error('Get storage usage error:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_FAILED', message: 'Failed to fetch storage usage' } },
      { status: 500 }
    );
  }
}
