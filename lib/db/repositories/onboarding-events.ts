/**
 * Onboarding Events Repository
 * 
 * Handles analytics event tracking for onboarding with GDPR consent checking,
 * correlation IDs for request tracing, and batch insertion for performance.
 */

import { Pool } from 'pg';

export interface OnboardingEvent {
  id: string;
  userId: string;
  eventType: string;
  stepId?: string;
  version?: number;
  metadata?: Record<string, any>;
  correlationId?: string;
  createdAt: Date;
}

export interface CreateEventInput {
  userId: string;
  eventType: string;
  stepId?: string;
  version?: number;
  metadata?: Record<string, any>;
  correlationId?: string;
}

export interface EventQuery {
  userId?: string;
  eventType?: string;
  stepId?: string;
  startDate?: Date;
  endDate?: Date;
  correlationId?: string;
  limit?: number;
  offset?: number;
}

export class OnboardingEventsRepository {
  constructor(private pool: Pool) {}

  /**
   * Track a single onboarding event with consent checking
   */
  async trackEvent(input: CreateEventInput): Promise<OnboardingEvent | null> {
    const { userId, eventType, stepId, version, metadata, correlationId } = input;
    
    // Check GDPR consent for non-essential events
    const hasConsent = await this.checkAnalyticsConsent(userId);
    
    if (!hasConsent && !this.isEssentialEvent(eventType)) {
      // Skip non-essential events without consent
      return null;
    }
    
    const query = `
      INSERT INTO onboarding_events (
        user_id,
        event_type,
        step_id,
        version,
        metadata,
        correlation_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        user_id as "userId",
        event_type as "eventType",
        step_id as "stepId",
        version,
        metadata,
        correlation_id as "correlationId",
        created_at as "createdAt"
    `;
    
    const result = await this.pool.query(query, [
      userId,
      eventType,
      stepId,
      version,
      metadata ? JSON.stringify(metadata) : null,
      correlationId
    ]);
    
    return result.rows[0];
  }

  /**
   * Track multiple events in batch for performance
   */
  async trackEventsBatch(inputs: CreateEventInput[]): Promise<OnboardingEvent[]> {
    if (inputs.length === 0) {
      return [];
    }
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const events: OnboardingEvent[] = [];
      
      // Process in batches of 100
      const batchSize = 100;
      for (let i = 0; i < inputs.length; i += batchSize) {
        const batch = inputs.slice(i, i + batchSize);
        
        // Build values for batch insert
        const values: any[] = [];
        const placeholders: string[] = [];
        let paramIndex = 1;
        
        for (const input of batch) {
          // Check consent for each user
          const hasConsent = await this.checkAnalyticsConsent(input.userId);
          
          if (!hasConsent && !this.isEssentialEvent(input.eventType)) {
            continue;
          }
          
          placeholders.push(
            `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`
          );
          
          values.push(
            input.userId,
            input.eventType,
            input.stepId || null,
            input.version || null,
            input.metadata ? JSON.stringify(input.metadata) : null,
            input.correlationId || null
          );
          
          paramIndex += 6;
        }
        
        if (placeholders.length > 0) {
          const query = `
            INSERT INTO onboarding_events (
              user_id,
              event_type,
              step_id,
              version,
              metadata,
              correlation_id
            ) VALUES ${placeholders.join(', ')}
            RETURNING 
              id,
              user_id as "userId",
              event_type as "eventType",
              step_id as "stepId",
              version,
              metadata,
              correlation_id as "correlationId",
              created_at as "createdAt"
          `;
          
          const result = await client.query(query, values);
          events.push(...result.rows);
        }
      }
      
      await client.query('COMMIT');
      return events;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Query events with filters
   */
  async queryEvents(query: EventQuery): Promise<OnboardingEvent[]> {
    const {
      userId,
      eventType,
      stepId,
      startDate,
      endDate,
      correlationId,
      limit = 100,
      offset = 0
    } = query;
    
    let sql = `
      SELECT 
        id,
        user_id as "userId",
        event_type as "eventType",
        step_id as "stepId",
        version,
        metadata,
        correlation_id as "correlationId",
        created_at as "createdAt"
      FROM onboarding_events
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (userId) {
      sql += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (eventType) {
      sql += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }
    
    if (stepId) {
      sql += ` AND step_id = $${paramIndex}`;
      params.push(stepId);
      paramIndex++;
    }
    
    if (startDate) {
      sql += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    if (correlationId) {
      sql += ` AND correlation_id = $${paramIndex}`;
      params.push(correlationId);
      paramIndex++;
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  /**
   * Get events by correlation ID (for request tracing)
   */
  async getEventsByCorrelationId(correlationId: string): Promise<OnboardingEvent[]> {
    return this.queryEvents({ correlationId });
  }

  /**
   * Get user's event history
   */
  async getUserEvents(
    userId: string,
    options?: {
      eventType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<OnboardingEvent[]> {
    return this.queryEvents({
      userId,
      eventType: options?.eventType,
      limit: options?.limit,
      offset: options?.offset
    });
  }

  /**
   * Get events for a specific step
   */
  async getStepEvents(
    stepId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<OnboardingEvent[]> {
    return this.queryEvents({
      stepId,
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit
    });
  }

  /**
   * Calculate skip rate for a step (last 7 days)
   */
  async getStepSkipRate(stepId: string, days: number = 7): Promise<number> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE event_type = 'onboarding.step_skipped') as skip_count,
        COUNT(*) FILTER (WHERE event_type IN ('onboarding.step_completed', 'onboarding.step_skipped')) as total_count
      FROM onboarding_events
      WHERE step_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;
    
    const result = await this.pool.query(query, [stepId]);
    const skipCount = parseInt(result.rows[0]?.skip_count || '0');
    const totalCount = parseInt(result.rows[0]?.total_count || '0');
    
    if (totalCount === 0) return 0;
    
    return Math.round((skipCount / totalCount) * 100);
  }

  /**
   * Calculate Time-to-Value (TTV) metrics
   */
  async calculateTTV(userId: string): Promise<{
    timeToFirstPreview?: number;
    timeToFirstProduct?: number;
    signupAt: Date;
  } | null> {
    const query = `
      SELECT 
        u.created_at as signup_at,
        MIN(CASE WHEN e.event_type = 'merchant.previewed_store' THEN e.created_at END) as first_preview_at,
        MIN(CASE WHEN e.event_type = 'merchant.first_product_created' THEN e.created_at END) as first_product_at
      FROM users u
      LEFT JOIN onboarding_events e ON e.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.created_at
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    const signupAt = new Date(row.signup_at);
    
    const ttv: any = { signupAt };
    
    if (row.first_preview_at) {
      const firstPreviewAt = new Date(row.first_preview_at);
      ttv.timeToFirstPreview = Math.round((firstPreviewAt.getTime() - signupAt.getTime()) / 60000); // minutes
    }
    
    if (row.first_product_at) {
      const firstProductAt = new Date(row.first_product_at);
      ttv.timeToFirstProduct = Math.round((firstProductAt.getTime() - signupAt.getTime()) / 60000); // minutes
    }
    
    return ttv;
  }

  /**
   * Calculate modal abandonment rate
   */
  async getModalAbandonmentRate(stepId: string, days: number = 7): Promise<number> {
    const query = `
      SELECT 
        COUNT(*) as blocked_count,
        COUNT(*) FILTER (WHERE NOT EXISTS (
          SELECT 1 FROM onboarding_events e2 
          WHERE e2.user_id = e.user_id 
          AND e2.event_type = 'onboarding.step_completed'
          AND e2.step_id = e.metadata->>'missingStep'
          AND e2.created_at > e.created_at
          AND e2.created_at < e.created_at + INTERVAL '1 hour'
        )) as abandoned_count
      FROM onboarding_events e
      WHERE event_type = 'gating.blocked'
        AND metadata->>'missingStep' = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;
    
    const result = await this.pool.query(query, [stepId]);
    const blockedCount = parseInt(result.rows[0]?.blocked_count || '0');
    const abandonedCount = parseInt(result.rows[0]?.abandoned_count || '0');
    
    if (blockedCount === 0) return 0;
    
    return Math.round((abandonedCount / blockedCount) * 100);
  }

  /**
   * Check if user has granted analytics consent
   */
  private async checkAnalyticsConsent(userId: string): Promise<boolean> {
    const query = `
      SELECT granted
      FROM user_consent
      WHERE user_id = $1 AND consent_type = 'analytics'
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows[0]?.granted || false;
  }

  /**
   * Check if event type is essential (always tracked for functionality)
   */
  private isEssentialEvent(eventType: string): boolean {
    const essentialEvents = [
      'gating.blocked',
      'onboarding.step_completed',
      'onboarding.step_started'
    ];
    
    return essentialEvents.includes(eventType) || eventType.startsWith('gating.');
  }

  /**
   * Delete user's events (GDPR right to erasure)
   */
  async deleteUserEvents(userId: string): Promise<number> {
    const query = `
      DELETE FROM onboarding_events
      WHERE user_id = $1
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rowCount || 0;
  }

  /**
   * Export user's events (GDPR right to access)
   */
  async exportUserEvents(userId: string): Promise<OnboardingEvent[]> {
    return this.queryEvents({ userId, limit: 10000 });
  }

  /**
   * Get event count by type for a user
   */
  async getEventCountByType(userId: string): Promise<Record<string, number>> {
    const query = `
      SELECT 
        event_type,
        COUNT(*) as count
      FROM onboarding_events
      WHERE user_id = $1
      GROUP BY event_type
      ORDER BY count DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    const counts: Record<string, number> = {};
    result.rows.forEach(row => {
      counts[row.event_type] = parseInt(row.count);
    });
    
    return counts;
  }
}
