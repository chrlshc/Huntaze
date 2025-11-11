// Smart Onboarding System - Behavior Events Repository

import { Pool } from 'pg';
import { TimeSeriesRepository } from './base';
import { BehaviorEvent, StruggleIndicator, EngagementMetric, ProcessedBehaviorData } from '../types';
import { SMART_ONBOARDING_TABLES } from '../config/database';

export class BehaviorEventsRepository extends TimeSeriesRepository<BehaviorEvent> {
  constructor(db: Pool) {
    super(db, SMART_ONBOARDING_TABLES.BEHAVIOR_EVENTS);
  }

  // Store processed behavioral data (lightweight persistence)
  async storeProcessedEvent(data: ProcessedBehaviorData): Promise<void> {
    // For now, persist minimal fields into the same events table as an audit log
    // by creating a synthetic event with type 'processed'. This can be replaced
    // by a dedicated processed-data table when available.
    try {
      const row = {
        user_id: data.userId,
        session_id: data.sessionId,
        journey_id: null,
        step_id: data.stepId || null,
        event_type: 'processed',
        interaction_data: JSON.stringify({ interactionMetrics: data.interactionMetrics }),
        engagement_score: data.interactionMetrics.engagementScore,
        contextual_data: JSON.stringify({ contextData: data.contextData, processing: data.processingMetadata }),
        timestamp: data.timestamp
      } as any;

      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = values.map((_, i) => `$${i + 1}`);

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;
      await this.db.query(query, values);
    } catch (error) {
      // Best effort: log and continue
      console.warn('storeProcessedEvent failed:', error instanceof Error ? error.message : String(error));
    }
  }

  protected mapRowToEntity(row: any): BehaviorEvent {
    return {
      id: row.id,
      userId: row.user_id,
      timestamp: new Date(row.timestamp),
      eventType: row.event_type,
      stepId: row.step_id,
      interactionData: row.interaction_data || {},
      engagementScore: parseFloat(row.engagement_score) || 0,
      contextualData: row.contextual_data || {}
    };
  }

  protected mapEntityToRow(entity: Omit<BehaviorEvent, 'id'>): Record<string, any> {
    return {
      user_id: entity.userId,
      session_id: entity.contextualData?.sessionId || 'unknown',
      journey_id: entity.contextualData?.journeyId,
      step_id: entity.stepId,
      event_type: entity.eventType,
      interaction_data: JSON.stringify(entity.interactionData),
      engagement_score: entity.engagementScore,
      contextual_data: JSON.stringify(entity.contextualData),
      timestamp: entity.timestamp
    };
  }

  // Get recent events for a user
  async getRecentEvents(userId: string, minutes: number = 30): Promise<BehaviorEvent[]> {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    const endTime = new Date();
    
    return this.findByTimeRange(startTime, endTime, { user_id: userId }, 1000);
  }

  // Get events by session
  async getSessionEvents(sessionId: string): Promise<BehaviorEvent[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE session_id = $1 
      ORDER BY timestamp ASC
    `;
    
    const result = await this.db.query(query, [sessionId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  // Get events by journey
  async getJourneyEvents(journeyId: string): Promise<BehaviorEvent[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE journey_id = $1 
      ORDER BY timestamp ASC
    `;
    
    const result = await this.db.query(query, [journeyId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  // Get events by step
  async getStepEvents(stepId: string, limit: number = 100): Promise<BehaviorEvent[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE step_id = $1 
      ORDER BY timestamp DESC
      LIMIT $2
    `;
    
    const result = await this.db.query(query, [stepId, limit]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  // Get engagement metrics over time
  async getEngagementTimeSeries(
    userId: string, 
    startTime: Date, 
    endTime: Date,
    intervalMinutes: number = 5
  ): Promise<Array<{ timestamp: Date; avgEngagement: number; eventCount: number }>> {
    const query = `
      SELECT 
        date_trunc('minute', timestamp) + 
        (EXTRACT(minute FROM timestamp)::int / $4) * interval '${intervalMinutes} minutes' as time_bucket,
        AVG(engagement_score) as avg_engagement,
        COUNT(*) as event_count
      FROM ${this.tableName}
      WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
      GROUP BY time_bucket
      ORDER BY time_bucket
    `;
    
    const result = await this.db.query(query, [userId, startTime, endTime, intervalMinutes]);
    return result.rows.map(row => ({
      timestamp: new Date(row.time_bucket),
      avgEngagement: parseFloat(row.avg_engagement) || 0,
      eventCount: parseInt(row.event_count) || 0
    }));
  }

  // Get event type distribution
  async getEventTypeDistribution(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ eventType: string; count: number; percentage: number }>> {
    const query = `
      WITH event_counts AS (
        SELECT 
          event_type,
          COUNT(*) as count
        FROM ${this.tableName}
        WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
        GROUP BY event_type
      ),
      total_events AS (
        SELECT SUM(count) as total FROM event_counts
      )
      SELECT 
        ec.event_type,
        ec.count,
        ROUND((ec.count::decimal / te.total * 100), 2) as percentage
      FROM event_counts ec
      CROSS JOIN total_events te
      ORDER BY ec.count DESC
    `;
    
    const result = await this.db.query(query, [userId, startTime, endTime]);
    return result.rows.map(row => ({
      eventType: row.event_type,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage)
    }));
  }

  // Get step completion times
  async getStepCompletionTimes(userId: string): Promise<Array<{ stepId: string; avgTime: number; completions: number }>> {
    const query = `
      SELECT 
        step_id,
        AVG(EXTRACT(EPOCH FROM (interaction_data->>'timeSpent')::interval)) as avg_time,
        COUNT(*) as completions
      FROM ${this.tableName}
      WHERE user_id = $1 
        AND event_type = 'step_completed'
        AND interaction_data->>'timeSpent' IS NOT NULL
      GROUP BY step_id
      ORDER BY avg_time DESC
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows.map(row => ({
      stepId: row.step_id,
      avgTime: parseFloat(row.avg_time) || 0,
      completions: parseInt(row.completions)
    }));
  }

  // Get user activity heatmap data
  async getActivityHeatmap(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ hour: number; dayOfWeek: number; activityCount: number }>> {
    const query = `
      SELECT 
        EXTRACT(hour FROM timestamp) as hour,
        EXTRACT(dow FROM timestamp) as day_of_week,
        COUNT(*) as activity_count
      FROM ${this.tableName}
      WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
      GROUP BY hour, day_of_week
      ORDER BY day_of_week, hour
    `;
    
    const result = await this.db.query(query, [userId, startTime, endTime]);
    return result.rows.map(row => ({
      hour: parseInt(row.hour),
      dayOfWeek: parseInt(row.day_of_week),
      activityCount: parseInt(row.activity_count)
    }));
  }

  // Get engagement anomalies
  async getEngagementAnomalies(
    userId: string,
    startTime: Date,
    endTime: Date,
    threshold: number = 0.3
  ): Promise<Array<{ timestamp: Date; engagementScore: number; deviation: number }>> {
    const query = `
      WITH engagement_stats AS (
        SELECT 
          AVG(engagement_score) as avg_engagement,
          STDDEV(engagement_score) as stddev_engagement
        FROM ${this.tableName}
        WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
      )
      SELECT 
        be.timestamp,
        be.engagement_score,
        ABS(be.engagement_score - es.avg_engagement) / NULLIF(es.stddev_engagement, 0) as deviation
      FROM ${this.tableName} be
      CROSS JOIN engagement_stats es
      WHERE be.user_id = $1 
        AND be.timestamp >= $2 
        AND be.timestamp <= $3
        AND ABS(be.engagement_score - es.avg_engagement) / NULLIF(es.stddev_engagement, 0) > $4
      ORDER BY deviation DESC
    `;
    
    const result = await this.db.query(query, [userId, startTime, endTime, threshold]);
    return result.rows.map(row => ({
      timestamp: new Date(row.timestamp),
      engagementScore: parseFloat(row.engagement_score),
      deviation: parseFloat(row.deviation)
    }));
  }

  // Get user interaction patterns
  async getInteractionPatterns(userId: string, days: number = 7): Promise<{
    mouseMovementPatterns: any;
    clickPatterns: any;
    scrollPatterns: any;
    hesitationPatterns: any;
  }> {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endTime = new Date();

    const query = `
      SELECT 
        interaction_data
      FROM ${this.tableName}
      WHERE user_id = $1 
        AND timestamp >= $2 
        AND timestamp <= $3
        AND interaction_data IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT 1000
    `;
    
    const result = await this.db.query(query, [userId, startTime, endTime]);
    
    // Analyze patterns from interaction data
    const mouseMovements: any[] = [];
    const clicks: any[] = [];
    const scrolls: any[] = [];
    const hesitations: any[] = [];

    result.rows.forEach(row => {
      const data = row.interaction_data;
      
      if (data.mouseMovements) {
        mouseMovements.push(...data.mouseMovements);
      }
      
      if (data.clickPatterns) {
        clicks.push(...data.clickPatterns);
      }
      
      if (data.scrollBehavior) {
        scrolls.push(data.scrollBehavior);
      }
      
      if (data.hesitationIndicators) {
        hesitations.push(...data.hesitationIndicators);
      }
    });

    return {
      mouseMovementPatterns: {
        averageVelocity: mouseMovements.length > 0 
          ? mouseMovements.reduce((sum, m) => sum + (m.velocity || 0), 0) / mouseMovements.length 
          : 0,
        totalMovements: mouseMovements.length,
        averageAcceleration: mouseMovements.length > 0
          ? mouseMovements.reduce((sum, m) => sum + (m.acceleration || 0), 0) / mouseMovements.length
          : 0
      },
      clickPatterns: {
        totalClicks: clicks.length,
        averageDuration: clicks.length > 0
          ? clicks.reduce((sum, c) => sum + (c.duration || 0), 0) / clicks.length
          : 0,
        doubleClickRate: clicks.length > 0
          ? clicks.filter(c => c.isDoubleClick).length / clicks.length
          : 0
      },
      scrollPatterns: {
        totalScrolls: scrolls.length,
        averageVelocity: scrolls.length > 0
          ? scrolls.reduce((sum, s) => sum + (s.velocity || 0), 0) / scrolls.length
          : 0,
        averagePauseDuration: scrolls.length > 0
          ? scrolls.reduce((sum, s) => sum + (s.pauseDuration || 0), 0) / scrolls.length
          : 0
      },
      hesitationPatterns: {
        totalHesitations: hesitations.length,
        averageDuration: hesitations.length > 0
          ? hesitations.reduce((sum, h) => sum + (h.duration || 0), 0) / hesitations.length
          : 0,
        mostCommonType: hesitations.length > 0
          ? this.getMostCommonHesitationType(hesitations)
          : null
      }
    };
  }

  private getMostCommonHesitationType(hesitations: any[]): string {
    const typeCounts = hesitations.reduce((counts, h) => {
      counts[h.type] = (counts[h.type] || 0) + 1;
      return counts;
    }, {});

    return Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a] > typeCounts[b] ? a : b
    );
  }

  // Performance optimization: Create indexes for common queries
  async createOptimizationIndexes(): Promise<void> {
    const indexes = [
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_behavior_events_user_timestamp 
       ON ${this.tableName} (user_id, timestamp DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_behavior_events_session 
       ON ${this.tableName} (session_id, timestamp)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_behavior_events_step 
       ON ${this.tableName} (step_id, timestamp DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_behavior_events_engagement 
       ON ${this.tableName} (user_id, engagement_score, timestamp)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_behavior_events_event_type 
       ON ${this.tableName} (event_type, timestamp)`
    ];

    for (const indexQuery of indexes) {
      try {
        await this.db.query(indexQuery);
      } catch (error) {
        console.warn('Index creation warning:', error instanceof Error ? error.message : String(error));
      }
    }
  }
}

// Export repository factory function
import { smartOnboardingDb } from '../config/database';

export const createBehaviorEventsRepository = () => {
  return new BehaviorEventsRepository(smartOnboardingDb.getPool());
};

// Export singleton instance
export const behaviorEventsRepository = createBehaviorEventsRepository();
export default behaviorEventsRepository;
