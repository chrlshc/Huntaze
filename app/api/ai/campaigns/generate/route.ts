/**
 * AI Campaign Generator API
 * 
 * POST /api/ai/campaigns/generate - Generate complete marketing campaign
 * POST /api/ai/campaigns/generate?action=subject - Optimize subject line
 * POST /api/ai/campaigns/generate?action=variations - Generate A/B variations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import {
  generateCampaign,
  optimizeSubjectLine,
  getAICampaignGeneratorService,
  type CampaignType,
} from '@/lib/ai/campaign-generator.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CAMPAIGN_TYPES: CampaignType[] = [
  'promotion', 'reengagement', 'announcement', 'upsell', 'welcome', 'seasonal'
];

// ============================================
// POST /api/ai/campaigns/generate
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = request.nextUrl.searchParams.get('action');
    const creatorId = parseInt(session.user.id);

    // Route to appropriate handler
    switch (action) {
      case 'subject':
        return handleSubjectOptimization(body, startTime);
      
      case 'variations':
        return handleVariations(body, creatorId, startTime);
      
      default:
        return handleCampaignGeneration(body, creatorId, startTime);
    }

  } catch (error: any) {
    console.error('[AI Campaign API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate campaign' },
      { status: 500 }
    );
  }
}

// ============================================
// Handlers
// ============================================

async function handleCampaignGeneration(
  body: any,
  creatorId: number,
  startTime: number
) {
  const { type, goal, targetAudience, tone, includeOffer, offerDetails } = body;

  // Validate required fields
  if (!type || !VALID_CAMPAIGN_TYPES.includes(type)) {
    return NextResponse.json(
      { 
        success: false, 
        error: `Invalid campaign type. Must be one of: ${VALID_CAMPAIGN_TYPES.join(', ')}` 
      },
      { status: 400 }
    );
  }

  if (!goal || typeof goal !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Campaign goal is required' },
      { status: 400 }
    );
  }

  const result = await generateCampaign({
    creatorId,
    type,
    goal,
    targetAudience,
    tone,
    includeOffer,
    offerDetails,
  });

  return NextResponse.json({
    success: true,
    data: result,
    duration: Date.now() - startTime,
  });
}

async function handleSubjectOptimization(body: any, startTime: number) {
  const { subject, campaignType, tone, maxLength } = body;

  if (!subject || typeof subject !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Subject line is required' },
      { status: 400 }
    );
  }

  const result = await optimizeSubjectLine({
    originalSubject: subject,
    campaignType: campaignType || 'promotion',
    tone,
    maxLength,
  });

  return NextResponse.json({
    success: true,
    data: result,
    duration: Date.now() - startTime,
  });
}

async function handleVariations(
  body: any,
  creatorId: number,
  startTime: number
) {
  const { type, goal, targetAudience, tone, includeOffer, offerDetails, count } = body;

  if (!type || !VALID_CAMPAIGN_TYPES.includes(type)) {
    return NextResponse.json(
      { success: false, error: 'Invalid campaign type' },
      { status: 400 }
    );
  }

  if (!goal) {
    return NextResponse.json(
      { success: false, error: 'Campaign goal is required' },
      { status: 400 }
    );
  }

  const service = getAICampaignGeneratorService();
  const result = await service.generateCampaignVariations(
    { creatorId, type, goal, targetAudience, tone, includeOffer, offerDetails },
    Math.min(count || 3, 5) // Max 5 variations
  );

  return NextResponse.json({
    success: true,
    data: { campaigns: result, count: result.length },
    duration: Date.now() - startTime,
  });
}
