import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { withValidation, validators } from '@/lib/api/middleware/validation';
import { contentService } from '@/lib/api/services/content.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

/**
 * GET /api/content
 * List content with filters and pagination
 */
export const GET = withRateLimit(withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      userId: parseInt(req.user.id),
      status: searchParams.get('status') as any,
      platform: searchParams.get('platform') || undefined,
      type: searchParams.get('type') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await contentService.listContent(filters);

    return Response.json(successResponse(result));
  } catch (error: any) {
    console.error('Content list error:', error);
    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
  }
}));

/**
 * POST /api/content
 * Create new content
 */
const createContentSchema = {
  title: validators.string({ required: true, minLength: 1, maxLength: 500 }),
  text: validators.string({ required: false, maxLength: 10000 }),
  type: validators.enum(['image', 'video', 'text'], { required: true }),
  platform: validators.enum(['onlyfans', 'fansly', 'instagram', 'tiktok'], { required: true }),
  status: validators.enum(['draft', 'scheduled', 'published'], { required: true }),
  category: validators.string({ required: false, maxLength: 100 }),
  tags: validators.array({ required: false, maxLength: 20 }),
  mediaIds: validators.array({ required: false, maxLength: 50 }),
  scheduledAt: validators.date({ required: false }),
};

export const POST = withRateLimit(
  withAuth(
    withValidation(createContentSchema, async (req, body) => {
      try {
        const content = await contentService.createContent(parseInt(req.user.id), body);
        return Response.json(successResponse(content), { status: 201 });
      } catch (error: any) {
        console.error('Content create error:', error);
        return Response.json(
          errorResponse('INTERNAL_ERROR', error.message),
          { status: 500 }
        );
      }
    })
  )
);
