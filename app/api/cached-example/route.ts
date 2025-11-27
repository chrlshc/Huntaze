/**
 * Example API route demonstrating cache middleware usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCache, CachePresets, invalidateCacheByTag } from '@/lib/cache/api-cache';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cached-example
 * Demonstrates cache-first data fetching
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

    // Use cache middleware with tag-based invalidation
    const userData = await withCache(
      async () => {
        // This DB query only runs on cache miss
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: true,
            settings: true,
          },
        });

        return user;
      },
      {
        key: `user:${userId}`,
        ttl: CachePresets.MEDIUM.ttl, // 5 minutes
        tags: ['user', `user:${userId}`],
      }
    );

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: userData,
      cached: true,
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
 * POST /api/cached-example
 * Demonstrates cache invalidation on mutation
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

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
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

/**
 * DELETE /api/cached-example
 * Demonstrates cache invalidation on deletion
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Delete user from database
    await prisma.user.delete({
      where: { id: userId },
    });

    // Invalidate all user-related cache
    invalidateCacheByTag('user');

    return NextResponse.json({
      message: 'User deleted and cache invalidated',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
