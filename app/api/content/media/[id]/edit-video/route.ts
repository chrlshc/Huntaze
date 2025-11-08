import { NextRequest, NextResponse } from 'next/server';
import { videoEditService } from '@/lib/services/videoEditService';
import { mediaAssetsRepository } from '@/lib/db/repositories/mediaAssetsRepository';

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

    const response = await fetch(media.originalUrl);
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
