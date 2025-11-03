import { NextRequest, NextResponse } from 'next/server';
import { mediaAssetsRepository } from '@/lib/db/repositories/mediaAssetsRepository';
import { imageEditService } from '@/lib/services/imageEditService';

export const runtime = 'nodejs';

/**
 * POST /api/content/media/[id]/edit
 * Apply edits to an image
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    // Get media
    const media = await mediaAssetsRepository.findById(id);
    if (!media) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Media not found' } },
        { status: 404 }
      );
    }

    if (media.userId !== userId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    if (media.type !== 'image') {
      return NextResponse.json(
        { error: { code: 'INVALID_TYPE', message: 'Only images can be edited' } },
        { status: 400 }
      );
    }

    // Get edit options from request
    const body = await request.json();
    const { crop, resize, rotate, flip, adjustments, filters } = body;

    // Fetch original image
    const imageResponse = await fetch(media.originalUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Apply edits
    const editedBuffer = await imageEditService.editImage(imageBuffer, {
      crop,
      resize,
      rotate,
      flip,
      adjustments,
      filters,
    });

    // Save edited image
    const result = await imageEditService.saveEditedImage(
      userId,
      id,
      editedBuffer,
      { crop, resize, rotate, flip, adjustments, filters }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Image edit error:', error);
    return NextResponse.json(
      { error: { code: 'EDIT_FAILED', message: error.message || 'Failed to edit image' } },
      { status: 500 }
    );
  }
}
