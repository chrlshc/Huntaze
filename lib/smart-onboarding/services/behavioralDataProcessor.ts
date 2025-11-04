import { BehaviorEvent, ProcessedBehaviorData, DataValidationResult, EnrichmentContext } from '../types';
import { behaviorEventsRepository } from '../repositories/behaviorEventsRepository';
import { redisClient } from '../config/redis';
import { logger } from '../../utils/logger';

interface DataProcessingPipeline {
  validate: (event: BehaviorEvent) => Promise<DataValidationResult>;
  enrich: (event: BehaviorEvent, context: EnrichmentContext) => Promise<BehaviorEvent>;
  transform: (event: BehaviorEvent) => Promise<ProcessedBehaviorData>;
  store: (data: ProcessedBehaviorData) => Promise<void>;
}

interface ProcessingMetrics {
  eventsProcessed: number;
  validationErrors: number;
  enrichmentFailures: number;
  storageErrors: number;
  averageProcessingTime: number;
  lastProcessedAt: Date;
}

export class BehavioralDataProcessor implements DataProcessingPipeline {
  private processingQueue: BehaviorEvent[] = [];
  private isProcessing = false;
  private metrics: ProcessingMetrics = {
    eventsProcessed: 0,
    validationErrors: 0,
    enrichmentFailures: 0,
    storageErrors: 0,
    averageProcessingTime: 0,
    lastProcessedAt: new Date()
  };

  constructor(
    private batchSize: number = 100,
    private processingInterval: number = 1000 // 1 second
  ) {
    this.startProcessingLoop();
  }

  /**
   * Add behavioral event to processing queue
   */
  async queueEvent(event: BehaviorEvent): Promise<void> {
    try {
      // Add timestamp if not present
      if (!event.timestamp) {
        event.timestamp = new Date();
      }

      // Add to processing queue
      this.processingQueue.push(event);

      // Cache recent event for real-time access
      await this.cacheRecentEvent(event);

      logger.info('Behavioral event queued for processing', {
        userId: event.userId,
        eventType: event.eventType,
        queueSize: this.processingQueue.length
      });
    } catch (error) {
      logger.error('Failed to queue behavioral event', { error, event });
      throw error;
    }
  }

  /**
   * Process events in batches
   */
  private async startProcessingLoop(): Promise<void> {
    setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        await this.processBatch();
      }
    }, this.processingInterval);
  }

  /**
   * Process a batch of events
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Get batch of events to process
      const batch = this.processingQueue.splice(0, this.batchSize);
      
      logger.info('Processing behavioral data batch', {
        batchSize: batch.length,
        queueRemaining: this.processingQueue.length
      });

      // Process events in parallel
      const processingPromises = batch.map(event => this.processEvent(event));
      const results = await Promise.allSettled(processingPromises);

      // Update metrics
      this.updateMetrics(results, Date.now() - startTime);

      logger.info('Batch processing completed', {
        processed: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('Batch processing failed', { error });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual behavioral event
   */
  private async processEvent(event: BehaviorEvent): Promise<ProcessedBehaviorData> {
    try {
      // Step 1: Validate event data
      const validationResult = await this.validate(event);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Step 2: Enrich event with contextual data
      const enrichmentContext = await this.buildEnrichmentContext(event);
      const enrichedEvent = await this.enrich(event, enrichmentContext);

      // Step 3: Transform to processed format
      const processedData = await this.transform(enrichedEvent);

      // Step 4: Store processed data
      await this.store(processedData);

      return processedData;

    } catch (error) {
      logger.error('Event processing failed', { error, eventId: event.id });
      throw error;
    }
  }

  /**
   * Validate behavioral event data
   */
  async validate(event: BehaviorEvent): Promise<DataValidationResult> {
    const errors: string[] = [];

    try {
      // Required fields validation
      if (!event.id) errors.push('Event ID is required');
      if (!event.userId) errors.push('User ID is required');
      if (!event.eventType) errors.push('Event type is required');
      if (!event.timestamp) errors.push('Timestamp is required');

      // Data type validation
      if (event.timestamp && !(event.timestamp instanceof Date)) {
        errors.push('Timestamp must be a valid Date object');
      }

      // Interaction data validation
      if (event.interactionData) {
        if (event.interactionData.timeSpent < 0) {
          errors.push('Time spent cannot be negative');
        }
        
        if (event.interactionData.engagementScore < 0 || event.interactionData.engagementScore > 100) {
          errors.push('Engagement score must be between 0 and 100');
        }
      }

      // Business logic validation
      const timeDiff = Date.now() - event.timestamp.getTime();
      if (timeDiff > 24 * 60 * 60 * 1000) { // 24 hours
        errors.push('Event timestamp is too old (>24 hours)');
      }

      return {
        isValid: errors.length === 0,
        errors,
        validatedAt: new Date()
      };

    } catch (error) {
      logger.error('Event validation error', { error, eventId: event.id });
      return {
        isValid: false,
        errors: ['Validation process failed'],
        validatedAt: new Date()
      };
    }
  }

  /**
   * Enrich event with contextual data
   */
  async enrich(event: BehaviorEvent, context: EnrichmentContext): Promise<BehaviorEvent> {
    try {
      const enrichedEvent = { ...event };

      // Add session context
      if (context.sessionData) {
        enrichedEvent.sessionContext = {
          sessionId: context.sessionData.sessionId,
          sessionDuration: context.sessionData.duration,
          previousSteps: context.sessionData.completedSteps,
          userAgent: context.sessionData.userAgent,
          deviceType: context.sessionData.deviceType
        };
      }

      // Add user profile context
      if (context.userProfile) {
        enrichedEvent.userContext = {
          technicalProficiency: context.userProfile.technicalProficiency,
          learningStyle: context.userProfile.learningStyle,
          platformPreferences: context.userProfile.platformPreferences,
          previousExperience: context.userProfile.previousExperience
        };
      }

      // Add temporal context
      enrichedEvent.temporalContext = {
        dayOfWeek: event.timestamp.getDay(),
        hourOfDay: event.timestamp.getHours(),
        isWeekend: event.timestamp.getDay() === 0 || event.timestamp.getDay() === 6,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Calculate derived metrics
      if (event.interactionData) {
        enrichedEvent.derivedMetrics = await this.calculateDerivedMetrics(event, context);
      }

      return enrichedEvent;

    } catch (error) {
      logger.error('Event enrichment failed', { error, eventId: event.id });
      throw error;
    }
  }

  /**
   * Transform event to processed data format
   */
  async transform(event: BehaviorEvent): Promise<ProcessedBehaviorData> {
    try {
      return {
        id: event.id,
        userId: event.userId,
        sessionId: event.sessionContext?.sessionId || 'unknown',
        timestamp: event.timestamp,
        eventType: event.eventType,
        stepId: event.stepId,
        
        // Interaction metrics
        interactionMetrics: {
          timeSpent: event.interactionData?.timeSpent || 0,
          clickCount: event.interactionData?.clickPatterns?.length || 0,
          scrollDistance: event.interactionData?.scrollBehavior?.totalDistance || 0,
          hesitationTime: event.derivedMetrics?.hesitationTime || 0,
          engagementScore: event.interactionData?.engagementScore || 0
        },

        // Behavioral indicators
        behavioralIndicators: {
          isStruggling: event.derivedMetrics?.isStruggling || false,
          confidenceLevel: event.derivedMetrics?.confidenceLevel || 'medium',
          attentionLevel: event.derivedMetrics?.attentionLevel || 'normal',
          learningVelocity: event.derivedMetrics?.learningVelocity || 'average'
        },

        // Context data
        contextData: {
          deviceType: event.sessionContext?.deviceType || 'unknown',
          userAgent: event.sessionContext?.userAgent || 'unknown',
          technicalProficiency: event.userContext?.technicalProficiency || 'beginner',
          learningStyle: event.userContext?.learningStyle || 'visual',
          timeOfDay: event.temporalContext?.hourOfDay || 0,
          dayOfWeek: event.temporalContext?.dayOfWeek || 0
        },

        // Processing metadata
        processingMetadata: {
          processedAt: new Date(),
          enrichmentVersion: '1.0',
          validationPassed: true,
          dataQualityScore: event.derivedMetrics?.dataQualityScore || 0.8
        }
      };

    } catch (error) {
      logger.error('Event transformation failed', { error, eventId: event.id });
      throw error;
    }
  }

  /**
   * Store processed data
   */
  async store(data: ProcessedBehaviorData): Promise<void> {
    try {
      // Store in time-series database for analytics
      await behaviorEventsRepository.storeProcessedEvent(data);

      // Update real-time aggregations in Redis
      await this.updateRealTimeAggregations(data);

      // Store in data warehouse for ML training (batch process)
      await this.queueForDataWarehouse(data);

      logger.debug('Processed behavioral data stored', {
        userId: data.userId,
        eventType: data.eventType,
        processingTime: Date.now() - data.timestamp.getTime()
      });

    } catch (error) {
      logger.error('Failed to store processed data', { error, dataId: data.id });
      throw error;
    }
  }

  /**
   * Build enrichment context for event
   */
  private async buildEnrichmentContext(event: BehaviorEvent): Promise<EnrichmentContext> {
    try {
      // Get session data from cache
      const sessionData = await redisClient.get(`session:${event.userId}`);
      
      // Get user profile from cache or database
      const userProfile = await redisClient.get(`user_profile:${event.userId}`);

      return {
        sessionData: sessionData ? JSON.parse(sessionData) : null,
        userProfile: userProfile ? JSON.parse(userProfile) : null,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Failed to build enrichment context', { error, userId: event.userId });
      return { timestamp: new Date() };
    }
  }

  /**
   * Calculate derived metrics from event data
   */
  private async calculateDerivedMetrics(event: BehaviorEvent, context: EnrichmentContext): Promise<any> {
    try {
      const metrics: any = {};

      // Calculate hesitation time from mouse movements
      if (event.interactionData?.mouseMovements) {
        metrics.hesitationTime = this.calculateHesitationTime(event.interactionData.mouseMovements);
      }

      // Determine if user is struggling
      metrics.isStruggling = this.detectStruggleIndicators(event);

      // Calculate confidence level
      metrics.confidenceLevel = this.assessConfidenceLevel(event);

      // Determine attention level
      metrics.attentionLevel = this.assessAttentionLevel(event);

      // Calculate learning velocity
      metrics.learningVelocity = await this.calculateLearningVelocity(event, context);

      // Data quality score
      metrics.dataQualityScore = this.calculateDataQualityScore(event);

      return metrics;

    } catch (error) {
      logger.error('Failed to calculate derived metrics', { error, eventId: event.id });
      return {};
    }
  }

  /**
   * Cache recent event for real-time access
   */
  private async cacheRecentEvent(event: BehaviorEvent): Promise<void> {
    try {
      const cacheKey = `recent_events:${event.userId}`;
      const eventData = JSON.stringify({
        id: event.id,
        eventType: event.eventType,
        timestamp: event.timestamp,
        engagementScore: event.interactionData?.engagementScore
      });

      // Add to sorted set with timestamp as score
      await redisClient.zadd(cacheKey, event.timestamp.getTime(), eventData);
      
      // Keep only last 100 events
      await redisClient.zremrangebyrank(cacheKey, 0, -101);
      
      // Set expiration
      await redisClient.expire(cacheKey, 3600); // 1 hour

    } catch (error) {
      logger.error('Failed to cache recent event', { error, eventId: event.id });
    }
  }

  /**
   * Update real-time aggregations
   */
  private async updateRealTimeAggregations(data: ProcessedBehaviorData): Promise<void> {
    try {
      const aggregationKey = `aggregations:${data.userId}:${data.sessionId}`;
      
      // Update session aggregations
      await redisClient.hincrby(aggregationKey, 'total_events', 1);
      await redisClient.hincrby(aggregationKey, 'total_time_spent', data.interactionMetrics.timeSpent);
      await redisClient.hincrby(aggregationKey, 'total_clicks', data.interactionMetrics.clickCount);
      
      // Update engagement score (running average)
      const currentAvg = await redisClient.hget(aggregationKey, 'avg_engagement') || '0';
      const currentCount = await redisClient.hget(aggregationKey, 'total_events') || '1';
      const newAvg = (parseFloat(currentAvg) * (parseInt(currentCount) - 1) + data.interactionMetrics.engagementScore) / parseInt(currentCount);
      await redisClient.hset(aggregationKey, 'avg_engagement', newAvg.toString());
      
      // Set expiration
      await redisClient.expire(aggregationKey, 7200); // 2 hours

    } catch (error) {
      logger.error('Failed to update real-time aggregations', { error, dataId: data.id });
    }
  }

  /**
   * Queue data for data warehouse storage
   */
  private async queueForDataWarehouse(data: ProcessedBehaviorData): Promise<void> {
    try {
      const warehouseQueue = 'data_warehouse_queue';
      const queueData = JSON.stringify({
        ...data,
        queuedAt: new Date()
      });

      await redisClient.lpush(warehouseQueue, queueData);

    } catch (error) {
      logger.error('Failed to queue for data warehouse', { error, dataId: data.id });
    }
  }

  /**
   * Helper methods for metric calculations
   */
  private calculateHesitationTime(mouseMovements: any[]): number {
    // Implementation for calculating hesitation time from mouse movements
    return mouseMovements.reduce((total, movement) => {
      return total + (movement.pauseDuration || 0);
    }, 0);
  }

  private detectStruggleIndicators(event: BehaviorEvent): boolean {
    const indicators = event.interactionData?.hesitationIndicators || [];
    return indicators.length > 3 || (event.interactionData?.timeSpent || 0) > 300; // 5 minutes
  }

  private assessConfidenceLevel(event: BehaviorEvent): string {
    const engagementScore = event.interactionData?.engagementScore || 0;
    if (engagementScore > 80) return 'high';
    if (engagementScore > 60) return 'medium';
    return 'low';
  }

  private assessAttentionLevel(event: BehaviorEvent): string {
    const scrollBehavior = event.interactionData?.scrollBehavior;
    if (!scrollBehavior) return 'normal';
    
    if (scrollBehavior.rapidScrolling) return 'distracted';
    if (scrollBehavior.focusedReading) return 'focused';
    return 'normal';
  }

  private async calculateLearningVelocity(event: BehaviorEvent, context: EnrichmentContext): Promise<string> {
    // Compare with average time for similar users
    const avgTime = 120; // seconds - would come from historical data
    const userTime = event.interactionData?.timeSpent || 0;
    
    if (userTime < avgTime * 0.7) return 'fast';
    if (userTime > avgTime * 1.3) return 'slow';
    return 'average';
  }

  private calculateDataQualityScore(event: BehaviorEvent): number {
    let score = 1.0;
    
    // Reduce score for missing data
    if (!event.interactionData) score -= 0.3;
    if (!event.interactionData?.mouseMovements?.length) score -= 0.1;
    if (!event.interactionData?.clickPatterns?.length) score -= 0.1;
    
    return Math.max(0, score);
  }

  /**
   * Update processing metrics
   */
  private updateMetrics(results: PromiseSettledResult<ProcessedBehaviorData>[], processingTime: number): void {
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.metrics.eventsProcessed += successful;
    this.metrics.validationErrors += failed;
    this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime + processingTime) / 2;
    this.metrics.lastProcessedAt = new Date();
  }

  /**
   * Get processing metrics
   */
  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { queueSize: number; isProcessing: boolean } {
    return {
      queueSize: this.processingQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

export const behavioralDataProcessor = new BehavioralDataProcessor();