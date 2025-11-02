import { NextRequest, NextResponse } from 'next/server';
import { contentItemsRepository } from '@/lib/db/repositories/contentItemsRepository';

/**
 * POST /api/content/drafts
 * Create or update a draft
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, text, category, tags, platforms } = body;

    if (!text) {
      return NextResponse.json(
        { error: { code: 'MISSING_TEXT', message: 'Content text is required' } },
        { status: 400 }
      );
    }

    let draft;

    if (id) {
      // Update existing draft
      draft = await contentItemsRepository.update(id, {
        text,
        category,
        metadata: { tags, platforms },
      });

      if (!draft) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Draft not found' } },
          { status: 404 }
        );
      }
    } else {
      // Create new draft
      draft = await contentItemsRepository.create({
        userId,
        text,
        status: 'draft',
        category,
        metadata: { tags, platforms },
      });
    }

    return NextResponse.json({
      success: true,
      data: draft,
    });

  } catch (error: any) {
    console.error('Save draft error:', error);
    return NextResponse.json(
      { error: { code: 'SAVE_FAILED', message: 'Failed to save draft' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/drafts
 * Get user's drafts
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const drafts = await contentItemsRepository.findByUser(userId, {
      status: 'draft',
      limit,
      offset,
    });

    const total = await contentItemsRepository.countByUser(userId, 'draft');

    return NextResponse.json({
      success: true,
      data: {
        drafts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + drafts.length < total,
        },
      },
    });

  } catch (error: any) {
    console.error('Get drafts error:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_FAILED', message: 'Failed to fetch drafts' } },
      { status: 500 }
    );
  }
}
