/**
 * AI Discount Recommendations API Route
 * 
 * POST /api/ai/offers/discounts
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recommendDiscounts, RecommendDiscountsRequest } from '@/lib/ai/offers-ai.service';
import { z } from 'zod';

// ============================================
// Validation Schema
// ============================================

const fanSegmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  size: z.number().int().min(0),
  averageSpend: z.number().min(0),
  engagementScore: z.number().min(0).max(10),
});

const purchaseDataSchema = z.object({
  fanId: z.string(),
  offerId: z.string(),
  amount: z.number().positive(),
  purchasedAt: z.string().datetime().or(z.date()),
});

const requestSchema = z.object({
  fanSegments: z.array(fanSegmentSchema).min(1, 'At least 1 fan segment required'),
  purchaseHistory: z.array(purchaseDataSchema).optional(),
});

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request body',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const discountRequest: RecommendDiscountsRequest = {
      userId: Number(session.user.id),
      fanSegments: validationResult.data.fanSegments,
      purchaseHistory: validationResult.data.purchaseHistory?.map(p => ({
        ...p,
        purchasedAt: new Date(p.purchasedAt),
      })),
    };

    // Get discount recommendations
    const recommendations = await recommendDiscounts(discountRequest);

    return NextResponse.json({
      success: true,
      recommendations,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error in discount recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate discount recommendations' },
      { status: 500 }
    );
  }
}
