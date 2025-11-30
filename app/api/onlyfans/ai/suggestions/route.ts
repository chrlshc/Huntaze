import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import { onlyFansAISuggestions } from '@/lib/services/onlyfans-ai-suggestions.service';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const SuggestionsRequestSchema = z.object({
  fanId: z.number(),
  fanName: z.string(),
  fanHandle: z.string().optional(),
  lastMessage: z.string().optional(),
  lastMessageDate: z.string().optional(),
  fanValueCents: z.number().optional(),
  messageCount: z.number().optional(),
});

/**
 * POST /api/onlyfans/ai/suggestions
 * Génère des suggestions de messages AI pour un fan OnlyFans
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = SuggestionsRequestSchema.parse(body);

    logger.info('Generating AI suggestions for OnlyFans fan', {
      userId: authResult.user.id,
      fanId: validatedData.fanId,
      fanName: validatedData.fanName,
    });

    // Generate suggestions
    const suggestions = await onlyFansAISuggestions.generateSuggestions({
      fanName: validatedData.fanName,
      fanHandle: validatedData.fanHandle,
      lastMessage: validatedData.lastMessage,
      lastMessageDate: validatedData.lastMessageDate ? new Date(validatedData.lastMessageDate) : undefined,
      fanValueCents: validatedData.fanValueCents,
      messageCount: validatedData.messageCount,
    });

    logger.info('AI suggestions generated successfully', {
      userId: authResult.user.id,
      fanId: validatedData.fanId,
      suggestionsCount: suggestions.length,
    });

    return NextResponse.json({
      success: true,
      suggestions,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid request body for AI suggestions', { error: error.issues });
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Failed to generate AI suggestions', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
