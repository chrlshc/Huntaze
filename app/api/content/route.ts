/**
 * Content API
 * 
 * GET /api/content - List content with filters
 * POST /api/content - Create new content
 * 
 * Protected with:
 * - withAuth (authentication required)
 * - withCsrf (POST only)
 * - withRateLimit
 * 
 * Requirements: 1.5, 3.1, 4.1, 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { composeMiddleware } from '@/lib/middleware/types';
import type { RouteHandler } from '@/lib/middleware/types';
import { contentService } from '@/lib/api/services/content.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

/**
 * GET /api/content
 * List content with filters and pagination
 */
const getHandler: RouteHandler = async (req: NextRequest) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'User ID not found'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const filters = {
      userId: parseInt(userId),
      status: searchParams.get('status') as any,
      platform: (searchParams.get('platform') as any) || undefined,
      type: (searchParams.get('type') as any) || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await contentService.listContent(filters);

    return NextResponse.json(successResponse(result));
  } catch (error: any) {
    console.error('Content list error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
  }
};

/**
 * POST /api/content
 * Create new content
 */
const postHandler: RouteHandler = async (req: NextRequest) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'User ID not found'),
        { status: 401 }
      );
    }

    const body = await req.json();

    // Basic validation
    if (!body.title || !body.type || !body.platform || !body.status) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Missing required fields'),
        { status: 400 }
      );
    }

    const content = await contentService.createContent(parseInt(userId), body);
    return NextResponse.json(successResponse(content), { status: 201 });
  } catch (error: any) {
    console.error('Content create error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
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
