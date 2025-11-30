/**
 * Marketing Campaigns API Routes
 * 
 * GET /api/marketing/campaigns - List campaigns with filters
 * POST /api/marketing/campaigns - Create a new campaign
 * 
 * Requirements: 3.1, 3.2, 3.5, 5.1, 5.2
 */

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { withValidation, validators } from '@/lib/api/middleware/validation';
import { marketingService } from '@/lib/api/services/marketing.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

/**
 * GET /api/marketing/campaigns
 * List campaigns with optional filters for status and channel
 * Requirements: 3.1, 3.5, 5.1, 5.2
 */
export const GET = withRateLimit(withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      user_id: parseInt(req.user.id),
      status: searchParams.get('status') as any,
      channel: searchParams.get('channel') as any,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await marketingService.listCampaigns(filters);

    return Response.json(successResponse(result));
  } catch (error: any) {
    console.error('Marketing campaigns list error:', error);
    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
  }
}));

/**
 * POST /api/marketing/campaigns
 * Create a new marketing campaign
 * Requirements: 3.2, 5.1, 5.2
 */
const createCampaignSchema = {
  name: validators.string({ required: true, minLength: 1, maxLength: 200 }),
  channel: validators.enum(['email', 'dm', 'sms', 'push'], { required: true }),
  goal: validators.enum(['engagement', 'conversion', 'retention'], { required: true }),
  audienceSegment: validators.string({ required: true, minLength: 1, maxLength: 200 }),
  audienceSize: validators.number({ required: false, min: 0 }),
  message: validators.object({}, { required: false }),
  schedule: validators.object({}, { required: false }),
  status: validators.enum(['draft', 'scheduled', 'active', 'paused', 'completed'], { required: false }),
};

export const POST = withRateLimit(
  withAuth(
    withValidation(createCampaignSchema, async (req, body) => {
      try {
        // Set default values
        const campaignData = {
          name: body.name,
          status: body.status || 'draft',
          channel: body.channel,
          goal: body.goal,
          audienceSegment: body.audienceSegment,
          audienceSize: body.audienceSize || 0,
          message: body.message || {},
          schedule: body.schedule,
        };

        const campaign = await marketingService.createCampaign(parseInt((req as any).user.id), campaignData);

        return Response.json(successResponse(campaign), { status: 201 });
      } catch (error: any) {
        console.error('Marketing campaign create error:', error);
        return Response.json(
          errorResponse('INTERNAL_ERROR', error.message),
          { status: 500 }
        );
      }
    })
  )
);
