import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/marketing/automation - List automation rules
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

    const automations = await prisma.automation.findMany({
      where: { userId },
      include: {
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: automations,
    });
  } catch (error) {
    console.error('[Marketing Automation API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch automations',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/marketing/automation - Create automation rule
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
    const { name, description, trigger, actions, isActive } = body;

    if (!name || !trigger || !actions) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name, trigger, and actions are required',
          },
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const automation = await prisma.automation.create({
      data: {
        userId,
        name,
        description,
        trigger: JSON.stringify(trigger),
        actions: JSON.stringify(actions),
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: automation,
    });
  } catch (error) {
    console.error('[Marketing Automation API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create automation',
        },
      },
      { status: 500 }
    );
  }
}
