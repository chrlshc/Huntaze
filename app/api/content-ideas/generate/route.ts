/**
 * Content Ideas Generation API Endpoint
 * Secure endpoint with authentication, rate limiting, validation, monitoring, and comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getContentIdeaGeneratorService, 
  type CreatorProfile 
} from '@/lib/services/content-idea-generator';
import { withAuthAndRateLimit } from '@/lib/middleware/api-auth';
import { 
  withCompleteValidation, 
  CommonSchemas,
  CustomValidators,
  type ValidatedRequest,
  getValidatedData 
} from '@/lib/middleware/api-validation';
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';
import { 
  ValidationError, 
  formatErrorForLogging,
  shouldLogError 
} from '@/lib/types/api-errors';

// Request validation schema
const GenerateIdeasRequestSchema = z.object({
  creatorProfile: z.object({
    id: z.string(),
    niche: z.array(z.string()).min(1),
    contentTypes: z.array(z.string()).min(1),
    audiencePreferences: z.array(z.string()).default([]),
    performanceHistory: z.object({
      topPerformingContent: z.array(z.string()).default([]),
      engagementPatterns: z.record(z.string(), z.number()).default({}),
      revenueByCategory: z.record(z.string(), z.number()).default({}),
    }).default(() => ({
      topPerformingContent: [],
      engagementPatterns: {},
      revenueByCategory: {},
    })),
    currentGoals: z.array(z.object({
      type: z.enum(['growth', 'revenue', 'engagement', 'retention']),
      target: z.number(),
      timeframe: z.string(),
    })).default([]),
    constraints: z.object({
      equipment: z.array(z.string()).default([]),
      location: z.array(z.string()).default([]),
      timeAvailability: z.string().default(''),
    }).default(() => ({
      equipment: [],
      location: [],
      timeAvailability: '',
    })),
  }),
  options: z.object({
    count: z.number().min(1).max(50).default(10),
    category: z.enum(['photo', 'video', 'story', 'ppv', 'live']).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    focusArea: z.enum(['trending', 'evergreen', 'seasonal', 'monetization']).default('trending'),
    timeframe: z.enum(['week', 'month', 'quarter']).default('month'),
    includeAnalysis: z.boolean().default(true),
  }).default(() => ({
    count: 10,
    focusArea: 'trending' as const,
    timeframe: 'month' as const,
    includeAnalysis: true,
  })),
});

type GenerateIdeasRequest = z.infer<typeof GenerateIdeasRequestSchema>;

// Optimized POST handler with comprehensive middleware
const postHandler = withCompleteValidation({
  body: GenerateIdeasRequestSchema,
  customValidator: async (data) => {
    // Validation métier personnalisée
    await CustomValidators.validateBusinessRules(data);
  },
  enableSanitization: true,
  enableMonitoring: true,
})(async (request: ValidatedRequest) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const monitoring = getAPIMonitoringService();
  
  try {
    console.log(`[API] Content ideas generation started`, { requestId });

    // Authenticate and check rate limits
    const authContext = await withAuthAndRateLimit(
      request,
      'content:generate',
      'contentGeneration'
    );

    console.log(`[API] Authentication successful`, { 
      requestId, 
      userId: authContext.userId,
      role: authContext.role 
    });

    // Get validated data
    const { body: validatedRequest } = getValidatedData<{ body: GenerateIdeasRequest }>(request);

    // Ensure creator profile ID matches authenticated user (unless admin)
    if (authContext.role !== 'admin' && 
        validatedRequest.creatorProfile.id !== authContext.userId) {
      throw new ValidationError('Creator profile ID must match authenticated user', {
        providedId: validatedRequest.creatorProfile.id,
        authenticatedUserId: authContext.userId,
      });
    }

    // Generate content ideas
    const service = getContentIdeaGeneratorService();
    const result = await service.generateContentIdeas(
      validatedRequest.creatorProfile,
      validatedRequest.options
    );

    const duration = Date.now() - startTime;

    // Record metrics
    monitoring.recordMetric({
      endpoint: '/api/content-ideas/generate',
      method: 'POST',
      statusCode: 200,
      responseTime: duration,
      userId: authContext.userId,
      tokensUsed: result.metadata.tokensUsed,
      cacheHit: result.metadata.cacheHit,
    });

    console.log(`[API] Content ideas generated successfully`, {
      requestId,
      userId: authContext.userId,
      ideasCount: result.ideas.length,
      tokensUsed: result.metadata.tokensUsed,
      cacheHit: result.metadata.cacheHit,
      duration,
    });

    // Return successful response with enhanced metadata
    const response = NextResponse.json({
      success: true,
      data: result,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        duration,
        version: '1.0',
        performance: {
          tokensUsed: result.metadata.tokensUsed,
          cacheHit: result.metadata.cacheHit,
          processingTime: duration,
        },
      },
    }, { status: 200 });

    // Add performance headers
    response.headers.set('X-Response-Time', duration.toString());
    response.headers.set('X-Cache-Status', result.metadata.cacheHit ? 'HIT' : 'MISS');
    if (result.metadata.tokensUsed) {
      response.headers.set('X-Tokens-Used', result.metadata.tokensUsed.toString());
    }

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Record error metrics
    const statusCode = error instanceof ValidationError ? 400 : 
                      (error as any).name === 'AuthenticationError' ? 401 :
                      (error as any).name === 'AuthorizationError' ? 403 :
                      (error as any).message?.includes('Rate limit') ? 429 : 500;

    monitoring.recordMetric({
      endpoint: '/api/content-ideas/generate',
      method: 'POST',
      statusCode,
      responseTime: duration,
      errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
    });

    // Handle different error types with enhanced context
    if (error instanceof ValidationError) {
      console.warn(`[API] Validation error`, {
        requestId,
        error: error.message,
        context: error.context,
        duration,
      });

      return NextResponse.json({
        success: false,
        error: {
          type: 'validation_error',
          message: error.message,
          details: error.context,
          code: 'VALIDATION_FAILED',
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          duration,
        },
      }, { status: 400 });
    }

    // Handle authentication/authorization errors
    if (error instanceof Error && 
        (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      console.warn(`[API] Auth error`, {
        requestId,
        error: error.message,
        duration,
      });

      const status = error.name === 'AuthenticationError' ? 401 : 403;
      
      return NextResponse.json({
        success: false,
        error: {
          type: error.name.toLowerCase(),
          message: error.message,
          code: error.name.toUpperCase(),
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          duration,
        },
      }, { status });
    }

    // Handle rate limit errors with enhanced headers
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      console.warn(`[API] Rate limit exceeded`, {
        requestId,
        error: error.message,
        duration,
      });

      const retryAfter = 3600; // 1 hour
      const resetTime = Math.ceil((Date.now() + retryAfter * 1000) / 1000);

      return NextResponse.json({
        success: false,
        error: {
          type: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          duration,
        },
      }, { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'X-RateLimit-Reset-Time': new Date(resetTime * 1000).toISOString(),
        },
      });
    }

    // Handle all other errors
    const apiError = error as any;
    
    if (shouldLogError(apiError)) {
      console.error(`[API] Content ideas generation failed`, {
        requestId,
        ...formatErrorForLogging(apiError),
        duration,
      });
    }

    return NextResponse.json({
      success: false,
      error: {
        type: 'internal_error',
        message: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        duration,
      },
    }, { status: 500 });
  }
});

export async function POST(request: NextRequest) {
  return postHandler(request);
}

// Health check endpoint
export async function GET() {
  try {
    const service = getContentIdeaGeneratorService();
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'content-idea-generator',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        type: 'service_unavailable',
        message: 'Content idea generator service is not available',
      },
    }, { status: 503 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}