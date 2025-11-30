import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { requireStep } from '@/lib/middleware/onboarding-gating';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * TypeScript types for API responses
 */
export interface StorePublishSuccessResponse {
  success: true;
  message: string;
  storeUrl: string;
  publishedAt: string;
  correlationId: string;
}

export interface StorePublishErrorResponse {
  error: string;
  details?: string;
  correlationId: string;
}

/**
 * Request body validation schema
 */
const PublishRequestSchema = z.object({
  confirmPublish: z.boolean().optional(),
  notifyCustomers: z.boolean().optional(),
}).strict();

type PublishRequest = z.infer<typeof PublishRequestSchema>;

/**
 * Structured logging helper
 */
function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[Store Publish] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

function logInfo(context: string, metadata?: Record<string, any>) {
  console.log(`[Store Publish] ${context}`, metadata);
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      logInfo(`Retry attempt ${attempt}/${maxAttempts}`, {
        delay,
        error: lastError.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * POST /api/store/publish
 * 
 * Publishes the user's store to make it live.
 * Requires payment configuration to be completed.
 * 
 * This is a CRITICAL route - fails closed on errors.
 * 
 * Request Body (optional):
 * {
 *   confirmPublish?: boolean,
 *   notifyCustomers?: boolean
 * }
 * 
 * Response (200):
 * {
 *   success: true,
 *   message: string,
 *   storeUrl: string,
 *   publishedAt: string,
 *   correlationId: string
 * }
 * 
 * Response (409 - Gating):
 * {
 *   error: 'PRECONDITION_REQUIRED',
 *   message: string,
 *   missingStep: string,
 *   action: { type, modal, prefill },
 *   correlationId: string
 * }
 * 
 * Response (400 - Validation):
 * {
 *   error: 'Invalid request body',
 *   details: string,
 *   correlationId: string
 * }
 * 
 * Response (401 - Unauthorized):
 * {
 *   error: 'Unauthorized',
 *   correlationId: string
 * }
 * 
 * Response (500 - Server Error):
 * {
 *   error: 'Failed to publish store',
 *   details: string,
 *   correlationId: string
 * }
 */
export async function POST(req: Request): Promise<NextResponse<StorePublishSuccessResponse | StorePublishErrorResponse>> {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    // Authenticate user
    const user = await requireUser();
    
    logInfo('Publish request started', {
      userId: user.id,
      correlationId
    });
    
    // Parse and validate request body
    let body: PublishRequest = {};
    
    try {
      const contentType = req.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const rawBody = await req.json();
        const validation = PublishRequestSchema.safeParse(rawBody);
        
        if (!validation.success) {
          logInfo('Invalid request body', {
            userId: user.id,
            errors: validation.error.issues,
            correlationId
          });
          
          return NextResponse.json(
            {
              error: 'Invalid request body',
              details: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
              correlationId
            },
            { status: 400 }
          );
        }
        
        body = validation.data;
      }
    } catch (parseError) {
      logError('Failed to parse request body', parseError, {
        userId: user.id,
        correlationId
      });
      
      return NextResponse.json(
        { error: 'Invalid JSON in request body', correlationId },
        { status: 400 }
      );
    }
    
    // Check gating: user must have completed payments setup
    const gatingCheck = await requireStep({
      requiredStep: 'payments',
      message: 'Vous devez configurer les paiements avant de publier votre boutique',
      isCritical: true, // Fail closed - this is a critical financial operation
      action: {
        type: 'open_modal',
        modal: 'payments_setup',
        prefill: {
          returnUrl: '/api/store/publish',
          userId: user.id
        }
      }
    });
    
    if (gatingCheck) {
      // User hasn't completed payments - return 409 with guidance
      logInfo('Gating check blocked', {
        userId: user.id,
        requiredStep: 'payments',
        correlationId
      });
      return gatingCheck as any;
    }
    
    // User has completed payments - proceed with publishing
    logInfo('Publishing store', {
      userId: user.id,
      confirmPublish: body.confirmPublish,
      notifyCustomers: body.notifyCustomers,
      correlationId
    });
    
    // Publish store with retry logic for transient failures
    const publishResult = await retryWithBackoff(
      async () => {
        // TODO: Implement actual store publishing logic
        // - Validate store configuration (products, theme, domain)
        // - Enable public access
        // - Update store status in database
        // - Generate store URL
        
        // Mock implementation
        return {
          storeUrl: `https://${user.id}.huntaze.com`,
          publishedAt: new Date().toISOString()
        };
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000
      }
    );
    
    // Send confirmation email (non-blocking)
    if (body.notifyCustomers === true) {
      // Fire and forget - don't block response
      Promise.resolve().then(async () => {
        try {
          // TODO: Send email notification
          logInfo('Sending confirmation email', {
            userId: user.id,
            correlationId
          });
        } catch (emailError) {
          logError('Failed to send confirmation email', emailError, {
            userId: user.id,
            correlationId
          });
        }
      });
    }
    
    // Track analytics event (non-blocking)
    Promise.resolve().then(async () => {
      try {
        // TODO: Track store.published event
        logInfo('Tracking analytics event', {
          userId: user.id,
          event: 'store.published',
          correlationId
        });
      } catch (analyticsError) {
        logError('Failed to track analytics', analyticsError, {
          userId: user.id,
          correlationId
        });
      }
    });
    
    const duration = Date.now() - startTime;
    
    logInfo('Store published successfully', {
      userId: user.id,
      storeUrl: publishResult.storeUrl,
      duration,
      correlationId
    });
    
    const response: StorePublishSuccessResponse = {
      success: true,
      message: 'Boutique publiée avec succès',
      storeUrl: publishResult.storeUrl,
      publishedAt: publishResult.publishedAt,
      correlationId
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Correlation-Id': correlationId
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError('Failed to publish store', error, {
      duration,
      correlationId
    });
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized', correlationId },
          { status: 401 }
        );
      }
      
      if (error.message.includes('Store not found')) {
        return NextResponse.json(
          { error: 'Store not found', correlationId },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Store already published')) {
        return NextResponse.json(
          { error: 'Store already published', correlationId },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      {
        error: 'Failed to publish store',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      },
      { status: 500 }
    );
  }
}
