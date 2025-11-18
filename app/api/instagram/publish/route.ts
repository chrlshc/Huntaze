/**
 * Instagram Publish API
 * 
 * POST /api/instagram/publish
 * 
 * Publishes photos, videos, or carousels to Instagram Business account.
 * Handles media upload, container creation, status polling, and publishing.
 * 
 * @authentication Required - Uses NextAuth session
 * @rateLimit 10 requests per minute per user
 * 
 * @requestBody
 * {
 *   mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL',
 *   mediaUrl?: string (required for IMAGE/VIDEO),
 *   caption?: string (max 2200 chars),
 *   locationId?: string,
 *   coverUrl?: string (for VIDEO),
 *   children?: Array<{ mediaType, mediaUrl }> (required for CAROUSEL)
 * }
 * 
 * @responseBody
 * Success: {
 *   success: true,
 *   data: {
 *     postId: string,
 *     platform: 'instagram',
 *     type: string,
 *     url: string,
 *     permalink: string,
 *     timestamp: string,
 *     caption: string,
 *     status: 'published',
 *     metadata: object
 *   },
 *   correlationId: string
 * }
 * 
 * Error: {
 *   success: false,
 *   error: {
 *     code: string,
 *     message: string,
 *     statusCode: number,
 *     retryable: boolean
 *   },
 *   correlationId: string
 * }
 * 
 * @example
 * POST /api/instagram/publish
 * {
 *   "mediaType": "IMAGE",
 *   "mediaUrl": "https://example.com/image.jpg",
 *   "caption": "Check out this amazing photo! #instagram"
 * }
 * 
 * @see docs/api/instagram-publish.md
 * @see lib/services/instagramPublish.ts
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { withAuth } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/utils/response';
import { createApiError, ErrorCodes, isRetryableError } from '@/lib/api/utils/errors';
import { createLogger } from '@/lib/utils/logger';
import { instagramPublish } from '@/lib/services/instagramPublish';
import { tokenManager } from '@/lib/services/tokenManager';
import { instagramOAuth } from '@/lib/services/instagramOAuth';

const logger = createLogger('instagram-publish');

// ============================================================================
// Types
// ============================================================================

/**
 * Media type for Instagram posts
 */
type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL';

/**
 * Child media item for carousel posts
 */
interface CarouselChild {
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
}

/**
 * Publish request data
 */
interface PublishRequest {
  mediaType: MediaType;
  mediaUrl?: string;
  caption?: string;
  locationId?: string;
  coverUrl?: string;
  children?: CarouselChild[];
}

/**
 * Published media response
 */
interface PublishResponse {
  postId: string;
  platform: 'instagram';
  type: string;
  url: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  status: 'published';
  metadata: {
    userId: string;
    accountId: string;
    igBusinessId: string;
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validation schema for publish request
 */
const publishSchema = z.object({
  mediaType: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL'], {
    errorMap: () => ({ message: 'mediaType must be IMAGE, VIDEO, or CAROUSEL' }),
  }),
  mediaUrl: z.string().url('Invalid media URL').optional(),
  caption: z.string()
    .max(2200, 'Caption must be 2200 characters or less')
    .optional(),
  locationId: z.string().optional(),
  coverUrl: z.string().url('Invalid cover URL').optional(),
  children: z.array(z.object({
    mediaType: z.enum(['IMAGE', 'VIDEO']),
    mediaUrl: z.string().url('Invalid child media URL'),
  }))
    .min(2, 'Carousel must have at least 2 items')
    .max(10, 'Carousel can have at most 10 items')
    .optional(),
}).refine((data) => {
  if (data.mediaType === 'CAROUSEL') {
    return data.children && data.children.length >= 2;
  }
  return !!data.mediaUrl;
}, {
  message: 'mediaUrl is required for IMAGE/VIDEO, children (2-10 items) required for CAROUSEL',
  path: ['mediaUrl'],
});

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'rate_limit',
    'timed out',
    'temporarily unavailable',
  ],
};

/**
 * Check if error is retryable
 */
function isInstagramRetryableError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  return RETRY_CONFIG.retryableErrors.some(code => 
    errorMessage.includes(code.toLowerCase())
  );
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = isInstagramRetryableError(error);

    if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn('Instagram publish retry', {
      correlationId,
      attempt,
      delay,
      error: error.message,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Map Instagram errors to API errors
 */
function mapInstagramError(error: any, correlationId: string): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorLower = errorMessage.toLowerCase();

  logger.error('Instagram publish error', error, { correlationId });

  // Validation errors
  if (errorLower.includes('invalid_media') || errorLower.includes('invalid media')) {
    throw createApiError(
      ErrorCodes.VALIDATION_ERROR,
      'Invalid media URL or format. Please check the media file.',
      400,
      true, // retryable after fixing
      correlationId
    );
  }

  // Permission errors
  if (errorLower.includes('permission_denied') || errorLower.includes('insufficient permissions')) {
    throw createApiError(
      ErrorCodes.FORBIDDEN,
      'Permission denied. Please reconnect your Instagram account.',
      403,
      false,
      correlationId
    );
  }

  // Rate limit errors
  if (errorLower.includes('rate_limit') || errorLower.includes('too many requests')) {
    throw createApiError(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Instagram rate limit exceeded. Please try again in a few minutes.',
      429,
      true,
      correlationId
    );
  }

  // Container/processing errors
  if (errorLower.includes('container error') || errorLower.includes('processing failed')) {
    throw createApiError(
      ErrorCodes.VALIDATION_ERROR,
      `Media processing failed: ${errorMessage}`,
      400,
      true,
      correlationId
    );
  }

  // Timeout errors
  if (errorLower.includes('timed out') || errorLower.includes('timeout')) {
    throw createApiError(
      ErrorCodes.TIMEOUT_ERROR,
      'Media processing timed out. Please try again with a smaller file.',
      408,
      true,
      correlationId
    );
  }

  // Token/auth errors
  if (errorLower.includes('invalid token') || errorLower.includes('expired token')) {
    throw createApiError(
      ErrorCodes.UNAUTHORIZED,
      'Instagram access token is invalid or expired. Please reconnect your account.',
      401,
      false,
      correlationId
    );
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('connection')) {
    throw createApiError(
      ErrorCodes.NETWORK_ERROR,
      'Network error connecting to Instagram. Please try again.',
      503,
      true,
      correlationId
    );
  }

  // Generic error
  throw createApiError(
    ErrorCodes.INTERNAL_ERROR,
    'Failed to publish to Instagram. Please try again.',
    500,
    true,
    correlationId
  );
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Publish content to Instagram with retry logic
 */
async function publishToInstagram(request: NextRequest, userId: number): Promise<NextResponse> {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  try {
    // 1. Parse and validate request body
    logger.info('Instagram publish started', {
      correlationId,
      userId,
      url: request.url,
    });

    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      throw createApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid JSON in request body',
        400,
        false,
        correlationId
      );
    }

    let validatedData: PublishRequest;
    try {
      validatedData = publishSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessage = validationError.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        
        throw createApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Validation failed: ${errorMessage}`,
          400,
          false,
          correlationId
        );
      }
      throw validationError;
    }

    logger.info('Request validated', {
      correlationId,
      userId,
      mediaType: validatedData.mediaType,
      hasCaption: !!validatedData.caption,
      hasLocation: !!validatedData.locationId,
      childrenCount: validatedData.children?.length,
    });

    // 2. Get Instagram account with retry
    const account = await retryWithBackoff(
      async () => {
        const acc = await tokenManager.getAccount({
          userId,
          provider: 'instagram',
        });

        if (!acc) {
          throw createApiError(
            ErrorCodes.NOT_FOUND,
            'Instagram account not connected. Please connect your account first.',
            404,
            false,
            correlationId
          );
        }

        return acc;
      },
      correlationId
    );

    // 3. Validate Instagram Business ID
    const igBusinessId = account.metadata?.ig_business_id;
    if (!igBusinessId) {
      throw createApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Instagram Business ID not found. Please reconnect your Instagram Business account.',
        400,
        false,
        correlationId
      );
    }

    logger.info('Instagram account retrieved', {
      correlationId,
      userId,
      accountId: account.id,
      igBusinessId,
    });

    // 4. Get valid access token with auto-refresh
    const accessToken = await retryWithBackoff(
      async () => {
        const token = await tokenManager.getValidToken({
          userId,
          provider: 'instagram',
          refreshCallback: async (oldToken) => {
            logger.info('Refreshing Instagram token', {
              correlationId,
              userId,
            });

            const refreshed = await instagramOAuth.refreshLongLivedToken(oldToken);
            
            return {
              accessToken: refreshed.access_token,
              expiresIn: refreshed.expires_in,
            };
          },
        });

        if (!token) {
          throw createApiError(
            ErrorCodes.UNAUTHORIZED,
            'Failed to get valid access token. Please reconnect your Instagram account.',
            401,
            false,
            correlationId
          );
        }

        return token;
      },
      correlationId
    );

    logger.info('Access token retrieved', {
      correlationId,
      userId,
    });

    // 5. Publish media with retry logic
    let published: { id: string };

    if (validatedData.mediaType === 'CAROUSEL') {
      logger.info('Publishing carousel', {
        correlationId,
        userId,
        itemCount: validatedData.children!.length,
      });

      published = await retryWithBackoff(
        async () => {
          return await instagramPublish.publishCarousel({
            igUserId: igBusinessId,
            accessToken,
            children: validatedData.children!,
            caption: validatedData.caption,
            locationId: validatedData.locationId,
          });
        },
        correlationId
      );
    } else {
      logger.info('Publishing single media', {
        correlationId,
        userId,
        mediaType: validatedData.mediaType,
      });

      published = await retryWithBackoff(
        async () => {
          return await instagramPublish.publishMedia({
            igUserId: igBusinessId,
            accessToken,
            mediaType: validatedData.mediaType,
            mediaUrl: validatedData.mediaUrl!,
            caption: validatedData.caption,
            locationId: validatedData.locationId,
            coverUrl: validatedData.coverUrl,
          });
        },
        correlationId
      );
    }

    logger.info('Media published to Instagram', {
      correlationId,
      userId,
      postId: published.id,
    });

    // 6. Get published media details with retry
    const mediaDetails = await retryWithBackoff(
      async () => {
        return await instagramPublish.getMediaDetails(
          published.id,
          accessToken
        );
      },
      correlationId
    );

    // 7. Build response data
    const publishData: PublishResponse = {
      postId: published.id,
      platform: 'instagram',
      type: mediaDetails.media_type,
      url: mediaDetails.media_url,
      permalink: mediaDetails.permalink,
      timestamp: mediaDetails.timestamp,
      caption: mediaDetails.caption,
      status: 'published',
      metadata: {
        userId: userId.toString(),
        accountId: account.id,
        igBusinessId,
      },
    };

    const duration = Date.now() - startTime;

    logger.info('Instagram publish completed successfully', {
      correlationId,
      userId,
      postId: published.id,
      type: validatedData.mediaType,
      duration,
    });

    // 8. Return success response
    return NextResponse.json(
      createSuccessResponse(publishData, correlationId),
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': duration.toString(),
        },
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle API errors (already formatted)
    if (error.code && error.statusCode) {
      logger.error('Instagram publish failed', error, {
        correlationId,
        userId,
        duration,
      });

      return NextResponse.json(
        createErrorResponse(
          error.code,
          error.message,
          error.statusCode,
          error.retryable,
          correlationId
        ),
        {
          status: error.statusCode,
          headers: {
            'X-Correlation-Id': correlationId,
            ...(error.retryable && { 'Retry-After': '60' }),
          },
        }
      );
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');

      logger.warn('Instagram publish validation error', {
        correlationId,
        userId,
        errors: error.errors,
        duration,
      });

      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          `Validation failed: ${errorMessage}`,
          400,
          false,
          correlationId
        ),
        {
          status: 400,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    // Map Instagram-specific errors
    try {
      mapInstagramError(error, correlationId);
    } catch (mappedError: any) {
      return NextResponse.json(
        createErrorResponse(
          mappedError.code,
          mappedError.message,
          mappedError.statusCode,
          mappedError.retryable,
          correlationId
        ),
        {
          status: mappedError.statusCode,
          headers: {
            'X-Correlation-Id': correlationId,
            ...(mappedError.retryable && { 'Retry-After': '60' }),
          },
        }
      );
    }

    // Fallback for unexpected errors
    logger.error('Instagram publish unexpected error', error, {
      correlationId,
      userId,
      duration,
    });

    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.',
        500,
        true,
        correlationId
      ),
      {
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
          'Retry-After': '60',
        },
      }
    );
  }
}

// ============================================================================
// Export with Middleware
// ============================================================================

/**
 * POST /api/instagram/publish
 * 
 * Apply middleware chain:
 * 1. Rate limiting (10 req/min per user)
 * 2. Authentication (NextAuth session)
 * 3. Main handler with retry logic
 */
export const POST = withRateLimit(
  withAuth(publishToInstagram),
  {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  }
);
