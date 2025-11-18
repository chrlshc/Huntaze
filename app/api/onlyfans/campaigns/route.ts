/**
 * @deprecated This endpoint is deprecated and will be removed on 2025-02-17
 * Please use /api/marketing/campaigns instead
 * 
 * Migration Guide:
 * - Old: POST /api/onlyfans/campaigns
 * - New: POST /api/marketing/campaigns
 * 
 * See: docs/api/MIGRATION_GUIDE.md
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, verifyCSRFToken } from '@/lib/security/csrf';
import { campaignCreateSchema } from '@/lib/security/input-validation';
import { createCampaignId, createPlanTier, createUserId } from '@/types/branded';

export async function POST(req: NextRequest) {
  // Log deprecation warning
  console.warn('[DEPRECATED] /api/onlyfans/campaigns is deprecated. Use /api/marketing/campaigns instead');
  
  try {
    const parsed = campaignCreateSchema.parse(await req.json());

    const headerToken = req.headers.get(CSRF_HEADER_NAME);
    const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
    if (!verifyCSRFToken(headerToken, cookieToken)) {
      return NextResponse.json({ success: false, error: 'Invalid CSRF token' }, { status: 403 });
    }

    const validatedUserId = createUserId(parsed.userId);
    const validatedPlanTier = createPlanTier(parsed.planTier);
    const campaignId = createCampaignId(`camp_${Date.now().toString(36)}`);

    // Placeholder persistence logic - integrate with real data layer
    const payload = {
      id: campaignId,
      owner: validatedUserId,
      plan: validatedPlanTier,
      name: parsed.campaignName,
      createdAt: new Date().toISOString(),
    };

    const response = NextResponse.json({ success: true, campaign: payload });
    
    // Add deprecation headers
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', 'Sat, 17 Feb 2025 00:00:00 GMT');
    response.headers.set('Link', '</api/marketing/campaigns>; rel="alternate"');
    response.headers.set('Warning', '299 - "This API is deprecated. Use /api/marketing/campaigns instead"');
    
    return response;
  } catch (error: any) {
    const response = NextResponse.json(
      { success: false, error: error?.message ?? 'Invalid campaign payload' },
      { status: 400 },
    );
    
    // Add deprecation headers even on error
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', 'Sat, 17 Feb 2025 00:00:00 GMT');
    response.headers.set('Link', '</api/marketing/campaigns>; rel="alternate"');
    
    return response;
  }
}
