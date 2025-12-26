import { NextRequest, NextResponse } from 'next/server';
import { videoEditService } from '@/lib/services/videoEditService';
import { mediaAssetsRepository } from '@/lib/db/repositories/mediaAssetsRepository';
import { externalFetch } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: mediaId } = await params;
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }
    const media = await mediaAssetsRepository.findById(mediaId);
    
    if (!media || media.userId !== userId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Media not found' } },
        { status: 404 }
      );
    }

    if (media.type !== 'video') {
      return NextResponse.json(
        { error: { code: 'INVALID_TYPE', message: 'Media is not a video' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { trim, captions, thumbnailTimestamp } = body;

    let response: Response;
    try {
      response = await externalFetch(media.originalUrl, {
        service: 'media-storage',
        operation: 'download',
        method: 'GET',
        cache: 'no-store',
        timeoutMs: 30_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      });
    } catch (error) {
      if (isExternalServiceError(error)) {
        return NextResponse.json(
          { error: { code: 'MEDIA_UNAVAILABLE', message: 'Media storage unavailable' } },
          { status: 502 }
        );
      }
      throw error;
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: { code: 'MEDIA_UNAVAILABLE', message: 'Failed to download media' } },
        { status: 502 }
      );
    }

    let videoBuffer = Buffer.from(await response.arrayBuffer()) as Buffer;

    if (trim) {
      videoBuffer = await videoEditService.trimVideo(videoBuffer, trim.startTime, trim.endTime);
    }

    if (captions && captions.length > 0) {
      videoBuffer = await videoEditService.addCaptions(videoBuffer, captions);
    }

    const result = await videoEditService.saveEditedVideo(userId, mediaId, videoBuffer, { trim, captions, thumbnailTimestamp });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error('Video edit error:', error);
    return NextResponse.json(
      { error: { code: 'EDIT_FAILED', message: error.message || 'Failed to edit video' } },
      { status: 500 }
    );
  }
}
