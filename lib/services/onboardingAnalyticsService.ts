interface OnboardingEvent {
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface OnboardingMetrics {
  totalUsers: number;
  completedUsers: number;
  completionRate: number;
  averageCompletionTime: number;
  dropOffPoints: Array<{
    step: string;
    dropOffRate: number;
    usersReached: number;
    usersCompleted: number;
  }>;
  levelDistribution: Record<string, number>;
  featureUnlockRates: Record<string, number>;
}

interface StepAnalytics {
  stepName: string;
  totalViews: number;
  completions: number;
  completionRate: number;
  averageTimeSpent: number;
  commonExitPoints: string[];
  errorRate: number;
}

export class OnboardingAnalyticsService {
  private onboardingEventsRepo: any;
  private onboardingProfileRepo: any;
  private featureUnlockRepo: any;

  constructor(
    onboardingEventsRepo: any,
    onboardingProfileRepo: any,
    featureUnlockRepo: any
  ) {
    this.onboardingEventsRepo = onboardingEventsRepo;
    this.onboardingProfileRepo = onboardingProfileRepo;
    this.featureUnlockRepo = featureUnlockRepo;
  }

  // Track onboarding events
  async trackEvent(event: OnboardingEvent): Promise<void> {
    try {
      await this.onboardingEventsRepo.create({
        user_id: event.userId,
        event_type: event.eventType,
        event_data: event.eventData,
        timestamp: event.timestamp,
        session_id: event.sessionId,
        user_agent: event.userAgent,
        ip_address: event.ipAddress
      });

      // Update real-time metrics if needed
      await this.updateRealTimeMetrics(event);
    } catch (error) {
      console.error('Failed to track onboarding event:', error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  // Track onboarding start
  async trackOnboardingStart(userId: string, sessionId: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'onboarding_started',
      eventData: {
        ...metadata,
        startTime: new Date().toISOString()
      },
      timestamp: new Date(),
      sessionId
    });
  }

  // Track step completion
  async trackStepCompletion(
    userId: string, 
    stepName: string, 
    stepData: Record<string, any> = {},
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'step_completed',
      eventData: {
        stepName,
        ...stepData,
        completedAt: new Date().toISOString()
      },
      timestamp: new Date(),
      sessionId
    });
  }

  // Track step start
  async trackStepStart(
    userId: string, 
    stepName: string, 
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'step_started',
      eventData: {
        stepName,
        startedAt: new Date().toISOString()
      },
      timestamp: new Date(),
      sessionId
    });
  }

  // Track feature unlock
  async trackFeatureUnlock(
    userId: string, 
    featureName: string, 
    unlockLevel: string,
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'feature_unlocked',
      eventData: {
        featureName,
        unlockLevel,
        unlockedAt: new Date().toISOString()
      },
      timestamp: new Date(),
      sessionId
    });
  }

  // Track onboarding completion
  async trackOnboardingCompletion(
    userId: string, 
    completionData: Record<string, any> = {},
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'onboarding_completed',
      eventData: {
        ...completionData,
        completedAt: new Date().toISOString()
      },
      timestamp: new Date(),
      sessionId
    });
  }

  // Track user drop-off
  async trackDropOff(
    userId: string, 
    stepName: string, 
    reason?: string,
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'onboarding_dropped_off',
      eventData: {
        stepName,
        reason,
        droppedOffAt: new Date().toISOString()
      },
      timestamp: new Date(),
      sessionId
    });
  }

  // Track errors
  async trackError(
    userId: string, 
    errorType: string, 
    errorMessage: string, 
    stepName?: string,
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'onboarding_error',
      eventData: {
        errorType,
        errorMessage,
        stepName,
        occurredAt: new Date().toISOString()
      },
      timestamp: new Date(),
      sessionId
    });
  }

  // Get overall onboarding metrics
  async getOnboardingMetrics(dateRange?: { start: Date; end: Date }): Promise<OnboardingMetrics> {
    const whereClause = dateRange 
      ? `WHERE created_at >= $1 AND created_at <= $2`
      : '';
    const params = dateRange ? [dateRange.start, dateRange.end] : [];

    // Get total users who started onboarding
    const totalUsersResult = await this.onboardingProfileRepo.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM onboarding_profiles ${whereClause}`,
      params
    );
    const totalUsers = parseInt(totalUsersResult[0]?.count || '0');

    // Get completed users
    const completedUsersResult = await this.onboardingProfileRepo.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM onboarding_profiles 
       WHERE completion_percentage = 100 ${dateRange ? 'AND updated_at >= $1 AND updated_at <= $2' : ''}`,
      params
    );
    const completedUsers = parseInt(completedUsersResult[0]?.count || '0');

    // Calculate completion rate
    const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;

    // Get average completion time
    const avgTimeResult = await this.onboardingEventsRepo.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (completed.timestamp - started.timestamp))) as avg_seconds
      FROM onboarding_events started
      JOIN onboarding_events completed ON started.user_id = completed.user_id
      WHERE started.event_type = 'onboarding_started' 
        AND completed.event_type = 'onboarding_completed'
        ${dateRange ? 'AND started.timestamp >= $1 AND started.timestamp <= $2' : ''}
    `, params);
    const averageCompletionTime = parseFloat(avgTimeResult[0]?.avg_seconds || '0');

    // Get drop-off points
    const dropOffPoints = await this.getDropOffAnalytics(dateRange);

    // Get level distribution
    const levelDistResult = await this.onboardingProfileRepo.query(
      `SELECT current_level, COUNT(*) as count FROM onboarding_profiles 
       ${whereClause} GROUP BY current_level`,
      params
    );
    const levelDistribution = levelDistResult.reduce((acc: Record<string, number>, row: any) => {
      acc[row.current_level] = parseInt(row.count);
      return acc;
    }, {});

    // Get feature unlock rates
    const featureUnlockRates = await this.getFeatureUnlockRates(dateRange);

    return {
      totalUsers,
      completedUsers,
      completionRate,
      averageCompletionTime,
      dropOffPoints,
      levelDistribution,
      featureUnlockRates
    };
  }

  // Get step-specific analytics
  async getStepAnalytics(stepName: string, dateRange?: { start: Date; end: Date }): Promise<StepAnalytics> {
    const whereClause = dateRange 
      ? `AND timestamp >= $2 AND timestamp <= $3`
      : '';
    const params = [stepName, ...(dateRange ? [dateRange.start, dateRange.end] : [])];

    // Get total views (step_started events)
    const viewsResult = await this.onboardingEventsRepo.query(
      `SELECT COUNT(*) as count FROM onboarding_events 
       WHERE event_type = 'step_started' AND event_data->>'stepName' = $1 ${whereClause}`,
      params
    );
    const totalViews = parseInt(viewsResult[0]?.count || '0');

    // Get completions (step_completed events)
    const completionsResult = await this.onboardingEventsRepo.query(
      `SELECT COUNT(*) as count FROM onboarding_events 
       WHERE event_type = 'step_completed' AND event_data->>'stepName' = $1 ${whereClause}`,
      params
    );
    const completions = parseInt(completionsResult[0]?.count || '0');

    // Calculate completion rate
    const completionRate = totalViews > 0 ? (completions / totalViews) * 100 : 0;

    // Get average time spent
    const avgTimeResult = await this.onboardingEventsRepo.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (completed.timestamp - started.timestamp))) as avg_seconds
      FROM onboarding_events started
      JOIN onboarding_events completed ON started.user_id = completed.user_id
      WHERE started.event_type = 'step_started' 
        AND completed.event_type = 'step_completed'
        AND started.event_data->>'stepName' = $1
        AND completed.event_data->>'stepName' = $1
        ${whereClause.replace('AND timestamp', 'AND started.timestamp')}
    `, params);
    const averageTimeSpent = parseFloat(avgTimeResult[0]?.avg_seconds || '0');

    // Get common exit points (where users drop off from this step)
    const exitPointsResult = await this.onboardingEventsRepo.query(`
      SELECT event_data->>'stepName' as exit_step, COUNT(*) as count
      FROM onboarding_events 
      WHERE event_type = 'onboarding_dropped_off' 
        AND event_data->>'stepName' = $1 ${whereClause}
      GROUP BY event_data->>'stepName'
      ORDER BY count DESC
      LIMIT 5
    `, params);
    const commonExitPoints = exitPointsResult.map((row: any) => row.exit_step);

    // Get error rate
    const errorsResult = await this.onboardingEventsRepo.query(
      `SELECT COUNT(*) as count FROM onboarding_events 
       WHERE event_type = 'onboarding_error' AND event_data->>'stepName' = $1 ${whereClause}`,
      params
    );
    const errors = parseInt(errorsResult[0]?.count || '0');
    const errorRate = totalViews > 0 ? (errors / totalViews) * 100 : 0;

    return {
      stepName,
      totalViews,
      completions,
      completionRate,
      averageTimeSpent,
      commonExitPoints,
      errorRate
    };
  }

  // Get drop-off analytics
  private async getDropOffAnalytics(dateRange?: { start: Date; end: Date }): Promise<Array<{
    step: string;
    dropOffRate: number;
    usersReached: number;
    usersCompleted: number;
  }>> {
    const whereClause = dateRange 
      ? `WHERE timestamp >= $1 AND timestamp <= $2`
      : '';
    const params = dateRange ? [dateRange.start, dateRange.end] : [];

    const result = await this.onboardingEventsRepo.query(`
      WITH step_stats AS (
        SELECT 
          event_data->>'stepName' as step,
          COUNT(CASE WHEN event_type = 'step_started' THEN 1 END) as users_reached,
          COUNT(CASE WHEN event_type = 'step_completed' THEN 1 END) as users_completed
        FROM onboarding_events 
        ${whereClause}
        GROUP BY event_data->>'stepName'
      )
      SELECT 
        step,
        users_reached,
        users_completed,
        CASE 
          WHEN users_reached > 0 
          THEN ((users_reached - users_completed)::float / users_reached * 100)
          ELSE 0 
        END as drop_off_rate
      FROM step_stats
      WHERE step IS NOT NULL
      ORDER BY drop_off_rate DESC
    `, params);

    return result.map((row: any) => ({
      step: row.step,
      dropOffRate: parseFloat(row.drop_off_rate || '0'),
      usersReached: parseInt(row.users_reached || '0'),
      usersCompleted: parseInt(row.users_completed || '0')
    }));
  }

  // Get feature unlock rates
  private async getFeatureUnlockRates(dateRange?: { start: Date; end: Date }): Promise<Record<string, number>> {
    const whereClause = dateRange 
      ? `WHERE unlocked_at >= $1 AND unlocked_at <= $2`
      : '';
    const params = dateRange ? [dateRange.start, dateRange.end] : [];

    const result = await this.featureUnlockRepo.query(
      `SELECT feature_name, COUNT(*) as unlock_count FROM feature_unlocks 
       ${whereClause} GROUP BY feature_name`,
      params
    );

    return result.reduce((acc: Record<string, number>, row: any) => {
      acc[row.feature_name] = parseInt(row.unlock_count);
      return acc;
    }, {});
  }

  // Update real-time metrics (for dashboards)
  private async updateRealTimeMetrics(event: OnboardingEvent): Promise<void> {
    // This could update Redis counters or other real-time storage
    // for live dashboard updates
    try {
      // Example: Update Redis counters
      // await redis.incr(`onboarding:events:${event.eventType}:count`);
      // await redis.incr(`onboarding:events:daily:${new Date().toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Failed to update real-time metrics:', error);
    }
  }

  // Get real-time dashboard data
  async getRealTimeDashboardData(): Promise<{
    activeUsers: number;
    todayCompletions: number;
    currentCompletionRate: number;
    recentEvents: OnboardingEvent[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get active users (users who had events in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeUsersResult = await this.onboardingEventsRepo.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM onboarding_events 
       WHERE timestamp >= $1`,
      [oneHourAgo]
    );
    const activeUsers = parseInt(activeUsersResult[0]?.count || '0');

    // Get today's completions
    const todayCompletionsResult = await this.onboardingEventsRepo.query(
      `SELECT COUNT(*) as count FROM onboarding_events 
       WHERE event_type = 'onboarding_completed' AND timestamp >= $1 AND timestamp < $2`,
      [today, tomorrow]
    );
    const todayCompletions = parseInt(todayCompletionsResult[0]?.count || '0');

    // Get current completion rate (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const metrics = await this.getOnboardingMetrics({ start: sevenDaysAgo, end: new Date() });

    // Get recent events
    const recentEventsResult = await this.onboardingEventsRepo.query(
      `SELECT user_id, event_type, event_data, timestamp 
       FROM onboarding_events 
       ORDER BY timestamp DESC 
       LIMIT 10`
    );
    const recentEvents = recentEventsResult.map((row: any) => ({
      userId: row.user_id,
      eventType: row.event_type,
      eventData: row.event_data,
      timestamp: row.timestamp
    }));

    return {
      activeUsers,
      todayCompletions,
      currentCompletionRate: metrics.completionRate,
      recentEvents
    };
  }
}