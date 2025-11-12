import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { withGating } from '@/lib/middleware/onboarding-gating';

export const runtime = 'nodejs';

/**
 * POST /api/checkout/initiate
 * 
 * Initiates a checkout session for a customer.
 * Requires payment configuration to be completed.
 * 
 * This is a CRITICAL route - fails closed on errors.
 * 
 * Request Body:
 * {
 *   items: Array<{ productId: string, quantity: number }>,
 *   customerId?: string,
 *   metadata?: Record<string, any>
 * }
 */
export const POST = withGating(
  {
    requiredStep: 'payments',
    message: 'Vous devez configurer les paiements avant de traiter des commandes',
    isCritical: true, // Fail closed - this is a critical financial operation
    action: {
      type: 'open_modal',
      modal: 'payments_setup',
      prefill: {
        returnUrl: '/api/checkout/initiate'
      }
    }
  },
  async (req: Request): Promise<NextResponse<any>> => {
    const correlationId = crypto.randomUUID();
    
    try {
      const user = await requireUser();
      
      // Parse request body
      let body: {
        items?: Array<{ productId: string; quantity: number }>;
        customerId?: string;
        metadata?: Record<string, any>;
      };
      
      try {
        body = await req.json();
      } catch (parseError) {
        console.error('[Checkout] Invalid JSON in request body', {
          error: parseError,
          correlationId
        });
        return NextResponse.json(
          { error: 'Invalid JSON in request body', correlationId },
          { status: 400 }
        );
      }
      
      const { items, customerId, metadata } = body;
      
      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'items array is required and must not be empty', correlationId },
          { status: 400 }
        );
      }
      
      // Validate each item
      for (const item of items) {
        if (!item.productId || typeof item.productId !== 'string') {
          return NextResponse.json(
            { error: 'Each item must have a valid productId', correlationId },
            { status: 400 }
          );
        }
        
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
          return NextResponse.json(
            { error: 'Each item must have a valid quantity (>= 1)', correlationId },
            { status: 400 }
          );
        }
      }
      
      console.log('[Checkout] Initiating checkout', {
        userId: user.id,
        itemCount: items.length,
        customerId,
        correlationId
      });
      
      // TODO: Implement actual checkout logic
      // - Validate products exist and are available
      // - Calculate totals (subtotal, tax, shipping)
      // - Create checkout session
      // - Generate payment intent
      // - Track analytics event
      
      // Mock response
      const checkoutSession = {
        id: `checkout_${Date.now()}`,
        userId: user.id,
        customerId,
        items,
        subtotal: items.reduce((sum, item) => sum + item.quantity * 100, 0), // Mock price
        tax: 0,
        shipping: 0,
        total: items.reduce((sum, item) => sum + item.quantity * 100, 0),
        currency: 'EUR',
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        metadata
      };
      
      return NextResponse.json({
        success: true,
        checkoutSession,
        paymentUrl: `/checkout/${checkoutSession.id}`,
        correlationId
      });
      
    } catch (error) {
      console.error('[Checkout] Failed to initiate checkout', {
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
          error: 'Failed to initiate checkout',
          details: error instanceof Error ? error.message : 'Unknown error',
          correlationId
        },
        { status: 500 }
      );
    }
  }
);
