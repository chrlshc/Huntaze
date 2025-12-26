import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { assertMockEnabled } from '@/lib/config/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const mockDisabled = assertMockEnabled('/api/of/inbox');
  if (mockDisabled) return mockDisabled;

  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock inbox data for development
    const mockInbox = {
      conversations: [
        {
          id: 'conv1',
          fanId: 'fan1',
          fanName: 'Fan User',
          lastMessage: {
            text: 'Hello!',
            createdAt: new Date().toISOString(),
            isFromCreator: false
          },
          unreadCount: 1,
          updatedAt: new Date().toISOString()
        }
      ],
      totalUnread: 1,
      hasMore: false,
      nextCursor: null
    };

    return NextResponse.json(mockInbox);

  } catch (error) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}
