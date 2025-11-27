'use client';

/**
 * Billing Checkout Hook - Optimized
 * 
 * React hook for creating Stripe checkout sessions with:
 * - Loading states
 * - Error handling
 * - Retry logic
 * - Correlation ID tracking
 */

'use client';

import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type PackType = '25k' | '100k' | '500k';

export interface CheckoutOptions {
  pack: PackType;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResponse {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
  correlationId?: string;
}

export interface UseCheckoutReturn {
  createCheckout: (options: CheckoutOptions) => Promise<CheckoutResponse>;
  loading: boolean;
  error: string | null;
  correlationId: string | null;
  reset: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for creating Stripe checkout sessions
 * 
 * @returns Checkout function, loading state, error, and correlation ID
 * 
 * @example
 * ```tsx
 * function BillingPage() {
 *   const { createCheckout, loading, error } = useCheckout();
 * 
 *   const handlePurchase = async () => {
 *     const result = await createCheckout({ pack: '25k' });
 *     if (result.success && result.url) {
 *       window.location.href = result.url;
 *     }
 *   };
 * 
 *   return (
 *     <button onClick={handlePurchase} disabled={loading}>
 *       {loading ? 'Processing...' : 'Buy Pack'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCheckout(): UseCheckoutReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  /**
   * Create checkout session
   */
  const createCheckout = useCallback(async (
    options: CheckoutOptions
  ): Promise<CheckoutResponse> => {
    // Prevent double-click
    if (loading) {
      return {
        success: false,
        error: 'Request already in progress',
      };
    }

    setLoading(true);
    setError(null);
    setCorrelationId(null);

    try {
      const response = await fetch('/api/billing/message-packs/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data: CheckoutResponse = await response.json();

      // Store correlation ID for debugging
      if (data.correlationId) {
        setCorrelationId(data.correlationId);
      }

      if (!data.success) {
        setError(data.error || 'Checkout failed');
        return data;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [loading]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setCorrelationId(null);
  }, []);

  return {
    createCheckout,
    loading,
    error,
    correlationId,
    reset,
  };
}

// ============================================================================
// Utility Hook - Auto-redirect
// ============================================================================

/**
 * Hook with automatic redirect to Stripe checkout
 * 
 * @example
 * ```tsx
 * function BillingPage() {
 *   const { purchasePack, loading, error } = useCheckoutWithRedirect();
 * 
 *   return (
 *     <button onClick={() => purchasePack('25k')} disabled={loading}>
 *       Buy 25k Pack
 *     </button>
 *   );
 * }
 * ```
 */
export function useCheckoutWithRedirect() {
  const { createCheckout, loading, error, correlationId, reset } = useCheckout();

  const purchasePack = useCallback(async (
    pack: PackType,
    customerId?: string,
    metadata?: Record<string, string>
  ) => {
    const result = await createCheckout({ pack, customerId, metadata });

    if (result.success && result.url) {
      // Redirect to Stripe checkout
      window.location.href = result.url;
    }

    return result;
  }, [createCheckout]);

  return {
    purchasePack,
    loading,
    error,
    correlationId,
    reset,
  };
}

// ============================================================================
// Pack Information
// ============================================================================

export const PACK_INFO: Record<PackType, { messages: number; name: string; description: string }> = {
  '25k': {
    messages: 25000,
    name: 'Starter Pack',
    description: 'Perfect for getting started',
  },
  '100k': {
    messages: 100000,
    name: 'Pro Pack',
    description: 'Most popular choice',
  },
  '500k': {
    messages: 500000,
    name: 'Enterprise Pack',
    description: 'For high-volume users',
  },
};

/**
 * Get pack information
 */
export function getPackInfo(pack: PackType) {
  return PACK_INFO[pack];
}

/**
 * Format message count
 */
export function formatMessageCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}k`;
  }
  return count.toString();
}
