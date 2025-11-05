/**
 * Recovery Middleware
 * Integrates recovery mechanisms with Next.js requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeWithCircuitBreaker } from '@/lib/recovery/circuitBreaker';
import { retryManager } from '@/lib/recovery/retryManager';
import { degradationManager } from '@/lib/recovery/gracefulDegradation';

export async function recoveryMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Check if feature is enabled (graceful degradation)
    const isAPIRequest = request.nextUrl.pathname.startsWith('/api/');
    
    if (isAPIRequest) {
      // Use circuit breaker for API requests
      return await executeWithCircuitBreaker(
        'api-requests',
        async () => {
          return await retryManager.executeWithRetry(
            handler,
            { maxAttempts: 2, baseDelay: 100 },
            'api-handler'
          );
        }
      );
    } else {
      // Regular request handling with degradation check
      const degradationStatus = await degradationManager.evaluateRules();
      
      if (degradationStatus.level >= 3) {
        // Severe degradation - serve simplified response
        return new NextResponse(
          'Service temporarily degraded. Please try again later.',
          { status: 503 }
        );
      }
      
      return await handler();
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error for monitoring
    console.error('Request failed:', {
      path: request.nextUrl.pathname,
      method: request.method,
      duration,
      error: error.message
    });
    
    // Check if we should trigger auto-healing
    if (duration > 5000 || error.message.includes('timeout')) {
      const { autoHealingManager } = await import('@/lib/recovery/autoHealing');
      autoHealingManager.executeAllApplicableActions().catch(console.error);
    }
    
    throw error;
  }
}
