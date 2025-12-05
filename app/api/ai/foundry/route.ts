/**
 * AI Foundry API Route - Direct Azure AI Foundry Router Access
 * 
 * Simple endpoint for direct AI interactions via the Azure AI Foundry router.
 * Use this for general-purpose AI tasks (chat, math, coding, creative).
 * 
 * @endpoint POST /api/ai/foundry
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRouterClient, RouterError, RouterErrorCode } from '@/lib/ai/foundry/router-client';
import { calculateCostBreakdown, convertRouterUsage } from '@/lib/ai/foundry/cost-calculator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================================================
// Types
// =============================================================================

interface FoundryRequest {
  message: string;
  type?: 'chat' | 'math' | 'coding' | 'creative';
  tier?: 'standard' | 'vip';
  systemPrompt?: string;
}

// =============================================================================
// Handler
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request
    const body: FoundryRequest = await request.json();

    // Validate
    if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build prompt
    const prompt = body.systemPrompt
      ? `${body.systemPrompt}\n\nUser: ${body.message}`
      : body.message;

    // Get router client
    const client = getRouterClient();

    // Make request
    const response = await client.route({
      prompt,
      client_tier: body.tier || 'standard',
      type_hint: body.type
    });

    // Calculate cost
    let cost = null;
    if (response.usage) {
      const usage = convertRouterUsage(response.usage);
      cost = calculateCostBreakdown(response.model, usage);
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: response.output,
      model: response.model,
      deployment: response.deployment,
      region: response.region,
      routing: response.routing,
      tokens: response.usage ? {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
        total: response.usage.total_tokens
      } : null,
      cost: cost ? {
        input: cost.inputCost,
        output: cost.outputCost,
        total: cost.totalCost
      } : null,
      duration
    }, {
      headers: {
        'X-Duration-Ms': duration.toString(),
        'X-Model': response.model,
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    // Handle RouterError
    if (error instanceof RouterError) {
      const statusMap: Record<RouterErrorCode, number> = {
        [RouterErrorCode.VALIDATION_ERROR]: 400,
        [RouterErrorCode.TIMEOUT_ERROR]: 504,
        [RouterErrorCode.CONNECTION_ERROR]: 503,
        [RouterErrorCode.SERVICE_ERROR]: 502,
        [RouterErrorCode.PARSE_ERROR]: 500
      };

      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        retryable: error.code !== RouterErrorCode.VALIDATION_ERROR
      }, {
        status: statusMap[error.code] || 500,
        headers: {
          'X-Duration-Ms': duration.toString(),
          ...(error.code === RouterErrorCode.TIMEOUT_ERROR && { 'Retry-After': '5' })
        }
      });
    }

    // Generic error
    console.error('[AI Foundry] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      retryable: true
    }, {
      status: 500,
      headers: {
        'X-Duration-Ms': duration.toString(),
        'Retry-After': '10'
      }
    });
  }
}

// =============================================================================
// Health Check
// =============================================================================

export async function GET() {
  try {
    const client = getRouterClient();
    const health = await client.healthCheck();

    return NextResponse.json({
      status: 'ok',
      router: {
        status: health.status,
        region: health.region
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      router: {
        status: 'unreachable',
        region: 'unknown'
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
