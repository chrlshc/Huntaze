import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Mock data for development
const mockMessages: Record<string, any[]> = {
  'conv1': [
    {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: 'fan',
      content: { text: 'Hello!' },
      isFromCreator: false,
      createdAt: new Date(),
    }
  ]
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return mock messages for now
    const messages = mockMessages[conversationId] || [];

    return NextResponse.json({
      messages,
      hasMore: false,
      nextCursor: null
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // Mock message creation
    const newMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: session.user.id,
      content: { text },
      isFromCreator: true,
      createdAt: new Date(),
    };

    // Add to mock data
    if (!mockMessages[conversationId]) {
      mockMessages[conversationId] = [];
    }
    mockMessages[conversationId].push(newMessage);

    return NextResponse.json(newMessage);

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}