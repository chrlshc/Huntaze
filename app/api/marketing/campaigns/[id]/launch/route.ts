import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

/**
 * POST /api/marketing/campaigns/[id]/launch
 * 
 * Launch a marketing campaign immediately or schedule it for later
 * 
 * Request Body:
 * {
 *   creatorId: string (required) - Creator ID
 *   scheduledFor?: string (optional) - ISO 8601 date string for scheduled launch
 *   notifyAudience?: boolean (optional) - Send notification to audience (default: true)
 * }
 * 
 * Response: { campaign: Campaign }
 * {
 *   id: string,
 *   status: 'active' | 'scheduled',
 *   launchedAt: string | null,
 *   scheduledFor: string | null,
 *   audienceSize: number,
 *   estimatedReach: number
 * }
 * 
 * Errors:
 * - 400: Invalid request body or parameters
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (not your campaign)
 * - 404: Campaign not found
 * - 409: Campaign already launched
 * - 429: Rate limit exceeded
 * - 500: Server error
 * 
 * @example
 * // Immediate launch
 * POST /api/marketing/campaigns/camp_123/launch
 * { "creatorId": "creator_456" }
 * 
 * // Scheduled launch
 * POST /api/marketing/campaigns/camp_123/launch
 * { "creatorId": "creator_456", "scheduledFor": "2025-12-01T10:00:00Z" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Generate correlation ID for request tracing
  const correlationId = request.headers.get('X-Correlation-ID') || 
    `mkt-launch-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  const startTime = Date.now();
  
  try {
    // 1. Await params (Next.js 15+ requirement)
    const { id: campaignId } = await params;
    
    // 2. Authentication check
    const session = await getSession(request);
    
    if (!session?.user?.id) {
      console.warn('[API] Campaign launch - Unauthorized', {
        campaignId,
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          type: 'AUTHENTICATION_ERROR',
          correlationId,
          userMessage: 'Please log in to launch campaigns.',
        },
        { 
          status: 401,
          headers: {
            'X-Correlation-ID': correlationId,
          },
        }
      );
    }

    // 3. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.warn('[API] Campaign launch - Invalid JSON', {
        campaignId,
        correlationId,
        error: parseError instanceof Error ? parseError.message : 'Unknown',
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          type: 'VALIDATION_ERROR',
          correlationId,
          userMessage: 'Invalid request format.',
        },
        { 
          status: 400,
          headers: {
            'X-Correlation-ID': correlationId,
          },
        }
      );
    }

    const { creatorId, scheduledFor, notifyAudience = true } = body;

    // 4. Validate required fields
    if (!creatorId) {
      console.warn('[API] Campaign launch - Missing creatorId', {
        campaignId,
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { 
          error: 'creatorId is required',
          type: 'VALIDATION_ERROR',
          correlationId,
          userMessage: 'Creator ID is required.',
        },
        { 
          status: 400,
          headers: {
            'X-Correlation-ID': correlationId,
          },
        }
      );
    }

    // 5. Validate scheduledFor format if provided
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      
      if (isNaN(scheduledDate.getTime())) {
        console.warn('[API] Campaign launch - Invalid scheduledFor date', {
          campaignId,
          scheduledFor,
          correlationId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { 
            error: 'scheduledFor must be a valid ISO 8601 date string',
            type: 'VALIDATION_ERROR',
            correlationId,
            userMessage: 'Invalid scheduled date format.',
          },
          { 
            status: 400,
            headers: {
              'X-Correlation-ID': correlationId,
            },
          }
        );
      }

      // Check if scheduled date is in the future
      if (scheduledDate.getTime() <= Date.now()) {
        console.warn('[API] Campaign launch - scheduledFor in the past', {
          campaignId,
          scheduledFor,
          correlationId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { 
            error: 'scheduledFor must be in the future',
            type: 'VALIDATION_ERROR',
            correlationId,
            userMessage: 'Scheduled date must be in the future.',
          },
          { 
            status: 400,
            headers: {
              'X-Correlation-ID': correlationId,
            },
          }
        );
      }

      // Check if scheduled date is not too far in the future (e.g., max 90 days)
      const maxFutureDate = new Date();
      maxFutureDate.setDate(maxFutureDate.getDate() + 90);
      
      if (scheduledDate.getTime() > maxFutureDate.getTime()) {
        console.warn('[API] Campaign launch - scheduledFor too far in future', {
          campaignId,
          scheduledFor,
          maxDate: maxFutureDate.toISOString(),
          correlationId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { 
            error: 'scheduledFor cannot be more than 90 days in the future',
            type: 'VALIDATION_ERROR',
            correlationId,
            userMessage: 'Scheduled date cannot be more than 90 days in the future.',
          },
          { 
            status: 400,
            headers: {
              'X-Correlation-ID': correlationId,
            },
          }
        );
      }
    }

    // 6. Authorization check
    if (session.user.id !== creatorId) {
      console.warn('[API] Campaign launch - Forbidden', {
        userId: session.user.id,
        requestedCreatorId: creatorId,
        campaignId,
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { 
          error: 'Forbidden',
          type: 'PERMISSION_ERROR',
          correlationId,
          userMessage: 'You do not have permission to launch this campaign.',
        },
        { 
          status: 403,
          headers: {
            'X-Correlation-ID': correlationId,
          },
        }
      );
    }

    // 7. Logging
    console.log('[API] Campaign launch request:', {
      creatorId,
      campaignId,
      scheduledFor: scheduledFor || 'immediate',
      notifyAudience,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // 8. Backend service call with retry logic
    // TODO: Replace with actual backend service call
    // const campaign = await backendMarketingService.launchCampaign(
    //   creatorId, 
    //   campaignId, 
    //   { scheduledFor, notifyAudience }
    // );
    
    // Mock response with realistic data
    const isScheduled = !!scheduledFor;
    const campaign = {
      id: campaignId,
      status: isScheduled ? 'scheduled' as const : 'active' as const,
      launchedAt: isScheduled ? null : new Date().toISOString(),
      scheduledFor: scheduledFor || null,
      audienceSize: 234, // Mock audience size
      estimatedReach: 210, // Mock estimated reach (90% of audience)
      notifyAudience,
      createdBy: creatorId,
      updatedAt: new Date().toISOString(),
    };

    // 9. Success logging
    const duration = Date.now() - startTime;
    console.log('[API] Campaign launch success:', {
      creatorId,
      campaignId,
      status: campaign.status,
      audienceSize: campaign.audienceSize,
      isScheduled,
      duration,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // 10. Return response with appropriate headers
    return NextResponse.json(
      { 
        campaign,
        message: isScheduled 
          ? `Campaign scheduled for ${scheduledFor}` 
          : 'Campaign launched successfully',
      },
      { 
        status: 200,
        headers: {
          'X-Correlation-ID': correlationId,
          'X-Response-Time': `${duration}ms`,
          'Cache-Control': 'no-store', // Don't cache launch responses
        },
      }
    );
  } catch (error) {
    // 11. Error handling with detailed logging
    const duration = Date.now() - startTime;
    
    console.error('[API] Campaign launch error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
      duration,
      timestamp: new Date().toISOString(),
    });
    
    // Check for specific error types
    let statusCode = 500;
    let errorType = 'API_ERROR';
    let userMessage = 'Failed to launch campaign. Please try again.';
    
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        statusCode = 404;
        errorType = 'NOT_FOUND_ERROR';
        userMessage = 'Campaign not found.';
      } else if (error.message.includes('already launched')) {
        statusCode = 409;
        errorType = 'CONFLICT_ERROR';
        userMessage = 'Campaign has already been launched.';
      } else if (error.message.includes('rate limit')) {
        statusCode = 429;
        errorType = 'RATE_LIMIT_ERROR';
        userMessage = 'Too many requests. Please try again later.';
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        type: errorType,
        correlationId,
        userMessage,
        retryable: statusCode >= 500, // Server errors are retryable
      },
      { 
        status: statusCode,
        headers: {
          'X-Correlation-ID': correlationId,
          'X-Response-Time': `${duration}ms`,
          ...(statusCode === 429 && { 'Retry-After': '60' }), // Retry after 60 seconds for rate limits
        },
      }
    );
  }
}
