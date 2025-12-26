import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Content Editor API
 * Draft management and editing capabilities
 * Uses the existing `content` model with snake_case fields
 */

/**
 * GET /api/content/editor - Get drafts for editing
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (draftId) {
      // Get specific draft
      const draft = await prisma.content.findFirst({
        where: { id: draftId, user_id: session.user.id, status: 'draft' },
      });

      if (!draft) {
        return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: draft.id,
          title: draft.title,
          body: draft.text,
          mediaIds: draft.media_ids,
          platform: draft.platform,
          scheduledAt: draft.scheduled_at?.toISOString(),
          createdAt: draft.created_at.toISOString(),
          updatedAt: draft.updated_at.toISOString(),
        },
      });
    }

    // List all drafts
    const drafts = await prisma.content.findMany({
      where: { user_id: session.user.id, status: 'draft' },
      orderBy: { updated_at: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: {
        drafts: drafts.map((d) => ({
          id: d.id,
          title: d.title,
          preview: d.text?.substring(0, 100) || '',
          mediaCount: d.media_ids?.length || 0,
          platform: d.platform,
          updatedAt: d.updated_at.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('[Content Editor GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

/**
 * POST /api/content/editor - Create new draft
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: contentBody, mediaIds, platform } = body;

    const draft = await prisma.content.create({
      data: {
        id: crypto.randomUUID(),
        user_id: session.user.id,
        title: title || 'Untitled Draft',
        text: contentBody || '',
        media_ids: mediaIds || [],
        platform: platform || 'onlyfans',
        type: 'post',
        status: 'draft',
        tags: [],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: draft.id,
        title: draft.title,
        createdAt: draft.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Content Editor POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create draft' }, { status: 500 });
  }
}

/**
 * PUT /api/content/editor - Update draft
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, body: contentBody, mediaIds, platform, scheduledAt } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Draft ID is required' }, { status: 400 });
    }

    const existing = await prisma.content.findFirst({
      where: { id, user_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
    }

    const draft = await prisma.content.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(contentBody !== undefined && { text: contentBody }),
        ...(mediaIds !== undefined && { media_ids: mediaIds }),
        ...(platform !== undefined && { platform }),
        ...(scheduledAt !== undefined && { scheduled_at: scheduledAt ? new Date(scheduledAt) : null }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: draft.id,
        title: draft.title,
        updatedAt: draft.updated_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Content Editor PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to update draft' }, { status: 500 });
  }
}
