import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { withValidation, validators } from '@/lib/api/middleware/validation';
import { contentService } from '@/lib/api/services/content.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/content/[id]
 * Get single content by ID
 */
export const GET = withRateLimit(withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = context.params;

    const content = await contentService.getContent(parseInt(req.user.id), id);

    return Response.json(successResponse(content));
  } catch (error: any) {
    console.error('Content get error:', error);

    if (error.message === 'Content not found or access denied') {
      return Response.json(
        errorResponse('NOT_FOUND', 'Content not found'),
        { status: 404 }
      );
    }

    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
  }
}));

/**
 * PUT /api/content/[id]
 * Update content by ID
 */
const updateContentSchema = {
  title: validators.string({ required: false, minLength: 1, maxLength: 500 }),
  text: validators.string({ required: false, maxLength: 10000 }),
  type: validators.enum(['image', 'video', 'text'], { required: false }),
  platform: validators.enum(['onlyfans', 'fansly', 'instagram', 'tiktok'], { required: false }),
  status: validators.enum(['draft', 'scheduled', 'published'], { required: false }),
  category: validators.string({ required: false, maxLength: 100 }),
  tags: validators.array({ required: false, maxLength: 20 }),
  mediaIds: validators.array({ required: false, maxLength: 50 }),
  scheduledAt: validators.date({ required: false }),
  publishedAt: validators.date({ required: false }),
};

export const PUT = withRateLimit(
  withAuth(
    withValidation(updateContentSchema, async (req, body, context: RouteContext) => {
      try {
        const authenticatedReq = req as AuthenticatedRequest;
        const { id } = context.params;
        const content = await contentService.updateContent(parseInt(authenticatedReq.user.id), id, body);
        return Response.json(successResponse(content));
      } catch (error: any) {
        console.error('Content update error:', error);

        if (error.message === 'Content not found or access denied') {
          return Response.json(
            errorResponse('FORBIDDEN', 'Content not found or access denied'),
            { status: 403 }
          );
        }

        return Response.json(
          errorResponse('INTERNAL_ERROR', error.message),
          { status: 500 }
        );
      }
    })
  )
);

/**
 * DELETE /api/content/[id]
 * Delete content by ID
 */
export const DELETE = withRateLimit(withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = context.params;

    await contentService.deleteContent(parseInt(req.user.id), id);

    return Response.json(
      successResponse({ message: 'Content deleted successfully' })
    );
  } catch (error: any) {
    console.error('Content delete error:', error);

    if (error.message === 'Content not found or access denied') {
      return Response.json(
        errorResponse('FORBIDDEN', 'Content not found or access denied'),
        { status: 403 }
      );
    }

    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
  }
}));
