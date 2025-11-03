import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
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
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = SuggestionsRequestSchema.parse(body);

    logger.info('Generating AI suggestions for OnlyFans fan', {
      userId: user.userId,
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
      userId: user.userId,
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
      logger.warn('Invalid request body for AI suggestions', { error: error.errors });
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to generate AI suggestions', { error });
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
