import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { requireStep } from '@/lib/middleware/onboarding-gating';

export const runtime = 'nodejs';

/**
 * POST /api/checkout/process
 * 
 * Processes a payment for a checkout session.
 * Requires payment configuration to be completed.
 * 
 * This is a CRITICAL route - fails closed on errors.
 * 
 * Request Body:
 * {
 *   checkoutSessionId: string,
 *   paymentMethodId: string,
 *   billingDetails?: {
 *     name: string,
 *     email: string,
 *     address?: Record<string, any>
 *   }
 * }
 */
export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();
  
  try {
    const user = await requireUser();
    
    // Check gating: user must have completed payments setup
    const gatingCheck = await requireStep({
      requiredStep: 'payments',
      message: 'Vous devez configurer les paiements avant de traiter des transactions',
      isCritical: true, // Fail closed - this is a critical financial operation
      action: {
        type: 'open_modal',
        modal: 'payments_setup',
        prefill: {
          returnUrl: '/api/checkout/process'
        }
      }
    });
    
    if (gatingCheck) {
      return gatingCheck;
    }
    
    // Parse request body
    let body: {
      checkoutSessionId?: string;
      paymentMethodId?: string;
      billingDetails?: {
        name: string;
        email: string;
        address?: Record<string, any>;
      };
    };
    
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('[Checkout Process] Invalid JSON in request body', {
        error: parseError,
        correlationId
      });
      return NextResponse.json(
        { error: 'Invalid JSON in request body', correlationId },
        { status: 400 }
      );
    }
    
    const { checkoutSessionId, paymentMethodId, billingDetails } = body;
    
    // Validate required fields
    if (!checkoutSessionId || typeof checkoutSessionId !== 'string') {
      return NextResponse.json(
        { error: 'checkoutSessionId is required', correlationId },
        { status: 400 }
      );
    }
    
    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return NextResponse.json(
        { error: 'paymentMethodId is required', correlationId },
        { status: 400 }
      );
    }
    
    console.log('[Checkout Process] Processing payment', {
      userId: user.id,
      checkoutSessionId,
      correlationId
    });
    
    // TODO: Implement actual payment processing logic
    // - Validate checkout session exists and is not expired
    // - Verify payment method
    // - Process payment with payment provider (Stripe, etc.)
    // - Create order record
    // - Send confirmation email
    // - Track analytics event
    // - Update inventory
    
    // Mock response
    const payment = {
      id: `payment_${Date.now()}`,
      checkoutSessionId,
      userId: user.id,
      amount: 10000, // Mock amount in cents
      currency: 'EUR',
      status: 'succeeded',
      paymentMethodId,
      billingDetails,
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      payment,
      orderId: `order_${Date.now()}`,
      message: 'Paiement traité avec succès',
      correlationId
    });
    
  } catch (error) {
    console.error('[Checkout Process] Failed to process payment', {
      error: error instanceof Error ? error.message : String(error),
      correlationId
    });
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      },
      { status: 500 }
    );
  }
}
