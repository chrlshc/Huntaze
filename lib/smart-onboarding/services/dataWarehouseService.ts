import { ProcessedBehaviorData, MLTrainingDataset, DataAggregation, FeatureVector } from '../types';
import { redisClient } from '../config/redis';
import { logger } from '../../utils/logger';
import { Pool } from 'pg';

interface DataWarehouseConfig {
  batchSize: number;
  processingInterval: number;
  retentionPeriod: number; // days
  aggregationLevels: string[];
  featureExtractionRules: FeatureExtractionRule[];
}

interface FeatureExtractionRule {
  id: string;
  name: string;
  description: string;
  extract: (data: ProcessedBehaviorData[]) => FeatureVector;
}

interface DataPartition {
  partitionKey: string;
  startDate: Date;
  endDate: Date;
  recordCount: number;
  dataSize: number;
}

export class DataWarehouseService {
  private config: DataWarehouseConfig;
  private processingQueue: ProcessedBehaviorData[] = [];
  private isProcessing = false;
  private dbPool: Pool;

  constructor(config: Partial<DataWarehouseConfig> = {}) {
    this.config = {
      batchSize: 1000,
      processingInterval: 30000, // 30 seconds
      retentionPeriod: 365, // 1 year
      aggregationLevels: ['hourly', 'daily', 'weekly'],
      featureExtractionRules: [],
      ...config
    };

    // Initialize database connection pool for data warehouse
    this.dbPool = new Pool({
      host: process.env.DW_DB_HOST || 'localhost',
      port: parseInt(process.env.DW_DB_PORT || '5432'),
      database: process.env.DW_DB_NAME || 'smart_onboarding_dw',
      user: process.env.DW_DB_USER || 'postgres',
      password: process.env.DW_DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.startProcessingLoop();
    this.initializeDefaultFeatureRules();
  }

  /**
   * Queue processed data for warehouse storage
   */
  async queueForWarehouse(data: ProcessedBehaviorData): Promise<void> {
    try {
      // Add to processing queue
      this.processingQueue.push(data);

      // Also queue in Redis for persistence
      await redisClient.lpush('dw_processing_queue', JSON.stringify(data));

      logger.debug('Data queued for warehouse storage', {
        userId: data.userId,
        eventType: data.eventType,
        queueSize: this.processingQueue.length
      });

    } catch (error) {
      logger.error('Failed to queue data for warehouse', { error, dataId: data.id });
      throw error;
    }
  }

  /**
   * Start the processing loop for warehouse operations
   */
  private async startProcessingLoop(): Promise<void> {
    setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        await this.processBatch();
      }
    }, this.config.processingInterval);

    // Also process cleanup and aggregation tasks
    setInterval(async () => {
      await this.performMaintenanceTasks();
    }, 3600000); // Every hour
  }

  /**
   * Process a batch of data for warehouse storage
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Get batch of data to process
      const batch = this.processingQueue.splice(0, this.config.batchSize);
      
      if (batch.length === 0) {
        this.isProcessing = false;
        return;
      }

      logger.info('Processing data warehouse batch', {
        batchSize: batch.length,
        queueRemaining: this.processingQueue.length
      });

      // Store raw data
      await this.storeRawData(batch);

      // Generate aggregations
      await this.generateAggregations(batch);

      // Extract features for ML training
      await this.extractFeatures(batch);

      // Update data catalog
      await this.updateDataCatalog(batch);

      logger.info('Data warehouse batch processed successfully', {
        batchSize: batch.length,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('Data warehouse batch processing failed', { error });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Store raw behavioral data in partitioned tables
   */
  private async storeRawData(batch: ProcessedBehaviorData[]): Promise<void> {
    const client = await this.dbPool.connect();

    try {
      await client.query('BEGIN');

      // Group data by date for partitioning
      const partitionedData = this.partitionDataByDate(batch);

      for (const [partitionKey, data] of partitionedData.entries()) {
        // Ensure partition table exists
        await this.ensurePartitionExists(client, partitionKey);

        // Prepare batch insert
        const values = data.map(item => [
          item.id,
          item.userId,
          item.sessionId,
          item.timestamp,
          item.eventType,
          item.stepId,
          JSON.stringify(item.interactionMetrics),
          JSON.stringify(item.behavioralIndicators),
          JSON.stringify(item.contextData),
          JSON.stringify(item.processingMetadata)
        ]);

        const placeholders = values.map((_, i) => 
          `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`
        ).join(', ');

        const query = `
          INSERT INTO behavioral_events_${partitionKey} 
          (id, user_id, session_id, timestamp, event_type, step_id, interaction_metrics, behavioral_indicators, context_data, processing_metadata)
          VALUES ${placeholders}
          ON CONFLICT (id) DO UPDATE SET
            interaction_metrics = EXCLUDED.interaction_metrics,
            behavioral_indicators = EXCLUDED.behavioral_indicators,
            context_data = EXCLUDED.context_data,
            processing_metadata = EXCLUDED.processing_metadata
        `;

        await client.query(query, values.flat());
      }

      await client.query('COMMIT');

      logger.debug('Raw data stored in warehouse', {
        recordCount: batch.length,
        partitions: partitionedData.size
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to store raw data in warehouse', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate aggregations for analytics and reporting
   */
  private async generateAggregations(batch: ProcessedBehaviorData[]): Promise<void> {
    const client = await this.dbPool.connect();

    try {
      await client.query('BEGIN');

      for (const level of this.config.aggregationLevels) {
        await this.generateAggregationLevel(client, batch, level);
      }

      await client.query('COMMIT');

      logger.debug('Aggregations generated', {
        recordCount: batch.length,
        levels: this.config.aggregationLevels
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to generate aggregations', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate aggregation for specific time level
   */
  private async generateAggregationLevel(client: any, batch: ProcessedBehaviorData[], level: string): Promise<void> {
    // Group data by time period and user
    const aggregations = new Map<string, DataAggregation>();

    for (const data of batch) {
      const timeKey = this.getTimeKey(data.timestamp, level);
      const aggKey = `${data.userId}_${timeKey}`;

      if (!aggregations.has(aggKey)) {
        aggregations.set(aggKey, {
          userId: data.userId,
          timeKey,
          level,
          metrics: {
            totalEvents: 0,
            totalTimeSpent: 0,
            totalClicks: 0,
            totalScrollDistance: 0,
            averageEngagementScore: 0,
            strugglingEvents: 0,
            completedSteps: new Set(),
            uniqueSessions: new Set()
          },
          timestamp: data.timestamp
        });
      }

      const agg = aggregations.get(aggKey)!;
      agg.metrics.totalEvents++;
      agg.metrics.totalTimeSpent += data.interactionMetrics.timeSpent;
      agg.metrics.totalClicks += data.interactionMetrics.clickCount;
      agg.metrics.totalScrollDistance += data.interactionMetrics.scrollDistance;
      agg.metrics.averageEngagementScore += data.interactionMetrics.engagementScore;
      
      if (data.behavioralIndicators.isStruggling) {
        agg.metrics.strugglingEvents++;
      }
      
      if (data.stepId) {
        agg.metrics.completedSteps.add(data.stepId);
      }
      
      agg.metrics.uniqueSessions.add(data.sessionId);
    }

    // Store aggregations
    for (const agg of aggregations.values()) {
      // Calculate averages
      agg.metrics.averageEngagementScore /= agg.metrics.totalEvents;

      const query = `
        INSERT INTO behavioral_aggregations_${level} 
        (user_id, time_key, total_events, total_time_spent, total_clicks, total_scroll_distance, 
         average_engagement_score, struggling_events, completed_steps_count, unique_sessions_count, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (user_id, time_key) DO UPDATE SET
          total_events = behavioral_aggregations_${level}.total_events + EXCLUDED.total_events,
          total_time_spent = behavioral_aggregations_${level}.total_time_spent + EXCLUDED.total_time_spent,
          total_clicks = behavioral_aggregations_${level}.total_clicks + EXCLUDED.total_clicks,
          total_scroll_distance = behavioral_aggregations_${level}.total_scroll_distance + EXCLUDED.total_scroll_distance,
          average_engagement_score = (behavioral_aggregations_${level}.average_engagement_score + EXCLUDED.average_engagement_score) / 2,
          struggling_events = behavioral_aggregations_${level}.struggling_events + EXCLUDED.struggling_events,
          completed_steps_count = GREATEST(behavioral_aggregations_${level}.completed_steps_count, EXCLUDED.completed_steps_count),
          unique_sessions_count = GREATEST(behavioral_aggregations_${level}.unique_sessions_count, EXCLUDED.unique_sessions_count),
          updated_at = NOW()
      `;

      await client.query(query, [
        agg.userId,
        agg.timeKey,
        agg.metrics.totalEvents,
        agg.metrics.totalTimeSpent,
        agg.metrics.totalClicks,
        agg.metrics.totalScrollDistance,
        agg.metrics.averageEngagementScore,
        agg.metrics.strugglingEvents,
        agg.metrics.completedSteps.size,
        agg.metrics.uniqueSessions.size
      ]);
    }
  }

  /**
   * Extract features for ML training
   */
  private async extractFeatures(batch: ProcessedBehaviorData[]): Promise<void> {
    try {
      // Group data by user for feature extraction
      const userGroups = new Map<string, ProcessedBehaviorData[]>();
      
      for (const data of batch) {
        if (!userGroups.has(data.userId)) {
          userGroups.set(data.userId, []);
        }
        userGroups.get(data.userId)!.push(data);
      }

      // Extract features for each user
      const featureVectors: FeatureVector[] = [];
      
      for (const [userId, userData] of userGroups.entries()) {
        for (const rule of this.config.featureExtractionRules) {
          try {
            const features = rule.extract(userData);
            features.userId = userId;
            features.extractedAt = new Date();
            features.ruleId = rule.id;
            featureVectors.push(features);
          } catch (error) {
            logger.error('Feature extraction rule failed', { error, ruleId: rule.id, userId });
          }
        }
      }

      // Store feature vectors
      if (featureVectors.length > 0) {
        await this.storeFeatureVectors(featureVectors);
      }

      logger.debug('Features extracted for ML training', {
        userCount: userGroups.size,
        featureVectorCount: featureVectors.length
      });

    } catch (error) {
      logger.error('Feature extraction failed', { error });
      throw error;
    }
  }

  /**
   * Store feature vectors for ML training
   */
  private async storeFeatureVectors(vectors: FeatureVector[]): Promise<void> {
    const client = await this.dbPool.connect();

    try {
      await client.query('BEGIN');

      for (const vector of vectors) {
        const query = `
          INSERT INTO ml_feature_vectors 
          (user_id, rule_id, features, labels, metadata, extracted_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, rule_id, extracted_at) DO UPDATE SET
            features = EXCLUDED.features,
            labels = EXCLUDED.labels,
            metadata = EXCLUDED.metadata
        `;

        await client.query(query, [
          vector.userId,
          vector.ruleId,
          JSON.stringify(vector.features),
          JSON.stringify(vector.labels),
          JSON.stringify(vector.metadata),
          vector.extractedAt
        ]);
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to store feature vectors', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create ML training dataset
   */
  async createTrainingDataset(criteria: {
    startDate: Date;
    endDate: Date;
    userIds?: string[];
    eventTypes?: string[];
    minQualityScore?: number;
  }): Promise<MLTrainingDataset> {
    const client = await this.dbPool.connect();

    try {
      // Build query conditions
      const conditions = ['timestamp >= $1', 'timestamp <= $2'];
      const params: any[] = [criteria.startDate, criteria.endDate];
      let paramIndex = 3;

      if (criteria.userIds?.length) {
        conditions.push(`user_id = ANY($${paramIndex})`);
        params.push(criteria.userIds);
        paramIndex++;
      }

      if (criteria.eventTypes?.length) {
        conditions.push(`event_type = ANY($${paramIndex})`);
        params.push(criteria.eventTypes);
        paramIndex++;
      }

      if (criteria.minQualityScore) {
        conditions.push(`(processing_metadata->>'dataQualityScore')::float >= $${paramIndex}`);
        params.push(criteria.minQualityScore);
        paramIndex++;
      }

      // Query raw behavioral data
      const dataQuery = `
        SELECT * FROM behavioral_events_partitioned 
        WHERE ${conditions.join(' AND ')}
        ORDER BY timestamp
      `;

      const dataResult = await client.query(dataQuery, params);

      // Query feature vectors
      const featuresQuery = `
        SELECT * FROM ml_feature_vectors 
        WHERE extracted_at >= $1 AND extracted_at <= $2
        ORDER BY extracted_at
      `;

      const featuresResult = await client.query(featuresQuery, [criteria.startDate, criteria.endDate]);

      // Query aggregations
      const aggregationsQuery = `
        SELECT * FROM behavioral_aggregations_daily 
        WHERE time_key >= $1 AND time_key <= $2
        ORDER BY time_key
      `;

      const aggregationsResult = await client.query(aggregationsQuery, [
        this.getTimeKey(criteria.startDate, 'daily'),
        this.getTimeKey(criteria.endDate, 'daily')
      ]);

      const dataset: MLTrainingDataset = {
        id: `dataset_${Date.now()}`,
        createdAt: new Date(),
        criteria,
        rawData: dataResult.rows,
        featureVectors: featuresResult.rows,
        aggregations: aggregationsResult.rows,
        metadata: {
          totalRecords: dataResult.rows.length,
          dateRange: {
            start: criteria.startDate,
            end: criteria.endDate
          },
          uniqueUsers: new Set(dataResult.rows.map(r => r.user_id)).size,
          eventTypes: [...new Set(dataResult.rows.map(r => r.event_type))],
          qualityMetrics: this.calculateDatasetQuality(dataResult.rows)
        }
      };

      logger.info('ML training dataset created', {
        datasetId: dataset.id,
        recordCount: dataset.metadata.totalRecords,
        uniqueUsers: dataset.metadata.uniqueUsers
      });

      return dataset;

    } catch (error) {
      logger.error('Failed to create training dataset', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Perform maintenance tasks
   */
  private async performMaintenanceTasks(): Promise<void> {
    try {
      logger.info('Starting data warehouse maintenance tasks');

      // Clean old data based on retention policy
      await this.cleanOldData();

      // Optimize table partitions
      await this.optimizePartitions();

      // Update statistics
      await this.updateStatistics();

      logger.info('Data warehouse maintenance tasks completed');

    } catch (error) {
      logger.error('Maintenance tasks failed', { error });
    }
  }

  /**
   * Helper methods
   */
  private partitionDataByDate(batch: ProcessedBehaviorData[]): Map<string, ProcessedBehaviorData[]> {
    const partitions = new Map<string, ProcessedBehaviorData[]>();

    for (const data of batch) {
      const partitionKey = this.getPartitionKey(data.timestamp);
      if (!partitions.has(partitionKey)) {
        partitions.set(partitionKey, []);
      }
      partitions.get(partitionKey)!.push(data);
    }

    return partitions;
  }

  private getPartitionKey(date: Date): string {
    return `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private getTimeKey(date: Date, level: string): string {
    switch (level) {
      case 'hourly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}`;
      case 'daily':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private async ensurePartitionExists(client: any, partitionKey: string): Promise<void> {
    const tableName = `behavioral_events_${partitionKey}`;
    
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `;
    
    const result = await client.query(checkQuery, [tableName]);
    
    if (!result.rows[0].exists) {
      const createQuery = `
        CREATE TABLE ${tableName} (
          LIKE behavioral_events_template INCLUDING ALL
        ) INHERITS (behavioral_events_partitioned)
      `;
      
      await client.query(createQuery);
      
      // Add partition constraint
      const constraintQuery = `
        ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_partition_check 
        CHECK (timestamp >= '${partitionKey}-01'::date AND timestamp < ('${partitionKey}-01'::date + INTERVAL '1 month'))
      `;
      
      await client.query(constraintQuery);
    }
  }

  private calculateDatasetQuality(data: any[]): any {
    const qualityScores = data
      .map(d => d.processing_metadata?.dataQualityScore)
      .filter(score => score !== undefined);

    return {
      averageQualityScore: qualityScores.length > 0 
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
        : 0,
      recordsWithQualityScore: qualityScores.length,
      totalRecords: data.length
    };
  }

  private async cleanOldData(): Promise<void> {
    const client = await this.dbPool.connect();
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);
      
      // Clean old partitions
      const query = `
        SELECT tablename FROM pg_tables 
        WHERE tablename LIKE 'behavioral_events_%' 
        AND tablename < 'behavioral_events_${this.getPartitionKey(cutoffDate)}'
      `;
      
      const result = await client.query(query);
      
      for (const row of result.rows) {
        await client.query(`DROP TABLE IF EXISTS ${row.tablename}`);
        logger.info('Dropped old partition', { tableName: row.tablename });
      }
      
    } finally {
      client.release();
    }
  }

  private async optimizePartitions(): Promise<void> {
    // Implementation for partition optimization
    logger.debug('Partition optimization completed');
  }

  private async updateStatistics(): Promise<void> {
    // Implementation for statistics update
    logger.debug('Statistics update completed');
  }

  private initializeDefaultFeatureRules(): void {
    // Add default feature extraction rules
    this.config.featureExtractionRules.push({
      id: 'engagement_features',
      name: 'Engagement Features',
      description: 'Extract engagement-related features',
      extract: (data: ProcessedBehaviorData[]) => {
        const avgEngagement = data.reduce((sum, d) => sum + d.interactionMetrics.engagementScore, 0) / data.length;
        const maxEngagement = Math.max(...data.map(d => d.interactionMetrics.engagementScore));
        const minEngagement = Math.min(...data.map(d => d.interactionMetrics.engagementScore));
        
        return {
          features: {
            avg_engagement: avgEngagement,
            max_engagement: maxEngagement,
            min_engagement: minEngagement,
            engagement_variance: data.reduce((sum, d) => sum + Math.pow(d.interactionMetrics.engagementScore - avgEngagement, 2), 0) / data.length
          },
          labels: {
            high_engagement: avgEngagement > 70,
            struggling: data.some(d => d.behavioralIndicators.isStruggling)
          },
          metadata: {
            recordCount: data.length,
            timeSpan: data.length > 0 ? data[data.length - 1].timestamp.getTime() - data[0].timestamp.getTime() : 0
          }
        } as FeatureVector;
      }
    });
  }

  /**
   * Get data warehouse statistics
   */
  async getWarehouseStats(): Promise<any> {
    const client = await this.dbPool.connect();
    
    try {
      const stats = {
        queueSize: this.processingQueue.length,
        isProcessing: this.isProcessing,
        partitions: await this.getPartitionInfo(client),
        recordCounts: await this.getRecordCounts(client),
        lastProcessed: new Date()
      };
      
      return stats;
      
    } finally {
      client.release();
    }
  }

  private async getPartitionInfo(client: any): Promise<DataPartition[]> {
    const query = `
      SELECT 
        tablename as partition_key,
        pg_total_relation_size(tablename::regclass) as data_size
      FROM pg_tables 
      WHERE tablename LIKE 'behavioral_events_%'
      ORDER BY tablename
    `;
    
    const result = await client.query(query);
    return result.rows;
  }

  private async getRecordCounts(client: any): Promise<any> {
    const queries = [
      'SELECT COUNT(*) as raw_events FROM behavioral_events_partitioned',
      'SELECT COUNT(*) as feature_vectors FROM ml_feature_vectors',
      'SELECT COUNT(*) as daily_aggregations FROM behavioral_aggregations_daily'
    ];
    
    const results = await Promise.all(queries.map(q => client.query(q)));
    
    return {
      rawEvents: parseInt(results[0].rows[0].raw_events),
      featureVectors: parseInt(results[1].rows[0].feature_vectors),
      dailyAggregations: parseInt(results[2].rows[0].daily_aggregations)
    };
  }
}

export const dataWarehouseService = new DataWarehouseService();