import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ppv/templates/[id] - Get single PPV template
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.pPVTemplate.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        title: template.title,
        description: template.description,
        price: template.price,
        mediaType: template.mediaType,
        mediaCount: template.mediaCount,
        thumbnail: template.thumbnail,
        status: template.status,
        tags: template.tags,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[PPV Template GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch template' }, { status: 500 });
  }
}

/**
 * PUT /api/ppv/templates/[id] - Update PPV template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.pPVTemplate.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, price, mediaType, mediaCount, thumbnail, status, tags } = body;

    const template = await prisma.pPVTemplate.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(mediaType !== undefined && { mediaType }),
        ...(mediaCount !== undefined && { mediaCount }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(status !== undefined && { status }),
        ...(tags !== undefined && { tags }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        title: template.title,
        description: template.description,
        price: template.price,
        mediaType: template.mediaType,
        mediaCount: template.mediaCount,
        thumbnail: template.thumbnail,
        status: template.status,
        tags: template.tags,
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[PPV Template PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to update template' }, { status: 500 });
  }
}

/**
 * DELETE /api/ppv/templates/[id] - Delete PPV template
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.pPVTemplate.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    await prisma.pPVTemplate.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PPV Template DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete template' }, { status: 500 });
  }
}
