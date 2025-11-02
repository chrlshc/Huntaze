import { NextRequest, NextResponse } from 'next/server';
import { mediaAssetsRepository } from '@/lib/db/repositories/mediaAssetsRepository';

/**
 * GET /api/content/media
 * Get user's media library with filters and pagination
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'image' | 'video' | null;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get media assets
    const media = await mediaAssetsRepository.findByUser(userId, {
      type: type || undefined,
      search,
      limit,
      offset,
    });

    // Get total count
    const total = await mediaAssetsRepository.countByUser(userId, type || undefined);

    // Get storage usage
    const storage = await mediaAssetsRepository.getStorageUsage(userId);

    return NextResponse.json({
      success: true,
      data: {
        media,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + media.length < total,
        },
        storage: {
          used: storage.usedBytes,
          quota: storage.quotaBytes,
          percentage: Math.round((storage.usedBytes / storage.quotaBytes) * 100),
        },
      },
    });

  } catch (error: any) {
    console.error('Get media library error:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_FAILED', message: 'Failed to fetch media library' } },
      { status: 500 }
    );
  }
}
