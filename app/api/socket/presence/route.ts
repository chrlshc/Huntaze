import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getPresenceService } from '@/lib/services/presenceService';

// GET /api/socket/presence - Get current presence for content
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
    }

    const presenceService = getPresenceService();
    if (!presenceService) {
      return NextResponse.json({ error: 'Presence service not available' }, { status: 503 });
    }

    const activeUsers = presenceService.getActiveUsers(contentId);

    return NextResponse.json({
      activeUsers: activeUsers.map(user => ({
        userId: user.userId,
        userName: user.userName,
        userEmail: user.userEmail,
        cursorPosition: user.cursorPosition,
        selectionStart: user.selectionStart,
        selectionEnd: user.selectionEnd,
        lastSeen: user.lastSeen
      }))
    });

  } catch (error) {
    console.error('Error getting presence:', error);
    return NextResponse.json(
      { error: 'Failed to get presence data' },
      { status: 500 }
    );
  }
}

// POST /api/socket/presence - Initialize presence connection info
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      socketPath: '/api/socket/presence',
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      userEmail: session.user.email
    });

  } catch (error) {
    console.error('Error initializing presence:', error);
    return NextResponse.json(
      { error: 'Failed to initialize presence' },
      { status: 500 }
    );
  }
}