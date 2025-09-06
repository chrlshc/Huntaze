import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { z } from 'zod';
import type { OfConversation } from '@/lib/types/onlyfans';

// Mock data for now - will be replaced with actual OF sync
const mockConversations: OfConversation[] = [
  {
    id: '1',
    userId: 'user123',
    platformUserId: 'of_user_1',
    username: 'fan_alice',
    displayName: 'Alice',
    avatarUrl: 'https://via.placeholder.com/50',
    isSubscribed: true,
    subscriptionPrice: 15,
    totalSpent: 250,
    totalTips: 0,
    totalPPVPurchases: 0,
    lastMessageAt: new Date('2024-01-20T10:30:00'),
    unreadCount: 2,
    tags: ['VIP'],
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    userId: 'user123',
    platformUserId: 'of_user_2',
    username: 'fan_bob',
    displayName: 'Bob',
    avatarUrl: 'https://via.placeholder.com/50',
    isSubscribed: true,
    subscriptionPrice: 10,
    totalSpent: 150,
    totalTips: 0,
    totalPPVPurchases: 0,
    lastMessageAt: new Date('2024-01-19T15:45:00'),
    unreadCount: 0,
    tags: [],
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-19')
  }
];

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  filter: z.enum(['all', 'unread', 'vip', 'active']).default('all'),
  search: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const query = querySchema.parse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      filter: url.searchParams.get('filter'),
      search: url.searchParams.get('search')
    });

    // Filter conversations based on query
    let filtered = [...mockConversations];

    // Apply filter
    switch (query.filter) {
      case 'unread':
        filtered = filtered.filter(c => c.unreadCount > 0);
        break;
      case 'vip':
        filtered = filtered.filter(c => c.tags.includes('VIP'));
        break;
      case 'active':
        filtered = filtered.filter(c => c.isSubscribed);
        break;
    }

    // Apply search
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.username.toLowerCase().includes(searchLower) ||
        c.displayName?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by last message
    filtered.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    // Paginate
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const paginated = filtered.slice(start, end);

    return NextResponse.json({
      conversations: paginated,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / query.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching OF inbox:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
