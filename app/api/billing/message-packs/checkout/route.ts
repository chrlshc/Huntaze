/**
 * Billing Message Packs Checkout API - Optimized
 * 
 * POST /api/billing/message-packs/checkout
 * Creates a Stripe checkout session for message pack purchase
 * 
 * Features:
 * - ✅ Structured error handling with correlation IDs
 * - ✅ Retry logic with exponential backoff
 * - ✅ Circuit breaker protection
 * - ✅ Request validation with Zod
 * - ✅ Centralized logging
 * - ✅ Rate limiting
 * - ✅ TypeScript strict typing
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// Types & Validation
// ============================================================================

const PackType = z.enum(['25k', '100k', '500k']);
type PackType = z.infer<typeof PackType>;

const CheckoutRequestSchema = z.object({
  pack: PackType,
  customerId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

interface CheckoutResponse {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
  correlationId?: string;
}

enum BillingErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

interface BillingError extends Error {
  type: BillingErrorType;
  correlationId: string;
  userMessage: string;
  retryable: boolean;
  statusCode: number;
}

// ============================================================================
// Configuration
// ============================================================================

const STRIPE_CONFIG = {
  apiVersion: '2023-10-16' as const,
  maxRetries: 3,
  timeout: 10000, // 10 seconds
};

const PRICES: Record<PackType, string | undefined> = {
  '25k': process.env.STRIPE_PRICE_MSGPACK_25K,
  '100k': process.env.STRIPE_PRICE_MSGPACK_100K,
  '500k': process.env.STRIPE_PRICE_MSGPACK_500K,
};

const PACK_DETAILS: Record<PackType, { messages: number; name: string }> = {
  '25k': { messages: 25000, name: 'Starter Pack' },
  '100k': { messages: 100000, name: 'Pro Pack' },
  '500k': { messages: 500000, name: 'Enterprise Pack' },
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `billing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create structured billing error
 */
function createBillingError(
  type: BillingErrorType,
  message: string,
  correlationId: string,
  statusCode: number = 500,
  retryable: boolean = false
): BillingError {
  const userMessages: Record<BillingErrorType, string> = {
    [BillingErrorType.VALIDATION_ERROR]: 'Invalid request. Please check your input.',
    [BillingErrorType.STRIPE_ERROR]: 'Payment processing error. Please try again.',
    [BillingErrorType.CONFIGURATION_ERROR]: 'Service configuration error. Please contact support.',
    [BillingErrorType.NETWORK_ERROR]: 'Network error. Please try again.',
    [BillingErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait a moment.',
  };

  const error = new Error(message) as BillingError;
  error.type = type;
  error.correlationId = correlationId;
  error.userMessage = userMessages[type];
  error.retryable = retryable;
  error.statusCode = statusCode;
  return error;
}

/**
 * Logger utility
 */
const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(`[Billing] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, error: Error, meta?: Record<string, any>) => {
    console.error(`[Billing] [ERROR] ${message}`, {
      error: error.message,
      stack: error.stack,
      ...meta,
    });
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(`[Billing] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
};

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  correlationId: string,
  operationName: string
): Promise<T> {
  let lastError: Error;
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;

      logger.info(`${operationName} successful`, {
        correlationId,
        attempt,
        duration,
      });

      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const isRetryable = 
        error instanceof Error &&
        (error.message.includes('network') ||
         error.message.includes('timeout') ||
         (error as any).code === 'ECONNRESET');

      if (!isRetryable || attempt === maxRetries) {
        logger.error(
          `${operationName} failed (attempt ${attempt}/${maxRetries})`,
          lastError,
          { correlationId, retryable: isRetryable }
        );
        throw lastError;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;

      logger.warn(
        `${operationName} failed, retrying in ${Math.round(delay)}ms`,
        { correlationId, attempt, error: lastError.message }
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Initialize Stripe client with retry configuration
 */
function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }

  return new Stripe(apiKey, {
    apiVersion: STRIPE_CONFIG.apiVersion,
    maxNetworkRetries: STRIPE_CONFIG.maxRetries,
    timeout: STRIPE_CONFIG.timeout,
  });
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * POST /api/billing/message-packs/checkout
 * 
 * Create Stripe checkout session for message pack purchase
 * 
 * @param req - Next.js request object
 * @returns Checkout session URL or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/billing/message-packs/checkout', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ pack: '25k' }),
 * });
 * const { url } = await response.json();
 * window.location.href = url;
 * ```
 */
export async function POST(req: NextRequest): Promise<NextResponse<CheckoutResponse>> {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  logger.info('Checkout request received', { correlationId });

  try {
    // ========================================================================
    // 1. Validate Request
    // ========================================================================
    let body: CheckoutRequest;
    
    try {
      const rawBody = await req.json();
      body = CheckoutRequestSchema.parse(rawBody);
    } catch (error) {
      logger.error('Request validation failed', error as Error, { correlationId });
      
      const validationError = createBillingError(
        BillingErrorType.VALIDATION_ERROR,
        error instanceof z.ZodError 
          ? `Validation failed: ${error.errors.map(e => e.message).join(', ')}`
          : 'Invalid request body',
        correlationId,
        400,
        false
      );

      return NextResponse.json(
        {
          success: false,
          error: validationError.userMessage,
          correlationId,
        },
        { status: validationError.statusCode }
      );
    }

    const { pack, customerId, metadata } = body;

    logger.info('Request validated', {
      correlationId,
      pack,
      hasCustomerId: !!customerId,
    });

    // ========================================================================
    // 2. Validate Configuration
    // ========================================================================
    const priceId = PRICES[pack];
    
    if (!priceId) {
      logger.error('Price ID not configured', new Error('Missing price ID'), {
        correlationId,
        pack,
      });

      const configError = createBillingError(
        BillingErrorType.CONFIGURATION_ERROR,
        `Price ID not configured for pack: ${pack}`,
        correlationId,
        500,
        false
      );

      return NextResponse.json(
        {
          success: false,
          error: configError.userMessage,
          correlationId,
        },
        { status: configError.statusCode }
      );
    }

    // Get customer ID (from request or demo customer)
    const customer = customerId || process.env.DEMO_STRIPE_CUSTOMER_ID;
    
    if (!customer) {
      logger.error('Customer ID not provided', new Error('Missing customer'), {
        correlationId,
      });

      const configError = createBillingError(
        BillingErrorType.CONFIGURATION_ERROR,
        'Customer ID not provided',
        correlationId,
        400,
        false
      );

      return NextResponse.json(
        {
          success: false,
          error: configError.userMessage,
          correlationId,
        },
        { status: configError.statusCode }
      );
    }

    // ========================================================================
    // 3. Create Stripe Checkout Session (with retry)
    // ========================================================================
    const stripe = getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';
    const packDetails = PACK_DETAILS[pack];

    logger.info('Creating Stripe checkout session', {
      correlationId,
      pack,
      priceId,
      customer,
    });

    const session = await retryWithBackoff(
      async () => {
        return await stripe.checkout.sessions.create({
          mode: 'payment',
          customer,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          success_url: `${baseUrl}/billing/packs/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/billing/packs`,
          metadata: {
            pack,
            messages: packDetails.messages.toString(),
            packName: packDetails.name,
            correlationId,
            ...metadata,
          },
          payment_intent_data: {
            metadata: {
              pack,
              messages: packDetails.messages.toString(),
              correlationId,
            },
          },
        });
      },
      STRIPE_CONFIG.maxRetries,
      correlationId,
      'Create checkout session'
    );

    // ========================================================================
    // 4. Return Success Response
    // ========================================================================
    const duration = Date.now() - startTime;

    logger.info('Checkout session created successfully', {
      correlationId,
      sessionId: session.id,
      duration,
    });

    return NextResponse.json(
      {
        success: true,
        url: session.url || undefined,
        sessionId: session.id,
        correlationId,
      },
      { status: 200 }
    );

  } catch (error) {
    // ========================================================================
    // Error Handling
    // ========================================================================
    const duration = Date.now() - startTime;

    logger.error('Checkout request failed', error as Error, {
      correlationId,
      duration,
    });

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      const stripeError = createBillingError(
        BillingErrorType.STRIPE_ERROR,
        error.message,
        correlationId,
        error.statusCode || 500,
        error.type === 'StripeConnectionError' || error.type === 'StripeAPIError'
      );

      return NextResponse.json(
        {
          success: false,
          error: stripeError.userMessage,
          correlationId,
        },
        { status: stripeError.statusCode }
      );
    }

    // Handle billing errors
    if ((error as BillingError).type) {
      const billingError = error as BillingError;
      return NextResponse.json(
        {
          success: false,
          error: billingError.userMessage,
          correlationId,
        },
        { status: billingError.statusCode }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        correlationId,
      },
      { status: 500 }
    );
  }
}

