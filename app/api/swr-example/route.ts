/**
 * Example API route demonstrating stale-while-revalidate
 */

import { NextRequest, NextResponse } from 'next/server';
import { withStaleWhileRevalidate, SWRPresets } from '@/lib/cache/stale-while-revalidate';
import { invalidateCacheByTag } from '@/lib/cache/api-cache';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/swr-example
 * Demonstrates stale-while-revalidate pattern
 * 
 * Behavior:
 * - First request: Fetches from DB (slow)
 * - Subsequent requests within 5min: Returns cached data (fast)
 * - Requests after 5min but within 10min: Returns stale data immediately (fast)
 *   and fetches fresh data in background
 * - Requests after 10min: Fetches from DB (slow)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Parse userId to number (Prisma expects number for id field)
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Use stale-while-revalidate
    const userData = await withStaleWhileRevalidate(
      async () => {
        console.log(`[SWR] Fetching fresh data for user ${userId}`);
        
        // Simulate slow DB query
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        const user = await prisma.users.findUnique({
          where: { id: userIdNum },
        });

        return user;
      },
      {
        key: `swr:user:${userId}`,
        ttl: SWRPresets.MEDIUM.ttl, // 5 minutes fresh
        staleWhileRevalidate: SWRPresets.MEDIUM.staleWhileRevalidate, // 5 minutes stale
        tags: ['user', `user:${userId}`],
      }
    );

    const duration = Date.now() - startTime;

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: userData,
      meta: {
        duration: `${duration}ms`,
        strategy: 'stale-while-revalidate',
        note: duration < 50 ? 'Served from cache' : 'Fetched from database',
      },
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/swr-example
 * Update user and invalidate cache
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Parse userId to number (Prisma expects number for id field)
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 }
      );
    }

    // Update user in database
    const updatedUser = await prisma.users.update({
      where: { id: userIdNum },
      data: { name, email },
    });

    // Invalidate cache for this user
    invalidateCacheByTag(`user:${userId}`);

    return NextResponse.json({
      data: updatedUser,
      message: 'User updated and cache invalidated',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
