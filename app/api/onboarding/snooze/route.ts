import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getPool } from '@/lib/db';
import { UserOnboardingRepository } from '@/lib/db/repositories/user-onboarding';
import { invalidateUserOnboardingCache } from '../route';
import { trackNudgeSnoozed } from '@/lib/services/onboarding-analytics';

export const runtime = 'nodejs';

/**
 * TypeScript types for API requests/responses
 */
export interface SnoozeRequest {
  days?: number;
}

export interface SnoozeResponse {
  success: boolean;
  snoozeUntil: string;
  snoozeCount: number;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  correlationId?: string;
}

/**
 * POST /api/onboarding/snooze
 * 
 * Snooze onboarding nudges for a specified number of days.
 * Maximum 3 snoozes allowed.
 * 
 * Request Body:
 * {
 *   days?: number  // Default: 7 days
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   snoozeUntil: "2025-11-18T00:00:00Z",
 *   snoozeCount: 1
 * }
 * 
 * Error Responses:
 * - 400 Bad Request: Invalid days parameter or max snoozes reached
 * - 401 Unauthorized: User not authenticated
 */
async function postHandler(req: Request): Promise<NextResponse<SnoozeResponse | ErrorResponse>> {
  const correlationId = crypto.randomUUID();
  
  try {
    const user = await requireUser();
    
    // Parse request body
    let body: SnoozeRequest = {};
    try {
      body = await req.json().catch(() => ({}));
    } catch (parseError) {
      console.warn('[Onboarding Snooze API] Invalid JSON, using defaults', { userId: user.id });
    }
    
    const days = body.days || 7;
    
    // Validate days parameter
    if (typeof days !== 'number' || days < 1 || days > 30) {
      return NextResponse.json(
        { 
          error: 'Invalid days parameter',
          details: 'days must be a number between 1 and 30',
          correlationId 
        },
        { status: 400 }
      );
    }
    
    console.log('[Onboarding Snooze API] POST request', { userId: user.id, days, correlationId });
    
    const pool = getPool();
    const userOnboardingRepo = new UserOnboardingRepository(pool);
    
    // Maximum snoozes allowed
    const maxSnoozes = 3;
    
    try {
      // Snooze nudges
      await userOnboardingRepo.snoozeNudges(user.id, days, maxSnoozes);
      
      // Calculate snooze until date
      const snoozeUntil = new Date();
      snoozeUntil.setDate(snoozeUntil.getDate() + days);
      
      // Get current snooze count
      const userSteps = await userOnboardingRepo.getUserSteps(user.id);
      const maxSnoozeCount = Math.max(...userSteps.map(s => s.snoozeCount), 0);
      
      // Track analytics event
      await trackNudgeSnoozed(
        user.id,
        days,
        maxSnoozeCount,
        {
          correlationId,
          snoozeUntil: snoozeUntil.toISOString()
        }
      );
      
      // Invalidate cache
      try {
        await invalidateUserOnboardingCache(user.id);
      } catch (cacheError) {
        console.warn('[Onboarding Snooze API] Cache invalidation error:', cacheError);
      }
      
      console.log('[Onboarding Snooze API] POST request completed', { 
        userId: user.id, 
        days,
        snoozeCount: maxSnoozeCount,
        correlationId 
      });
      
      return NextResponse.json({
        success: true,
        snoozeUntil: snoozeUntil.toISOString(),
        snoozeCount: maxSnoozeCount
      });
      
    } catch (error) {
      // Check if max snoozes reached
      if (error instanceof Error && error.message.includes('Maximum snooze limit')) {
        return NextResponse.json(
          { 
            error: 'Maximum snooze limit reached',
            details: `You can only snooze ${maxSnoozes} times`,
            correlationId 
          },
          { status: 400 }
        );
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('[Onboarding Snooze API] POST request failed:', error, { correlationId });
    
    // Check for specific error types
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to snooze onboarding nudges',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId 
      },
      { status: 500 }
    );
  }
}

export const POST = postHandler as any;
