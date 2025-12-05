/**
 * AI Pricing Suggestions API Route
 * 
 * POST /api/ai/offers/pricing
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { suggestPricing, SuggestPricingRequest } from '@/lib/ai/offers-ai.service';
import { z } from 'zod';

// ============================================
// Validation Schema
// ============================================

const salesDataSchema = z.object({
  contentId: z.string(),
  price: z.number().positive(),
  salesCount: z.number().int().min(0),
  revenue: z.number().min(0),
  period: z.string(),
});

const requestSchema = z.object({
  contentId: z.string().min(1),
  currentPrice: z.number().positive().optional(),
  historicalSales: z.array(salesDataSchema).default([]),
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

    const pricingRequest: SuggestPricingRequest = validationResult.data;

    // Get pricing suggestions
    const suggestions = await suggestPricing(pricingRequest);

    return NextResponse.json({
      success: true,
      contentId: pricingRequest.contentId,
      suggestions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error in pricing suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate pricing suggestions' },
      { status: 500 }
    );
  }
}
