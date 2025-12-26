import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ppv/templates - List PPV templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = { userId: session.user.id };
    if (status && status !== 'all') {
      where.status = status;
    }

    const [templates, total] = await Promise.all([
      prisma.pPVTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.pPVTemplate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        templates: templates.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          price: t.price,
          mediaType: t.mediaType,
          mediaCount: t.mediaCount,
          thumbnail: t.thumbnail,
          status: t.status,
          tags: t.tags,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
        pagination: { total, limit, offset, hasMore: offset + templates.length < total },
      },
    });
  } catch (error) {
    console.error('[PPV Templates GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
}

/**
 * POST /api/ppv/templates - Create PPV template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, mediaType, mediaCount, thumbnail, tags } = body;

    if (!title || price === undefined) {
      return NextResponse.json({ success: false, error: 'Title and price are required' }, { status: 400 });
    }

    const template = await prisma.pPVTemplate.create({
      data: {
        userId: session.user.id,
        title,
        description: description || '',
        price: parseFloat(price),
        mediaType: mediaType || 'image',
        mediaCount: mediaCount || 1,
        thumbnail: thumbnail || '',
        status: 'draft',
        tags: tags || [],
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
        createdAt: template.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[PPV Templates POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create template' }, { status: 500 });
  }
}
