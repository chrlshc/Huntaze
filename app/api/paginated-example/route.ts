/**
 * Example API route demonstrating cursor-based pagination
 * 
 * Usage:
 * GET /api/paginated-example?limit=20
 * GET /api/paginated-example?cursor=abc123&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { paginateWithCursor } from '@/lib/database/cursor-pagination';

// Mock data for demonstration
// In production, this would be a Prisma query
const mockData = Array.from({ length: 150 }, (_, i) => ({
  id: String(i + 1),
  name: `Item ${i + 1}`,
  createdAt: new Date(Date.now() - i * 1000 * 60 * 60),
}));

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const orderBy = (searchParams.get('orderBy') || 'desc') as 'asc' | 'desc';

    // Simulate database query with cursor pagination
    const result = await paginateWithCursor(
      async (options) => {
        // In production, this would be:
        // return prisma.item.findMany({
        //   ...options,
        //   where: { /* your filters */ }
        // });

        // Mock implementation
        let data = [...mockData];
        
        if (orderBy === 'asc') {
          data = data.reverse();
        }

        if (options.cursor) {
          const cursorIndex = data.findIndex(item => item.id === options.cursor.id);
          if (cursorIndex !== -1) {
            data = data.slice(cursorIndex + 1);
          }
        }

        return data.slice(0, options.take);
      },
      { cursor, limit, orderBy }
    );

    return NextResponse.json({
      success: true,
      ...result,
      meta: {
        limit,
        orderBy,
      },
    });
  } catch (error) {
    console.error('Pagination error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch paginated data' },
      { status: 500 }
    );
  }
}
