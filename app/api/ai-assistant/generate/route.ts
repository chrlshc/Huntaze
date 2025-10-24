import { NextRequest } from 'next/server';
import { withErrorHandling, jsonError } from '@/src/lib/http/errors';
import { z } from 'zod';
import { getServerAuth } from '@/lib/server-auth';
import { getAIService, AIRequestSchema } from '@/lib/services/ai-service';
import { ContentCreationEventEmitter } from '@/lib/services/sse-events';

// Extended request schema for API
const GenerateRequestSchema = AIRequestSchema.extend({
  provider: z.enum(['openai', 'claude', 'gemini']).optional(),
  saveToHistory: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = GenerateRequestSchema.safeParse(body);

    if (!validatedData.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid request data', 400, {
        errors: validatedData.error.errors,
      });
    }

    const { provider, saveToHistory, ...aiRequest } = validatedData.data;

    // Ensure user context
    aiRequest.context.userId = auth.user.id;

    try {
      const aiService = getAIService();
      const response = await aiService.generateText(aiRequest, provider);

      // Save to conversation history if requested
      if (saveToHistory) {
        // In a real implementation, save to database
        console.log('Saving to conversation history:', {
          userId: auth.user.id,
          prompt: aiRequest.prompt,
          response: response.content,
          provider: response.provider,
          contentType: aiRequest.context.contentType,
        });
      }

      // Emit AI insight event for real-time updates
      ContentCreationEventEmitter.emitAIInsight(auth.user.id, {
        type: aiRequest.context.contentType || 'general',
        title: 'AI Generated Content',
        content: response.content,
        provider: response.provider,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      });

      return Response.json({
        success: true,
        data: {
          content: response.content,
          provider: response.provider,
          model: response.model,
          usage: response.usage,
          finishReason: response.finishReason,
          contentType: aiRequest.context.contentType,
        },
        timestamp: new Date(),
        requestId: crypto.randomUUID(),
      });

    } catch (error: any) {
      console.error('AI generation error:', error);

      // Handle specific AI service errors
      if (error.message.includes('Rate limit exceeded')) {
        return jsonError('RATE_LIMIT_EXCEEDED', error.message, 429);
      }

      if (error.message.includes('API error')) {
        return jsonError('AI_SERVICE_ERROR', 'AI service temporarily unavailable', 503, {
          originalError: error.message,
        });
      }

      return jsonError('AI_GENERATION_FAILED', 'Failed to generate AI content', 500, {
        error: error.message,
      });
    }
  });
}

// Get available AI providers
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    try {
      const aiService = getAIService();
      const availableProviders = await aiService.getAvailableProviders();
      const providerStatus = aiService.getProviderStatus();

      return Response.json({
        success: true,
        data: {
          availableProviders,
          providerStatus,
          defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'openai',
        },
        timestamp: new Date(),
        requestId: crypto.randomUUID(),
      });

    } catch (error: any) {
      return jsonError('SERVICE_ERROR', 'Failed to get provider status', 500, {
        error: error.message,
      });
    }
  });
}