import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/marketing/segments - List audience segments
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const segments = await prisma.segment.findMany({
      where: { userId },
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: segments,
    });
  } catch (error) {
    console.error('[Marketing Segments API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch segments',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/marketing/segments - Create new segment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, criteria } = body;

    if (!name || !criteria) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name and criteria are required',
          },
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const segment = await prisma.segment.create({
      data: {
        userId,
        name,
        description,
        criteria: JSON.stringify(criteria),
      },
    });

    return NextResponse.json({
      success: true,
      data: segment,
    });
  } catch (error) {
    console.error('[Marketing Segments API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create segment',
        },
      },
      { status: 500 }
    );
  }
}
