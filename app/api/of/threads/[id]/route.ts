import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { OfMessage } from '@/lib/types/onlyfans';

// Mock messages for now
const mockMessages: Record<string, OfMessage[]> = {
  '1': [
    {
      id: 'msg1',
      conversationId: '1',
      platformMessageId: 'of_msg_1',
      senderId: 'of_user_1',
      content: {
        text: 'Hey! Love your content! 😍'
      },
      isFromCreator: false,
      createdAt: new Date('2024-01-20T10:00:00')
    },
    {
      id: 'msg2',
      conversationId: '1',
      platformMessageId: 'of_msg_2',
      senderId: 'creator',
      content: {
        text: 'Thank you so much! I have some exclusive content you might like 💕'
      },
      isFromCreator: true,
      createdAt: new Date('2024-01-20T10:15:00')
    },
    {
      id: 'msg3',
      conversationId: '1',
      platformMessageId: 'of_msg_3',
      senderId: 'of_user_1',
      content: {
        text: 'Yes please! What do you have?',
        tip: 10
      },
      isFromCreator: false,
      createdAt: new Date('2024-01-20T10:30:00')
    }
  ],
  '2': [
    {
      id: 'msg4',
      conversationId: '2',
      platformMessageId: 'of_msg_4',
      senderId: 'of_user_2',
      content: {
        text: 'Just subscribed! Excited to see your content'
      },
      isFromCreator: false,
      createdAt: new Date('2024-01-19T15:00:00')
    },
    {
      id: 'msg5',
      conversationId: '2',
      platformMessageId: 'of_msg_5',
      senderId: 'creator',
      content: {
        text: 'Welcome! So happy to have you here! Check out my pinned posts for some amazing content 🔥'
      },
      isFromCreator: true,
      readAt: new Date('2024-01-19T15:30:00'),
      createdAt: new Date('2024-01-19T15:45:00')
    }
  ]
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const messages = mockMessages[conversationId] || [];

    // Sort messages by date
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Mark unread messages as read (in real implementation)
    const unreadMessages = messages.filter(m => !m.isFromCreator && !m.readAt);
    if (unreadMessages.length > 0) {
      // TODO: Update read status in database
      console.log(`Marking ${unreadMessages.length} messages as read`);
    }

    return NextResponse.json({
      conversationId,
      messages,
      metadata: {
        totalMessages: messages.length,
        unreadCount: unreadMessages.length
      }
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}