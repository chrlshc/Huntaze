/**
 * Admin API for managing feature flags
 * POST /api/admin/feature-flags - Update feature flags
 * GET /api/admin/feature-flags - Get current feature flags
 * 
 * Protected with:
 * - withAuth (admin required)
 * - withCsrf (POST only)
 * - withRateLimit
 * 
 * Requirements: 1.5, 3.1, 4.1, 5.1
 * 
 * @see docs/api/admin-feature-flags.md for full documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFlags, updateFlags, type OnboardingFlags } from '@/lib/feature-flags';
import { withAuth } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { composeMiddleware } from '@/lib/middleware/types';
import type { RouteHandler } from '@/lib/middleware/types';

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
const getHandler: RouteHandler = async (req: NextRequest): Promise<NextResponse<FeatureFlagsResponse | ErrorResponse>> => {
  const correlationId = crypto.randomUUID();

  try {
    logInfo('GET request started', { correlationId });

    const flags = await getFlags();

    logInfo('GET request completed', { 
      correlationId 
    });

    return NextResponse.json({
      flags,
      correlationId,
    });
  } catch (error) {
    logError('GET request failed', error, { correlationId });

    return NextResponse.json(
      {
        error: 'Failed to get feature flags',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
};

// Apply middlewares: auth (admin required) + rate limiting
export const GET = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 60, windowMs: 60000 }),
  (handler) => withAuth(handler, { requireAdmin: true }),
])(getHandler);

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
 * - 403 Forbidden: Invalid CSRF token
 * - 500 Internal Server Error: Failed to update flags
 */
const postHandler: RouteHandler = async (req: NextRequest): Promise<NextResponse<UpdateFeatureFlagsResponse | ErrorResponse>> => {
  const correlationId = crypto.randomUUID();

  try {
    logInfo('POST request started', { correlationId });

    // Parse and validate request body
    let body: UpdateFeatureFlagsRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      logError('Invalid JSON in request body', parseError, { 
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

    return NextResponse.json(
      {
        error: 'Failed to update feature flags',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
};

// Apply middlewares: auth (admin required) + CSRF + rate limiting
export const POST = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 20, windowMs: 60000 }),
  withCsrf,
  (handler) => withAuth(handler, { requireAdmin: true }),
])(postHandler);
