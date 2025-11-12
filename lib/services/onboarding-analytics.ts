/**
 * Onboarding Analytics Event Tracking Service
 * 
 * Handles tracking of onboarding-related events with GDPR consent checking,
 * event type validation, and correlation ID management.
 * 
 * Features:
 * - GDPR-compliant consent checking
 * - Automatic retry on transient failures
 * - Correlation ID tracking for debugging
 * - Graceful degradation (never breaks user flow)
 * - Type-safe event payloads
 * 
 * @example
 * ```typescript
 * import { trackStepCompleted } from '@/lib/services/onboarding-analytics';
 * 
 * await trackStepCompleted(
 *   userId,
 *   'payments',
 *   5000,
 *   { correlationId: req.headers.get('x-correlation-id') }
 * );
 * ```
 */

import { getPool } from '@/lib/db';
import { OnboardingEventsRepository } from '@/lib/db/repositories/onboarding-events';

/**
 * Retry configuration for transient failures
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 1000,
  backoffFactor: 2
} as const;

/**
 * Onboarding event types
 */
export type OnboardingEventType =
  | 'onboarding.viewed'
  | 'onboarding.step_started'
  | 'onboarding.step_completed'
  | 'onboarding.step_skipped'
  | 'onboarding.nudge_snoozed'
  | 'gating.blocked'
  | 'merchant.previewed_store'
  | 'merchant.first_product_created'
  | 'merchant.first_checkout_attempt';

/**
 * Event payload types
 */
export type OnboardingEvent =
  | {
      type: 'onboarding.viewed';
      page: string;
      userRole: string;
      variant?: string;
    }
  | {
      type: 'onboarding.step_started';
      stepId: string;
      version: number;
      entrypoint: string;
    }
  | {
      type: 'onboarding.step_completed';
      stepId: string;
      durationMs: number;
    }
  | {
      type: 'onboarding.step_skipped';
      stepId: string;
      reason?: string;
    }
  | {
      type: 'onboarding.nudge_snoozed';
      durationDays: number;
      snoozeCount: number;
    }
  | {
      type: 'gating.blocked';
      route: string;
      missingStep: string;
    }
  | {
      type: 'merchant.previewed_store';
      timestamp: string;
    }
  | {
      type: 'merchant.first_product_created';
      productId: string;
    }
  | {
      type: 'merchant.first_checkout_attempt';
      amount: number;
      currency?: string;
    };

/**
 * Additional metadata that can be attached to any event
 */
export interface EventMetadata {
  correlationId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  [key: string]: any;
}

/**
 * Result of tracking operation
 */
export interface TrackingResult {
  success: boolean;
  correlationId: string;
  error?: string;
  retryCount?: number;
}

/**
 * Analytics service error types
 */
export class AnalyticsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userId?: string,
    public readonly eventType?: string,
    public readonly correlationId?: string
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

/**
 * Event tracking options
 */
export interface TrackEventOptions {
  skipConsentCheck?: boolean;
  forceTrack?: boolean;
}

/**
 * Essential event types that are always tracked (required for functionality)
 */
const ESSENTIAL_EVENT_TYPES: OnboardingEventType[] = [
  'gating.blocked',
  'onboarding.step_completed'
];

/**
 * Valid event types for validation
 */
const VALID_EVENT_TYPES: OnboardingEventType[] = [
  'onboarding.viewed',
  'onboarding.step_started',
  'onboarding.step_completed',
  'onboarding.step_skipped',
  'onboarding.nudge_snoozed',
  'gating.blocked',
  'merchant.previewed_store',
  'merchant.first_product_created',
  'merchant.first_checkout_attempt'
];

/**
 * Check if an event type is essential (always tracked)
 */
export function isEssentialEvent(eventType: string): boolean {
  return ESSENTIAL_EVENT_TYPES.includes(eventType as OnboardingEventType);
}

/**
 * Validate event type
 */
export function isValidEventType(eventType: string): boolean {
  return VALID_EVENT_TYPES.includes(eventType as OnboardingEventType);
}

/**
 * Generate a correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: string,
  correlationId: string
): Promise<T> {
  let lastError: Error | undefined;
  let delay = RETRY_CONFIG.initialDelayMs;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation errors or final attempt
      if (
        error instanceof AnalyticsError ||
        attempt === RETRY_CONFIG.maxAttempts
      ) {
        throw error;
      }
      
      console.warn(`[Analytics] ${context} failed (attempt ${attempt}/${RETRY_CONFIG.maxAttempts})`, {
        correlationId,
        error: lastError.message,
        nextRetryIn: `${delay}ms`
      });
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay = Math.min(delay * RETRY_CONFIG.backoffFactor, RETRY_CONFIG.maxDelayMs);
    }
  }
  
  throw lastError;
}

/**
 * Check if user has given analytics consent (GDPR compliance)
 * 
 * @param userId - User ID to check consent for
 * @returns Promise<boolean> - True if user has given consent
 * 
 * @throws {AnalyticsError} On database errors after retries
 */
export async function checkAnalyticsConsent(userId: string): Promise<boolean> {
  const correlationId = generateCorrelationId();
  
  try {
    return await retryWithBackoff(
      async () => {
        const pool = getPool();
        
        // Query user consent table with timeout
        const query = `
          SELECT granted
          FROM user_consent
          WHERE user_id = $1
            AND consent_type = 'analytics'
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        const result = await pool.query(query, [userId]);
        
        // Default to true if no consent record exists (opt-out model)
        // Change to false for opt-in model
        return result.rows[0]?.granted ?? true;
      },
      'Consent check',
      correlationId
    );
    
  } catch (error) {
    console.error('[Analytics] Failed to check consent after retries', {
      userId,
      correlationId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Fail open - allow tracking if consent check fails
    // Change to false for stricter GDPR compliance
    return true;
  }
}

/**
 * Track an onboarding event with retry logic
 * 
 * @param userId - User ID
 * @param event - Event payload
 * @param metadata - Additional metadata
 * @param options - Tracking options
 * @returns Promise<TrackingResult> - Result of tracking operation
 * 
 * @example
 * ```typescript
 * const result = await trackOnboardingEvent(
 *   'user-123',
 *   {
 *     type: 'onboarding.step_completed',
 *     stepId: 'payments',
 *     durationMs: 5000
 *   },
 *   { correlationId: 'abc-123' }
 * );
 * 
 * if (!result.success) {
 *   console.error('Tracking failed:', result.error);
 * }
 * ```
 */
export async function trackOnboardingEvent(
  userId: string,
  event: OnboardingEvent,
  metadata?: EventMetadata,
  options: TrackEventOptions = {}
): Promise<TrackingResult> {
  const { skipConsentCheck = false, forceTrack = false } = options;
  
  // Generate correlation ID if not provided
  const correlationId = metadata?.correlationId || generateCorrelationId();
  
  try {
    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      throw new AnalyticsError(
        'Invalid userId',
        'INVALID_USER_ID',
        userId,
        event.type,
        correlationId
      );
    }
    
    // Validate event type
    if (!isValidEventType(event.type)) {
      throw new AnalyticsError(
        `Invalid event type: ${event.type}`,
        'INVALID_EVENT_TYPE',
        userId,
        event.type,
        correlationId
      );
    }
    
    // Check GDPR consent unless skipped or event is essential
    if (!skipConsentCheck && !forceTrack && !isEssentialEvent(event.type)) {
      const hasConsent = await checkAnalyticsConsent(userId);
      
      if (!hasConsent) {
        console.log('[Analytics] Skipping non-essential event (no consent)', {
          userId,
          eventType: event.type,
          correlationId
        });
        
        return {
          success: true,
          correlationId,
          error: 'No consent - event skipped'
        };
      }
    }
    
    // Extract step ID and version from event if present
    const stepId = 'stepId' in event ? event.stepId : undefined;
    const version = 'version' in event ? event.version : undefined;
    
    // Combine event data with metadata
    const eventMetadata = {
      ...event,
      ...metadata,
      correlationId,
      trackedAt: new Date().toISOString()
    };
    
    // Track event with retry logic
    let retryCount = 0;
    await retryWithBackoff(
      async () => {
        const pool = getPool();
        const eventsRepo = new OnboardingEventsRepository(pool);
        
        await eventsRepo.trackEvent({
          userId,
          eventType: event.type,
          stepId,
          version,
          metadata: eventMetadata,
          correlationId
        });
        
        retryCount++;
      },
      'Event tracking',
      correlationId
    );
    
    console.log('[Analytics] Event tracked successfully', {
      userId,
      eventType: event.type,
      stepId,
      correlationId,
      retryCount: retryCount > 1 ? retryCount : undefined
    });
    
    return {
      success: true,
      correlationId,
      retryCount: retryCount > 1 ? retryCount : undefined
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof AnalyticsError ? error.code : 'UNKNOWN_ERROR';
    
    console.error('[Analytics] Failed to track event after retries', {
      userId,
      eventType: event.type,
      correlationId,
      error: errorMessage,
      errorCode,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return failure result - don't throw to avoid breaking user flow
    return {
      success: false,
      correlationId,
      error: errorMessage
    };
  }
}

/**
 * Track multiple events in batch with parallel execution
 * 
 * @param userId - User ID
 * @param events - Array of events to track
 * @param metadata - Shared metadata for all events
 * @param options - Tracking options
 * @returns Promise<TrackingResult[]> - Results for each event
 * 
 * @example
 * ```typescript
 * const results = await trackOnboardingEvents(
 *   userId,
 *   [
 *     { type: 'onboarding.step_started', stepId: 'payments', version: 1, entrypoint: 'dashboard' },
 *     { type: 'onboarding.viewed', page: '/onboarding', userRole: 'owner' }
 *   ]
 * );
 * 
 * const failedEvents = results.filter(r => !r.success);
 * if (failedEvents.length > 0) {
 *   console.warn(`${failedEvents.length} events failed to track`);
 * }
 * ```
 */
export async function trackOnboardingEvents(
  userId: string,
  events: OnboardingEvent[],
  metadata?: EventMetadata,
  options: TrackEventOptions = {}
): Promise<TrackingResult[]> {
  // Track events in parallel with Promise.allSettled to handle partial failures
  const results = await Promise.allSettled(
    events.map(event => trackOnboardingEvent(userId, event, metadata, options))
  );
  
  // Convert settled promises to tracking results
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const event = events[index];
      const correlationId = metadata?.correlationId || generateCorrelationId();
      
      console.error('[Analytics] Batch event tracking failed', {
        userId,
        eventType: event.type,
        correlationId,
        error: result.reason
      });
      
      return {
        success: false,
        correlationId,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
      };
    }
  });
}

/**
 * Track onboarding page view
 * 
 * @param userId - User ID
 * @param page - Page path (e.g., '/onboarding', '/dashboard')
 * @param userRole - User role (e.g., 'owner', 'staff', 'admin')
 * @param variant - A/B test variant (optional)
 * @param metadata - Additional metadata
 * @returns Promise<TrackingResult>
 */
export async function trackOnboardingView(
  userId: string,
  page: string,
  userRole: string,
  variant?: string,
  metadata?: EventMetadata
): Promise<TrackingResult> {
  return trackOnboardingEvent(
    userId,
    {
      type: 'onboarding.viewed',
      page,
      userRole,
      variant
    },
    metadata
  );
}

/**
 * Track step started
 * 
 * @param userId - User ID
 * @param stepId - Step identifier (e.g., 'payments', 'theme')
 * @param version - Step version number
 * @param entrypoint - Where user started step (e.g., 'dashboard', 'modal')
 * @param metadata - Additional metadata
 * @returns Promise<TrackingResult>
 */
export async function trackStepStarted(
  userId: string,
  stepId: string,
  version: number,
  entrypoint: string,
  metadata?: EventMetadata
): Promise<TrackingResult> {
  return trackOnboardingEvent(
    userId,
    {
      type: 'onboarding.step_started',
      stepId,
      version,
      entrypoint
    },
    metadata
  );
}

/**
 * Track step completed (essential event - always tracked)
 * 
 * @param userId - User ID
 * @param stepId - Step identifier
 * @param durationMs - Time taken to complete step in milliseconds
 * @param metadata - Additional metadata
 * @returns Promise<TrackingResult>
 */
export async function trackStepCompleted(
  userId: string,
  stepId: string,
  durationMs: number,
  metadata?: EventMetadata
): Promise<TrackingResult> {
  return trackOnboardingEvent(
    userId,
    {
      type: 'onboarding.step_completed',
      stepId,
      durationMs
    },
    metadata,
    { forceTrack: true } // Always track completions (essential)
  );
}

/**
 * Track step skipped
 * 
 * @param userId - User ID
 * @param stepId - Step identifier
 * @param reason - Optional reason for skipping
 * @param metadata - Additional metadata
 * @returns Promise<TrackingResult>
 */
export async function trackStepSkipped(
  userId: string,
  stepId: string,
  reason?: string,
  metadata?: EventMetadata
): Promise<TrackingResult> {
  return trackOnboardingEvent(
    userId,
    {
      type: 'onboarding.step_skipped',
      stepId,
      reason
    },
    metadata
  );
}

/**
 * Track nudge snoozed
 * 
 * @param userId - User ID
 * @param durationDays - Number of days to snooze
 * @param snoozeCount - Current snooze count
 * @param metadata - Additional metadata
 * @returns Promise<TrackingResult>
 */
export async function trackNudgeSnoozed(
  userId: string,
  durationDays: number,
  snoozeCount: number,
  metadata?: EventMetadata
): Promise<TrackingResult> {
  return trackOnboardingEvent(
    userId,
    {
      type: 'onboarding.nudge_snoozed',
      durationDays,
      snoozeCount
    },
    metadata
  );
}

/**
 * Track gating blocked (essential event - always tracked)
 * 
 * @param userId - User ID
 * @param route - Route that was blocked (e.g., '/api/store/publish')
 * @param missingStep - Required step that is missing
 * @param metadata - Additional metadata
 * @returns Promise<TrackingResult>
 */
export async function trackGatingBlocked(
  userId: string,
  route: string,
  missingStep: string,
  metadata?: EventMetadata
): Promise<TrackingResult> {
  return trackOnboardingEvent(
    userId,
    {
      type: 'gating.blocked',
      route,
      missingStep
    },
    metadata,
    { forceTrack: true } // Always track gating (essential)
  );
}

/**
 * Track merchant milestone: store preview
 * 
 * @param userId - User ID
 * @param metadata - Additional metadata
 * @returns Promise<TrackingResult>
 */
export async function trackStorePreview(
  userId: string,
  metadata?: EventMetadata
): Promise<TrackingResult> {
  return trackOnboardingEvent(
    userId,
    {
      type: 'merchant.previewed_store',
      timestamp: new Date().toISOString()
    },
    metadata
  );
}

/**
 * Track merchant milestone: first product created
 * 
 * @param userId - User ID
 * @param productId - ID of the created product
 * @param metadata - Additional metadata
 * @returns Promise<TrackingResult>
 */
export async function trackFirstProductCreated(
  userId: string,
  productId: string,
  metadata?: EventMetadata
): Promise<TrackingResult> {
  return trackOnboardingEvent(
    userId,
    {
      type: 'merchant.first_product_created',
      productId
    },
    metadata
  );
}

/**
 * Track merchant milestone: first checkout attempt
 * 
 * @param userId - User ID
 * @param amount - Checkout amount
 * @param currency - Currency code (default: 'EUR')
 * @param metadata - Additional metadata
 * @returns Promise<TrackingResult>
 */
export async function trackFirstCheckoutAttempt(
  userId: string,
  amount: number,
  currency: string = 'EUR',
  metadata?: EventMetadata
): Promise<TrackingResult> {
  return trackOnboardingEvent(
    userId,
    {
      type: 'merchant.first_checkout_attempt',
      amount,
      currency
    },
    metadata
  );
}

/**
 * User event statistics result
 */
export interface UserEventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  lastEventAt?: Date;
  correlationId: string;
}

/**
 * Get event statistics for a user with retry logic
 * 
 * @param userId - User ID
 * @returns Promise<UserEventStats> - Event statistics
 * 
 * @example
 * ```typescript
 * const stats = await getUserEventStats(userId);
 * console.log(`User has ${stats.totalEvents} total events`);
 * console.log(`Step completions: ${stats.eventsByType['onboarding.step_completed'] || 0}`);
 * ```
 */
export async function getUserEventStats(userId: string): Promise<UserEventStats> {
  const correlationId = generateCorrelationId();
  
  try {
    return await retryWithBackoff(
      async () => {
        const pool = getPool();
        
        const query = `
          SELECT 
            COUNT(*) as total_events,
            jsonb_object_agg(event_type, event_count) as events_by_type,
            MAX(created_at) as last_event_at
          FROM (
            SELECT 
              event_type,
              COUNT(*) as event_count,
              MAX(created_at) as created_at
            FROM onboarding_events
            WHERE user_id = $1
            GROUP BY event_type
          ) subquery
        `;
        
        const result = await pool.query(query, [userId]);
        const row = result.rows[0];
        
        return {
          totalEvents: parseInt(row?.total_events || '0'),
          eventsByType: row?.events_by_type || {},
          lastEventAt: row?.last_event_at,
          correlationId
        };
      },
      'Get user event stats',
      correlationId
    );
    
  } catch (error) {
    console.error('[Analytics] Failed to get user event stats after retries', {
      userId,
      correlationId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return empty stats on failure
    return {
      totalEvents: 0,
      eventsByType: {},
      correlationId
    };
  }
}
