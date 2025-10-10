export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, verifyCSRFToken } from '@/lib/security/csrf';
import { campaignCreateSchema } from '@/lib/security/input-validation';
import { createCampaignId, createPlanTier, createUserId } from '@/types/branded';

export async function POST(req: NextRequest) {
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

    return NextResponse.json({ success: true, campaign: payload });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Invalid campaign payload' },
      { status: 400 },
    );
  }
}
