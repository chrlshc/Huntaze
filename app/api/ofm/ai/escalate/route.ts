import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, reason } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Mock escalation response for development
    const mockResponse = {
      success: true,
      message: 'Conversation escalated successfully',
      escalationId: `esc_${Date.now()}`,
      status: 'escalated',
      reason: reason || 'Manual escalation'
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Error escalating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to escalate conversation' },
      { status: 500 }
    );
  }
}