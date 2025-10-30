import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/management/settings - Get user settings
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

    // Get user settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // Default settings if none exist
    const defaultSettings = {
      notifications: {
        email: true,
        push: true,
        newSubscriber: true,
        newMessage: true,
        paymentReceived: true,
      },
      automation: {
        autoReply: true,
        welcomeMessage: true,
        thankYouMessage: true,
      },
      privacy: {
        showOnlineStatus: true,
        allowScreenshots: false,
        watermarkContent: true,
      },
      billing: {
        currency: 'USD',
        taxRate: 0,
        payoutMethod: 'bank',
      },
    };

    const userSettings = settings ? JSON.parse(settings.settings as string) : defaultSettings;

    return NextResponse.json({
      success: true,
      data: userSettings,
    });
  } catch (error) {
    console.error('[Management Settings API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch settings',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/management/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Settings are required',
          },
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Upsert user settings
    const userSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        settings: JSON.stringify(settings),
        updatedAt: new Date(),
      },
      create: {
        userId,
        settings: JSON.stringify(settings),
      },
    });

    return NextResponse.json({
      success: true,
      data: JSON.parse(userSettings.settings as string),
    });
  } catch (error) {
    console.error('[Management Settings API] PUT Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update settings',
        },
      },
      { status: 500 }
    );
  }
}
