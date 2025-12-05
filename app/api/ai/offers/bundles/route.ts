/**
 * AI Bundle Suggestions API Route
 * 
 * POST /api/ai/offers/bundles
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import { suggestBundles, SuggestBundlesRequest } from '@/lib/ai/offers-ai.service';
import { z } from 'zod';

// ============================================
// Validation Schema
// ============================================

const contentItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.string(),
  price: z.number().positive(),
  salesCount: z.number().int().min(0),
});

const fanPreferenceSchema = z.object({
  fanId: z.string(),
  preferredTypes: z.array(z.string()),
  purchaseHistory: z.array(z.string()),
  averageSpend: z.number().min(0),
});

const requestSchema = z.object({
  contentItems: z.array(contentItemSchema).min(2, 'At least 2 content items required'),
  fanPreferences: z.array(fanPreferenceSchema).optional(),
});

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

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

    const bundleRequest: SuggestBundlesRequest = {
      userId: Number(session.user.id),
      contentItems: validationResult.data.contentItems,
      fanPreferences: validationResult.data.fanPreferences,
    };

    // Get bundle suggestions
    const suggestions = await suggestBundles(bundleRequest);

    return NextResponse.json({
      success: true,
      suggestions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error in bundle suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate bundle suggestions' },
      { status: 500 }
    );
  }
}
