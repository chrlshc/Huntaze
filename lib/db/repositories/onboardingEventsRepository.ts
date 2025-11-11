import { query } from '../index';

export interface OnboardingEvent {
  id: string;
  user_id: string;
  event_type: string;
  step_id: string | null;
  timestamp: Date;
  duration: number | null;
  metadata: Record<string, any>;
}

export interface CreateEventParams {
  userId: string;
  eventType: string;
  stepId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface AnalyticsMetrics {
  totalEvents: number;
  averageDuration: number;
  completionRate: number;
  dropOffPoints: Array<{
    stepId: string;
    dropOffCount: number;
    dropOffRate: number;
  }>;
  eventsByType: Record<string, number>;
}

export interface DropOffPoint {
  step_id: string;
  started_count: number;
  completed_count: number;
  drop_off_count: number;
  drop_off_rate: number;
}

export const onboardingEventsRepository = {
  /**
   * Create a new onboarding event
   */
  async create({
    userId,
    eventType,
    stepId,
    duration,
    metadata = {}
  }: CreateEventParams): Promise<OnboardingEvent> {
    const result = await query(
      `INSERT INTO onboarding_events (user_id, event_type, step_id, duration, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, eventType, stepId, duration, JSON.stringify(metadata)]
    );
    return result.rows[0];
  },

  /**
   * Find all events for a specific user
   */
  async findByUserId(userId: string, limit = 100): Promise<OnboardingEvent[]> {
    const result = await query(
      `SELECT * FROM onboarding_events 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  /**
   * Find events by type for a user
   */
  async findByUserIdAndType(
    userId: string,
    eventType: string,
    limit = 50
  ): Promise<OnboardingEvent[]> {
    const result = await query(
      `SELECT * FROM onboarding_events 
       WHERE user_id = $1 AND event_type = $2
       ORDER BY timestamp DESC 
       LIMIT $3`,
      [userId, eventType, limit]
    );
    return result.rows;
  },

  /**
   * Get analytics for a specific user
   */
  async getUserAnalytics(userId: string): Promise<AnalyticsMetrics> {
    // Get total events
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM onboarding_events WHERE user_id = $1`,
      [userId]
    );

    // Get average duration
    const durationResult = await query(
      `SELECT AVG(duration) as avg_duration 
       FROM onboarding_events 
       WHERE user_id = $1 AND duration IS NOT NULL`,
      [userId]
    );

    // Get events by type
    const eventsByTypeResult = await query(
      `SELECT event_type, COUNT(*) as count 
       FROM onboarding_events 
       WHERE user_id = $1 
       GROUP BY event_type`,
      [userId]
    );

    // Check if onboarding is completed
    const completionResult = await query(
      `SELECT EXISTS(
         SELECT 1 FROM onboarding_events 
         WHERE user_id = $1 AND event_type = 'onboarding_completed'
       ) as is_completed`,
      [userId]
    );

    const eventsByType: Record<string, number> = {};
    eventsByTypeResult.rows.forEach(row => {
      eventsByType[row.event_type] = parseInt(row.count);
    });

    return {
      totalEvents: parseInt(totalResult.rows[0].total),
      averageDuration: parseFloat(durationResult.rows[0].avg_duration) || 0,
      completionRate: completionResult.rows[0].is_completed ? 1 : 0,
      dropOffPoints: [], // Calculated separately for all users
      eventsByType
    };
  },

  /**
   * Get aggregated analytics across all users
   */
  async getAnalytics(startDate?: Date, endDate?: Date): Promise<AnalyticsMetrics> {
    const dateFilter = startDate && endDate
      ? `WHERE timestamp BETWEEN $1 AND $2`
      : '';
    const params = startDate && endDate ? [startDate, endDate] : [];

    // Total events
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM onboarding_events ${dateFilter}`,
      params
    );

    // Average duration
    const durationResult = await query(
      `SELECT AVG(duration) as avg_duration 
       FROM onboarding_events 
       ${dateFilter} ${dateFilter ? 'AND' : 'WHERE'} duration IS NOT NULL`,
      params
    );

    // Completion rate
    const completionResult = await query(
      `SELECT 
         COUNT(DISTINCT CASE WHEN event_type = 'onboarding_started' THEN user_id END) as started,
         COUNT(DISTINCT CASE WHEN event_type = 'onboarding_completed' THEN user_id END) as completed
       FROM onboarding_events ${dateFilter}`,
      params
    );

    // Events by type
    const eventsByTypeResult = await query(
      `SELECT event_type, COUNT(*) as count 
       FROM onboarding_events ${dateFilter}
       GROUP BY event_type`,
      params
    );

    const started = parseInt(completionResult.rows[0].started) || 1;
    const completed = parseInt(completionResult.rows[0].completed) || 0;

    const eventsByType: Record<string, number> = {};
    eventsByTypeResult.rows.forEach(row => {
      eventsByType[row.event_type] = parseInt(row.count);
    });

    // Get drop-off points
    const dropOffPoints = await this.getDropOffPoints(startDate, endDate);

    return {
      totalEvents: parseInt(totalResult.rows[0].total),
      averageDuration: parseFloat(durationResult.rows[0].avg_duration) || 0,
      completionRate: completed / started,
      dropOffPoints: dropOffPoints.map(point => ({
        stepId: point.step_id,
        dropOffCount: point.drop_off_count,
        dropOffRate: point.drop_off_rate
      })),
      eventsByType
    };
  },

  /**
   * Get drop-off points in the onboarding flow
   */
  async getDropOffPoints(startDate?: Date, endDate?: Date): Promise<DropOffPoint[]> {
    const dateFilter = startDate && endDate
      ? `WHERE timestamp BETWEEN $1 AND $2`
      : '';
    const params = startDate && endDate ? [startDate, endDate] : [];

    const result = await query(
      `WITH step_events AS (
         SELECT 
           step_id,
           user_id,
           event_type
         FROM onboarding_events
         ${dateFilter}
         WHERE step_id IS NOT NULL
       ),
       step_stats AS (
         SELECT 
           step_id,
           COUNT(DISTINCT CASE WHEN event_type = 'step_started' THEN user_id END) as started_count,
           COUNT(DISTINCT CASE WHEN event_type = 'step_completed' THEN user_id END) as completed_count
         FROM step_events
         GROUP BY step_id
       )
       SELECT 
         step_id,
         started_count,
         completed_count,
         (started_count - completed_count) as drop_off_count,
         CASE 
           WHEN started_count > 0 
           THEN ROUND((started_count - completed_count)::numeric / started_count::numeric, 4)
           ELSE 0 
         END as drop_off_rate
       FROM step_stats
       WHERE started_count > completed_count
       ORDER BY drop_off_rate DESC`,
      params
    );

    return result.rows;
  },

  /**
   * Get time spent on each step (average across all users)
   */
  async getAverageStepDurations(): Promise<Array<{ stepId: string; avgDuration: number }>> {
    const result = await query(
      `SELECT 
         step_id,
         AVG(duration) as avg_duration
       FROM onboarding_events
       WHERE step_id IS NOT NULL AND duration IS NOT NULL
       GROUP BY step_id
       ORDER BY avg_duration DESC`
    );

    return result.rows.map(row => ({
      stepId: row.step_id,
      avgDuration: parseFloat(row.avg_duration)
    }));
  },

  /**
   * Get events within a time range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<OnboardingEvent[]> {
    const result = await query(
      `SELECT * FROM onboarding_events 
       WHERE timestamp BETWEEN $1 AND $2
       ORDER BY timestamp DESC`,
      [startDate, endDate]
    );
    return result.rows;
  },

  /**
   * Delete all events for a user (for testing or user deletion)
   */
  async deleteByUserId(userId: string): Promise<void> {
    await query(
      `DELETE FROM onboarding_events WHERE user_id = $1`,
      [userId]
    );
  },

  /**
   * Get the most recent event for a user
   */
  async getLatestEvent(userId: string): Promise<OnboardingEvent | null> {
    const result = await query(
      `SELECT * FROM onboarding_events 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  /**
   * Count events by type for a user
   */
  async countEventsByType(userId: string, eventType: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM onboarding_events 
       WHERE user_id = $1 AND event_type = $2`,
      [userId, eventType]
    );
    return parseInt(result.rows[0].count);
  }
};
