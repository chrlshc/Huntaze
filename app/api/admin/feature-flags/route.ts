/**
 * Admin API for managing feature flags
 * POST /api/admin/feature-flags - Update feature flags
 * GET /api/admin/feature-flags - Get current feature flags
 * 
 * @see docs/api/admin-feature-flags.md for full documentation
 */

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getFlags, updateFlags, type OnboardingFlags } from '@/lib/feature-flags';

export const runtime = 'nodejs';

/**
 * TypeScript types for API requests/responses
 */
export interface FeatureFlagsResponse {
  flags: OnboardingFlags;
  correlationId: string;
}

export interface UpdateFeatureFlagsRequest {
  enabled?: boolean;
  rolloutPercentage?: number;
  markets?: string[];
  userWhitelist?: string[];
}

export interface UpdateFeatureFlagsResponse {
  success: boolean;
  flags: OnboardingFlags;
  correlationId: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: string;
  correlationId: string;
}

/**
 * Structured logging helper
 */
function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[Feature Flags API] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

function logInfo(context: string, metadata?: Record<string, any>) {
  console.log(`[Feature Flags API] ${context}`, metadata);
}

/**
 * GET /api/admin/feature-flags
 * Get current feature flag configuration
 * 
 * Response:
 * {
 *   flags: OnboardingFlags,
 *   correlationId: string
 * }
 * 
 * Error Responses:
 * - 401 Unauthorized: User not authenticated or not admin
 * - 500 Internal Server Error: Failed to retrieve flags
 */
export async function GET(req: Request): Promise<NextResponse<FeatureFlagsResponse | ErrorResponse>> {
  const correlationId = crypto.randomUUID();

  try {
    logInfo('GET request started', { correlationId });

    const user = await requireUser();

    // TODO: Implement proper role-based access control
    // For now, any authenticated user can view flags
    // In production, check user.role === 'admin' or similar
    if (!user) {
      logInfo('Unauthorized access attempt', { correlationId });
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }

    const flags = await getFlags();

    logInfo('GET request completed', { 
      userId: user.id, 
      correlationId 
    });

    return NextResponse.json({
      flags,
      correlationId,
    });
  } catch (error) {
    logError('GET request failed', error, { correlationId });
    
    // Check for specific error types
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to get feature flags',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feature-flags
 * Update feature flag configuration
 * 
 * Request Body:
 * {
 *   enabled?: boolean,
 *   rolloutPercentage?: number,
 *   markets?: string[],
 *   userWhitelist?: string[]
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   flags: OnboardingFlags,
 *   correlationId: string
 * }
 * 
 * Error Responses:
 * - 400 Bad Request: Invalid input (rolloutPercentage out of range, no updates, invalid JSON)
 * - 401 Unauthorized: User not authenticated or not admin
 * - 500 Internal Server Error: Failed to update flags
 */
export async function POST(req: Request): Promise<NextResponse<UpdateFeatureFlagsResponse | ErrorResponse>> {
  const correlationId = crypto.randomUUID();

  try {
    logInfo('POST request started', { correlationId });

    const user = await requireUser();

    // TODO: Implement proper role-based access control
    // In production, verify user.role === 'admin'
    if (!user) {
      logInfo('Unauthorized update attempt', { correlationId });
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: UpdateFeatureFlagsRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      logError('Invalid JSON in request body', parseError, { 
        userId: user.id, 
        correlationId 
      });
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body', 
          correlationId 
        },
        { status: 400 }
      );
    }

    // Validate and build updates object
    const updates: Partial<OnboardingFlags> = {};

    if (typeof body.enabled === 'boolean') {
      updates.enabled = body.enabled;
    }

    if (typeof body.rolloutPercentage === 'number') {
      if (body.rolloutPercentage < 0 || body.rolloutPercentage > 100) {
        logInfo('Invalid rolloutPercentage', { 
          value: body.rolloutPercentage, 
          userId: user.id, 
          correlationId 
        });
        return NextResponse.json(
          {
            error: 'Invalid rolloutPercentage',
            message: 'Must be between 0 and 100',
            correlationId,
          },
          { status: 400 }
        );
      }
      updates.rolloutPercentage = body.rolloutPercentage;
    }

    if (Array.isArray(body.markets)) {
      // Validate market codes (should be 2-letter ISO codes)
      const invalidMarkets = body.markets.filter(m => !/^[A-Z]{2}$/.test(m));
      if (invalidMarkets.length > 0) {
        logInfo('Invalid market codes', { 
          invalidMarkets, 
          userId: user.id, 
          correlationId 
        });
        return NextResponse.json(
          {
            error: 'Invalid market codes',
            message: `Invalid markets: ${invalidMarkets.join(', ')}. Must be 2-letter ISO codes (e.g., FR, US)`,
            correlationId,
          },
          { status: 400 }
        );
      }
      updates.markets = body.markets;
    }

    if (Array.isArray(body.userWhitelist)) {
      // Validate user IDs (should be UUIDs)
      const invalidIds = body.userWhitelist.filter(id => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      );
      if (invalidIds.length > 0) {
        logInfo('Invalid user IDs in whitelist', { 
          invalidIds, 
          userId: user.id, 
          correlationId 
        });
        return NextResponse.json(
          {
            error: 'Invalid user IDs',
            message: `Invalid user IDs: ${invalidIds.join(', ')}. Must be valid UUIDs`,
            correlationId,
          },
          { status: 400 }
        );
      }
      updates.userWhitelist = body.userWhitelist;
    }

    if (Object.keys(updates).length === 0) {
      logInfo('No valid updates provided', { 
        body, 
        userId: user.id, 
        correlationId 
      });
      return NextResponse.json(
        {
          error: 'No valid updates provided',
          message: 'Request must include at least one of: enabled, rolloutPercentage, markets, userWhitelist',
          correlationId,
        },
        { status: 400 }
      );
    }

    // Update flags
    await updateFlags(updates);

    // Retrieve updated flags
    const newFlags = await getFlags();

    logInfo('POST request completed', {
      userId: user.id,
      updates,
      correlationId,
    });

    return NextResponse.json({
      success: true,
      flags: newFlags,
      correlationId,
    });
  } catch (error) {
    logError('POST request failed', error, { correlationId });
    
    // Check for specific error types
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update feature flags',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}
