/**
 * User Profile API
 * 
 * GET /api/users/profile - Get user profile
 * POST /api/users/profile - Create/update user profile
 * PUT /api/users/profile - Update user profile
 * 
 * Protected with:
 * - withAuth (authentication required)
 * - withCsrf (POST/PUT only)
 * - withRateLimit
 * 
 * Requirements: 1.5, 3.1, 4.1, 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserProfilesRepository } from '@/lib/db/repositories';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { composeMiddleware } from '@/lib/middleware/types';
import type { RouteHandler } from '@/lib/middleware/types';

/**
 * GET handler - Fetch user profile
 */
const getHandler: RouteHandler = async (request: NextRequest) => {
  try {
    const userId = parseInt((request as AuthenticatedRequest).user?.id || '', 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const profile = await UserProfilesRepository.getProfile(userId);
    
    // Return default if no profile exists yet
    if (!profile) {
      return NextResponse.json({
        displayName: '',
        bio: '',
        timezone: '',
        niche: '',
        goals: []
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
};

/**
 * POST handler - Create/update user profile
 */
const postHandler: RouteHandler = async (request: NextRequest) => {
  try {
    const userId = parseInt((request as AuthenticatedRequest).user?.id || '', 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const payload = await request.json();
    const profile = await UserProfilesRepository.upsertProfile(userId, payload);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
};

/**
 * PUT handler - Update user profile
 */
const putHandler: RouteHandler = async (request: NextRequest) => {
  try {
    const userId = parseInt((request as AuthenticatedRequest).user?.id || '', 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const payload = await request.json();
    const profile = await UserProfilesRepository.upsertProfile(userId, payload);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
};

// Apply middlewares: auth + rate limiting (GET)
export const GET = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 60, windowMs: 60000 }),
  withAuth,
])(getHandler);

// Apply middlewares: auth + CSRF + rate limiting (POST)
export const POST = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 20, windowMs: 60000 }),
  withCsrf,
  withAuth,
])(postHandler);

// Apply middlewares: auth + CSRF + rate limiting (PUT)
export const PUT = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 20, windowMs: 60000 }),
  withCsrf,
  withAuth,
])(putHandler);
