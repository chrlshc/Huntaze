import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/onlyfans/subscribers - List subscribers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');

    const userId = session.user.id;

    // Build where clause
    const where: any = { userId };
    if (tier) {
      where.tier = tier;
    }
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { messages: true, transactions: true },
          },
        },
      }),
      prisma.subscriber.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: subscribers,
      metadata: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('[OnlyFans Subscribers API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch subscribers',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/onlyfans/subscribers - Add subscriber
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
    const { username, email, tier, onlyfansId } = body;

    if (!username || !email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Username and email are required',
          },
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const subscriber = await prisma.subscriber.create({
      data: {
        userId,
        username,
        email,
        tier: tier || 'free',
        onlyfansId,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: subscriber,
    });
  } catch (error) {
    console.error('[OnlyFans Subscribers API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create subscriber',
        },
      },
      { status: 500 }
    );
  }
}
