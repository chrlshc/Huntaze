/**
 * AI Fan Segmentation API
 * 
 * POST /api/ai/fans/segment - Segment fans into categories
 * POST /api/ai/fans/segment?action=churn - Predict churn for specific fan
 * POST /api/ai/fans/segment?action=at-risk - Get at-risk fans list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import {
  segmentFans,
  predictChurn,
  getAIFanSegmentationService,
  type Fan,
} from '@/lib/ai/fan-segmentation.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// POST /api/ai/fans/segment
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
      case 'churn':
        return handleChurnPrediction(body, creatorId, startTime);
      
      case 'at-risk':
        return handleAtRiskFans(body, startTime);
      
      default:
        return handleSegmentation(body, creatorId, startTime);
    }

  } catch (error: any) {
    console.error('[AI Segmentation API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to segment fans' },
      { status: 500 }
    );
  }
}

// ============================================
// Handlers
// ============================================

async function handleSegmentation(
  body: any,
  creatorId: number,
  startTime: number
) {
  const { fans, includeRecommendations } = body;

  if (!fans || !Array.isArray(fans)) {
    return NextResponse.json(
      { success: false, error: 'Fans array is required' },
      { status: 400 }
    );
  }

  // Validate fan objects
  const validFans = fans.filter(isValidFan).map(normalizeFan);

  if (validFans.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No valid fan data provided' },
      { status: 400 }
    );
  }

  const result = await segmentFans({
    creatorId,
    fans: validFans,
    includeRecommendations: includeRecommendations !== false,
  });

  return NextResponse.json({
    success: true,
    data: result,
    duration: Date.now() - startTime,
  });
}

async function handleChurnPrediction(
  body: any,
  creatorId: number,
  startTime: number
) {
  const { fan } = body;

  if (!fan || !isValidFan(fan)) {
    return NextResponse.json(
      { success: false, error: 'Valid fan data is required' },
      { status: 400 }
    );
  }

  const result = await predictChurn({
    creatorId,
    fan: normalizeFan(fan),
  });

  return NextResponse.json({
    success: true,
    data: result,
    duration: Date.now() - startTime,
  });
}

async function handleAtRiskFans(body: any, startTime: number) {
  const { fans, limit } = body;

  if (!fans || !Array.isArray(fans)) {
    return NextResponse.json(
      { success: false, error: 'Fans array is required' },
      { status: 400 }
    );
  }

  const validFans = fans.filter(isValidFan).map(normalizeFan);
  const service = getAIFanSegmentationService();
  const result = await service.getAtRiskFans(validFans, limit || 10);

  return NextResponse.json({
    success: true,
    data: { atRiskFans: result, count: result.length },
    duration: Date.now() - startTime,
  });
}

// ============================================
// Validation
// ============================================

function isValidFan(fan: any): boolean {
  return (
    fan &&
    typeof fan.id === 'string' &&
    typeof fan.name === 'string' &&
    typeof fan.totalSpent === 'number' &&
    typeof fan.subscriptionDays === 'number'
  );
}

function normalizeFan(fan: any): Fan {
  return {
    id: fan.id,
    name: fan.name,
    username: fan.username || undefined,
    totalSpent: Number(fan.totalSpent) || 0,
    subscriptionDays: Number(fan.subscriptionDays) || 0,
    lastActive: fan.lastActive ? new Date(fan.lastActive) : new Date(),
    messageCount: Number(fan.messageCount) || 0,
    purchaseCount: Number(fan.purchaseCount) || 0,
    tipAmount: Number(fan.tipAmount) || 0,
    renewalProbability: fan.renewalProbability,
  };
}
