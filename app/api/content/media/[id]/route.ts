import { NextRequest, NextResponse } from 'next/server';
import { mediaUploadService } from '@/lib/services/mediaUploadService';
import { mediaAssetsRepository } from '@/lib/db/repositories/mediaAssetsRepository';

export const runtime = 'nodejs';

/**
 * GET /api/content/media/[id]
 * Get media asset by ID
 */
export async function GET(
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

    // Check if media is used in content
    const isUsed = await mediaAssetsRepository.isUsedInContent(id);

    return NextResponse.json({
      success: true,
      data: {
        ...media,
        isUsedInContent: isUsed,
      },
    });

  } catch (error: any) {
    console.error('Get media error:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_FAILED', message: 'Failed to fetch media' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/media/[id]
 * Delete media asset
 */
export async function DELETE(
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

    // Delete media (includes all validations)
    await mediaUploadService.deleteMedia(userId, id);

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully',
    });

  } catch (error: any) {
    console.error('Delete media error:', error);

    if (error.message === 'Media not found') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Media not found' } },
        { status: 404 }
      );
    }

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    if (error.message === 'Cannot delete media that is used in content') {
      return NextResponse.json(
        { 
          error: { 
            code: 'MEDIA_IN_USE', 
            message: 'Cannot delete media that is used in content. Remove it from content first.' 
          } 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: { code: 'DELETE_FAILED', message: 'Failed to delete media' } },
      { status: 500 }
    );
  }
}
