/**
 * Marketing Campaign Individual Routes
 * 
 * GET /api/marketing/campaigns/[id] - Get a specific campaign
 * PUT /api/marketing/campaigns/[id] - Update a campaign
 * DELETE /api/marketing/campaigns/[id] - Delete a campaign
 * 
 * Requirements: 3.3, 3.4, 5.1, 5.2
 */

import { NextRequest } from 'next/server';
import { withOnboarding, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { withValidation, validators } from '@/lib/api/middleware/validation';
import { marketingService } from '@/lib/api/services/marketing.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/marketing/campaigns/[id]
 * Get a specific campaign by ID
 * Requirements: 3.1, 5.1, 5.2
 */
export const GET = withRateLimit(withOnboarding(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const campaignId = context.params.id;

    const campaign = await marketingService.getCampaign(parseInt(req.user.id), campaignId);

    if (!campaign) {
      return Response.json(
        errorResponse('NOT_FOUND', 'Campaign not found'),
        { status: 404 }
      );
    }

    return Response.json(successResponse(campaign));
  } catch (error: any) {
    console.error('Marketing campaign get error:', error);
    
    if (error.message.includes('access denied')) {
      return Response.json(
        errorResponse('FORBIDDEN', 'Access denied'),
        { status: 403 }
      );
    }

    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
  }
}));

/**
 * PUT /api/marketing/campaigns/[id]
 * Update a campaign with ownership verification
 * Requirements: 3.3, 5.1, 5.2
 */
const updateCampaignSchema = {
  name: validators.string({ required: false, minLength: 1, maxLength: 200 }),
  channel: validators.enum(['email', 'dm', 'sms', 'push'], { required: false }),
  goal: validators.enum(['engagement', 'conversion', 'retention'], { required: false }),
  audienceSegment: validators.string({ required: false, minLength: 1, maxLength: 200 }),
  audienceSize: validators.number({ required: false, min: 0 }),
  message: validators.object({}, { required: false }),
  schedule: validators.object({}, { required: false }),
  status: validators.enum(['draft', 'scheduled', 'active', 'paused', 'completed'], { required: false }),
};

export const PUT = withRateLimit(
  withOnboarding(
    withValidation(updateCampaignSchema, async (req, body, context: RouteContext) => {
      try {
        const campaignId = context.params.id;

        const campaign = await marketingService.updateCampaign(
          parseInt((req as any).user.id),
          campaignId,
          body
        );

        return Response.json(successResponse(campaign));
      } catch (error: any) {
        console.error('Marketing campaign update error:', error);

        if (error.message.includes('not found') || error.message.includes('access denied')) {
          return Response.json(
            errorResponse('NOT_FOUND', 'Campaign not found or access denied'),
            { status: 404 }
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
 * DELETE /api/marketing/campaigns/[id]
 * Delete a campaign with ownership verification
 * Requirements: 3.4, 5.1, 5.2
 */
export const DELETE = withRateLimit(withOnboarding(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const campaignId = context.params.id;

    await marketingService.deleteCampaign(parseInt(req.user.id), campaignId);

    return Response.json(
      successResponse({ message: 'Campaign deleted successfully' })
    );
  } catch (error: any) {
    console.error('Marketing campaign delete error:', error);

    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return Response.json(
        errorResponse('NOT_FOUND', 'Campaign not found or access denied'),
        { status: 404 }
      );
    }

    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
  }
}));
