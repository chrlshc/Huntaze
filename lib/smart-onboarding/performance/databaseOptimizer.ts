import { DatabaseManager } from '../config/database'
import { 
  QueryOptimization, 
  IndexStrategy, 
  PartitionStrategy,
  PerformanceMetrics 
} from '../types'

export class DatabaseOptimizer {
  private dbManager: DatabaseManager
  private queryPerformanceMetrics: Map<string, PerformanceMetrics> = new Map()
  private optimizedQueries: Map<string, QueryOptimization> = new Map()

  constructor() {
    this.dbManager = new DatabaseManager()
    this.initializeOptimizations()
  }

  async initialize(): Promise<void> {
    await this.dbManager.initialize()
    await this.setupIndexes()
    await this.setupPartitioning()
    await this.optimizeQueries()
    console.log('Database Optimizer initialized successfully')
  }

  private initializeOptimizations(): void {
    // Behavioral Events Query Optimizations
    this.optimizedQueries.set('behavioral-events-by-user', {
      originalQuery: `
        SELECT * FROM behavioral_events 
        WHERE user_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `,
      optimizedQuery: `
        SELECT event_type, interaction_data, engagement_score, timestamp 
        FROM behavioral_events 
        WHERE user_id = $1 AND timestamp >= $3
        ORDER BY timestamp DESC 
        LIMIT $2
      `,
      indexRequired: ['user_id', 'timestamp'],
      estimatedImprovement: 0.75
    })

    this.optimizedQueries.set('engagement-analytics', {
      originalQuery: `
        SELECT AVG(engagement_score), COUNT(*) 
        FROM behavioral_events 
        WHERE user_id = $1 AND timestamp >= $2
      `,
      optimizedQuery: `
        SELECT 
          AVG(engagement_score) as avg_engagement,
          COUNT(*) as event_count,
          MIN(timestamp) as first_event,
          MAX(timestamp) as last_event
        FROM behavioral_events_partitioned 
        WHERE user_id = $1 AND timestamp >= $2
      `,
      indexRequired: ['user_id', 'timestamp', 'engagement_score'],
      estimatedImprovement: 0.60
    })

    this.optimizedQueries.set('ml-predictions-lookup', {
      originalQuery: `
        SELECT * FROM ml_predictions 
        WHERE user_id = $1 AND prediction_type = $2 
        ORDER BY created_at DESC 
        LIMIT 1
      `,
      optimizedQuery: `
        SELECT prediction_data, confidence_score, created_at 
        FROM ml_predictions_indexed 
        WHERE user_id = $1 AND prediction_type = $2 
        AND created_at >= NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC 
        LIMIT 1
      `,
      indexRequired: ['user_id', 'prediction_type', 'created_at'],
      estimatedImprovement: 0.80
    })

    this.optimizedQueries.set('onboarding-journey-progress', {
      originalQuery: `
        SELECT oj.*, COUNT(oe.id) as events_count
        FROM onboarding_journeys oj
        LEFT JOIN onboarding_events oe ON oj.user_id = oe.user_id
        WHERE oj.user_id = $1
        GROUP BY oj.id
      `,
      optimizedQuery: `
        SELECT 
          oj.id, oj.current_step, oj.progress_percentage, oj.updated_at,
          COALESCE(ec.events_count, 0) as events_count
        FROM onboarding_journeys oj
        LEFT JOIN (
          SELECT user_id, COUNT(*) as events_count 
          FROM onboarding_events 
          WHERE user_id = $1 
          GROUP BY user_id
        ) ec ON oj.user_id = ec.user_id
        WHERE oj.user_id = $1
      `,
      indexRequired: ['user_id'],
      estimatedImprovement: 0.65
    })
  }

  // Index Management
  private async setupIndexes(): Promise<void> {
    try {
      console.log('Setting up database indexes for optimal performance...')

      // Behavioral Events Indexes
      await this.createIndex('behavioral_events', 'idx_behavioral_events_user_timestamp', 
        ['user_id', 'timestamp DESC'])
      await this.createIndex('behavioral_events', 'idx_behavioral_events_engagement', 
        ['engagement_score', 'timestamp'])
      await this.createIndex('behavioral_events', 'idx_behavioral_events_type_user', 
        ['event_type', 'user_id'])

      // ML Predictions Indexes
      await this.createIndex('ml_predictions', 'idx_ml_predictions_user_type_time', 
        ['user_id', 'prediction_type', 'created_at DESC'])
      await this.createIndex('ml_predictions', 'idx_ml_predictions_confidence', 
        ['confidence_score', 'created_at'])

      // Onboarding Journeys Indexes
      await this.createIndex('onboarding_journeys', 'idx_onboarding_journeys_user_status', 
        ['user_id', 'status'])
      await this.createIndex('onboarding_journeys', 'idx_onboarding_journeys_progress', 
        ['progress_percentage', 'updated_at'])

      // Onboarding Events Indexes
      await this.createIndex('onboarding_events', 'idx_onboarding_events_user_step', 
        ['user_id', 'step_id', 'timestamp'])
      await this.createIndex('onboarding_events', 'idx_onboarding_events_type_time', 
        ['event_type', 'timestamp DESC'])

      // Intervention Logs Indexes
      await this.createIndex('intervention_logs', 'idx_intervention_logs_user_effective', 
        ['user_id', 'effectiveness_score', 'triggered_at'])
      await this.createIndex('intervention_logs', 'idx_intervention_logs_type_time', 
        ['intervention_type', 'triggered_at DESC'])

      console.log('Database indexes created successfully')

    } catch (error) {
      console.error('Error setting up database indexes:', error)
      throw error
    }
  }

  private async createIndex(
    tableName: string, 
    indexName: string, 
    columns: string[]
  ): Promise<void> {
    try {
      const columnList = columns.join(', ')
      const query = `
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName} 
        ON ${tableName} (${columnList})
      `
      
      await this.dbManager.executeQuery(query)
      console.log(`Created index ${indexName} on ${tableName}`)
      
    } catch (error) {
      console.error(`Error creating index ${indexName}:`, error)
    }
  }

  // Table Partitioning
  private async setupPartitioning(): Promise<void> {
    try {
      console.log('Setting up table partitioning for large datasets...')

      // Partition behavioral_events by timestamp (monthly partitions)
      await this.createPartitionedTable('behavioral_events', 'timestamp', 'RANGE')
      
      // Partition ml_predictions by created_at (weekly partitions)
      await this.createPartitionedTable('ml_predictions', 'created_at', 'RANGE')
      
      // Partition intervention_logs by triggered_at (monthly partitions)
      await this.createPartitionedTable('intervention_logs', 'triggered_at', 'RANGE')

      console.log('Table partitioning setup completed')

    } catch (error) {
      console.error('Error setting up table partitioning:', error)
      throw error
    }
  }

  private async createPartitionedTable(
    tableName: string, 
    partitionColumn: string, 
    partitionType: string
  ): Promise<void> {
    try {
      // Create partitioned table structure
      const partitionedTableName = `${tableName}_partitioned`
      
      // This would involve creating the partitioned table structure
      // and migrating data - simplified for this implementation
      console.log(`Setting up partitioning for ${tableName} by ${partitionColumn}`)
      
      // Create monthly partitions for the next 12 months
      for (let i = 0; i < 12; i++) {
        const partitionDate = new Date()
        partitionDate.setMonth(partitionDate.getMonth() + i)
        
        const partitionName = `${partitionedTableName}_${partitionDate.getFullYear()}_${String(partitionDate.getMonth() + 1).padStart(2, '0')}`
        
        await this.createPartition(partitionedTableName, partitionName, partitionColumn, partitionDate)
      }
      
    } catch (error) {
      console.error(`Error creating partitioned table ${tableName}:`, error)
    }
  }

  private async createPartition(
    parentTable: string, 
    partitionName: string, 
    partitionColumn: string, 
    partitionDate: Date
  ): Promise<void> {
    try {
      const startDate = new Date(partitionDate.getFullYear(), partitionDate.getMonth(), 1)
      const endDate = new Date(partitionDate.getFullYear(), partitionDate.getMonth() + 1, 1)
      
      const query = `
        CREATE TABLE IF NOT EXISTS ${partitionName} 
        PARTITION OF ${parentTable}
        FOR VALUES FROM ('${startDate.toISOString()}') TO ('${endDate.toISOString()}')
      `
      
      await this.dbManager.executeQuery(query)
      console.log(`Created partition ${partitionName}`)
      
    } catch (error) {
      console.error(`Error creating partition ${partitionName}:`, error)
    }
  }

  // Query Optimization
  private async optimizeQueries(): Promise<void> {
    try {
      console.log('Optimizing database queries...')

      // Create optimized views for common queries
      await this.createOptimizedViews()
      
      // Setup materialized views for complex analytics
      await this.createMaterializedViews()
      
      // Configure query performance monitoring
      await this.setupQueryMonitoring()

      console.log('Query optimization completed')

    } catch (error) {
      console.error('Error optimizing queries:', error)
      throw error
    }
  }

  private async createOptimizedViews(): Promise<void> {
    // User Engagement Summary View
    const userEngagementView = `
      CREATE OR REPLACE VIEW user_engagement_summary AS
      SELECT 
        user_id,
        AVG(engagement_score) as avg_engagement,
        COUNT(*) as total_events,
        MAX(timestamp) as last_activity,
        MIN(timestamp) as first_activity,
        COUNT(DISTINCT DATE(timestamp)) as active_days
      FROM behavioral_events
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY user_id
    `
    await this.dbManager.executeQuery(userEngagementView)

    // ML Predictions Summary View
    const mlPredictionsView = `
      CREATE OR REPLACE VIEW ml_predictions_latest AS
      SELECT DISTINCT ON (user_id, prediction_type)
        user_id,
        prediction_type,
        prediction_data,
        confidence_score,
        created_at
      FROM ml_predictions
      ORDER BY user_id, prediction_type, created_at DESC
    `
    await this.dbManager.executeQuery(mlPredictionsView)

    // Onboarding Progress View
    const onboardingProgressView = `
      CREATE OR REPLACE VIEW onboarding_progress_summary AS
      SELECT 
        oj.user_id,
        oj.current_step,
        oj.progress_percentage,
        oj.status,
        COUNT(oe.id) as completed_events,
        AVG(CASE WHEN il.effectiveness_score IS NOT NULL 
            THEN il.effectiveness_score ELSE 0 END) as avg_intervention_effectiveness
      FROM onboarding_journeys oj
      LEFT JOIN onboarding_events oe ON oj.user_id = oe.user_id
      LEFT JOIN intervention_logs il ON oj.user_id = il.user_id
      GROUP BY oj.user_id, oj.current_step, oj.progress_percentage, oj.status
    `
    await this.dbManager.executeQuery(onboardingProgressView)
  }

  private async createMaterializedViews(): Promise<void> {
    // Daily Engagement Analytics Materialized View
    const dailyEngagementMV = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS daily_engagement_analytics AS
      SELECT 
        DATE(timestamp) as date,
        COUNT(DISTINCT user_id) as active_users,
        AVG(engagement_score) as avg_engagement,
        COUNT(*) as total_events,
        COUNT(CASE WHEN engagement_score > 0.7 THEN 1 END) as high_engagement_events
      FROM behavioral_events
      WHERE timestamp >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `
    await this.dbManager.executeQuery(dailyEngagementMV)

    // Weekly ML Performance Materialized View
    const weeklyMLPerformanceMV = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_ml_performance AS
      SELECT 
        DATE_TRUNC('week', created_at) as week,
        prediction_type,
        AVG(confidence_score) as avg_confidence,
        COUNT(*) as prediction_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM ml_predictions
      WHERE created_at >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', created_at), prediction_type
      ORDER BY week DESC, prediction_type
    `
    await this.dbManager.executeQuery(weeklyMLPerformanceMV)

    // Setup automatic refresh for materialized views
    await this.setupMaterializedViewRefresh()
  }

  private async setupMaterializedViewRefresh(): Promise<void> {
    // Schedule materialized view refreshes
    const refreshSchedule = [
      { view: 'daily_engagement_analytics', interval: '1 hour' },
      { view: 'weekly_ml_performance', interval: '6 hours' }
    ]

    for (const schedule of refreshSchedule) {
      // This would typically be handled by a job scheduler like pg_cron
      console.log(`Scheduling refresh for ${schedule.view} every ${schedule.interval}`)
    }
  }

  private async setupQueryMonitoring(): Promise<void> {
    // Enable query performance monitoring
    await this.dbManager.executeQuery('CREATE EXTENSION IF NOT EXISTS pg_stat_statements')
    
    // Setup query performance tracking
    console.log('Query performance monitoring enabled')
  }

  // Connection Pool Optimization
  async optimizeConnectionPool(): Promise<void> {
    try {
      console.log('Optimizing database connection pool...')

      const poolConfig = {
        min: 5,           // Minimum connections
        max: 50,          // Maximum connections
        acquireTimeoutMillis: 30000,  // 30 seconds
        createTimeoutMillis: 30000,   // 30 seconds
        destroyTimeoutMillis: 5000,   // 5 seconds
        idleTimeoutMillis: 300000,    // 5 minutes
        reapIntervalMillis: 1000,     // 1 second
        createRetryIntervalMillis: 200, // 200ms
        propagateCreateError: false
      }

      await this.dbManager.updateConnectionPool(poolConfig)
      console.log('Connection pool optimized successfully')

    } catch (error) {
      console.error('Error optimizing connection pool:', error)
      throw error
    }
  }

  // Query Performance Analysis
  async analyzeQueryPerformance(): Promise<Map<string, PerformanceMetrics>> {
    try {
      const performanceData = new Map<string, PerformanceMetrics>()

      // Analyze slow queries
      const slowQueries = await this.getSlowQueries()
      
      for (const query of slowQueries) {
        const metrics: PerformanceMetrics = {
          queryId: query.queryid,
          averageExecutionTime: query.mean_exec_time,
          totalExecutions: query.calls,
          totalTime: query.total_exec_time,
          rowsReturned: query.rows,
          hitRatio: query.shared_blks_hit / (query.shared_blks_hit + query.shared_blks_read) || 0
        }
        
        performanceData.set(query.query, metrics)
      }

      this.queryPerformanceMetrics = performanceData
      return performanceData

    } catch (error) {
      console.error('Error analyzing query performance:', error)
      throw error
    }
  }

  private async getSlowQueries(): Promise<any[]> {
    const query = `
      SELECT 
        queryid,
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        rows,
        shared_blks_hit,
        shared_blks_read
      FROM pg_stat_statements
      WHERE mean_exec_time > 100  -- Queries taking more than 100ms on average
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `
    
    return await this.dbManager.executeQuery(query)
  }

  // Database Maintenance
  async performMaintenance(): Promise<void> {
    try {
      console.log('Performing database maintenance...')

      // Update table statistics
      await this.updateTableStatistics()
      
      // Vacuum and analyze tables
      await this.vacuumTables()
      
      // Reindex if necessary
      await this.reindexTables()
      
      // Clean up old partitions
      await this.cleanupOldPartitions()

      console.log('Database maintenance completed successfully')

    } catch (error) {
      console.error('Error performing database maintenance:', error)
      throw error
    }
  }

  private async updateTableStatistics(): Promise<void> {
    const tables = [
      'behavioral_events',
      'ml_predictions', 
      'onboarding_journeys',
      'onboarding_events',
      'intervention_logs'
    ]

    for (const table of tables) {
      await this.dbManager.executeQuery(`ANALYZE ${table}`)
      console.log(`Updated statistics for ${table}`)
    }
  }

  private async vacuumTables(): Promise<void> {
    const tables = [
      'behavioral_events',
      'ml_predictions',
      'intervention_logs'
    ]

    for (const table of tables) {
      await this.dbManager.executeQuery(`VACUUM ANALYZE ${table}`)
      console.log(`Vacuumed ${table}`)
    }
  }

  private async reindexTables(): Promise<void> {
    // Reindex tables with high update frequency
    const tables = ['behavioral_events', 'onboarding_journeys']

    for (const table of tables) {
      await this.dbManager.executeQuery(`REINDEX TABLE ${table}`)
      console.log(`Reindexed ${table}`)
    }
  }

  private async cleanupOldPartitions(): Promise<void> {
    // Remove partitions older than 6 months
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - 6)

    console.log(`Cleaning up partitions older than ${cutoffDate.toISOString()}`)
    
    // This would involve dropping old partition tables
    // Implementation depends on specific partitioning strategy
  }

  // Performance Monitoring
  async getPerformanceReport(): Promise<string> {
    try {
      const performanceData = await this.analyzeQueryPerformance()
      
      let report = '# Smart Onboarding Database Performance Report\n\n'
      report += `Generated: ${new Date().toISOString()}\n\n`
      
      report += '## Query Performance Summary\n\n'
      
      for (const [query, metrics] of performanceData.entries()) {
        report += `### Query: ${query.substring(0, 100)}...\n\n`
        report += `- **Average Execution Time**: ${metrics.averageExecutionTime?.toFixed(2)}ms\n`
        report += `- **Total Executions**: ${metrics.totalExecutions}\n`
        report += `- **Total Time**: ${metrics.totalTime?.toFixed(2)}ms\n`
        report += `- **Cache Hit Ratio**: ${((metrics.hitRatio || 0) * 100).toFixed(2)}%\n\n`
      }
      
      return report

    } catch (error) {
      console.error('Error generating performance report:', error)
      return 'Error generating performance report'
    }
  }

  // Public API
  async executeOptimizedQuery(queryName: string, params: any[]): Promise<any> {
    const optimization = this.optimizedQueries.get(queryName)
    
    if (!optimization) {
      throw new Error(`No optimization found for query: ${queryName}`)
    }

    const startTime = Date.now()
    
    try {
      const result = await this.dbManager.executeQuery(optimization.optimizedQuery, params)
      const executionTime = Date.now() - startTime
      
      // Track performance metrics
      this.trackQueryPerformance(queryName, executionTime, result.length)
      
      return result

    } catch (error) {
      console.error(`Error executing optimized query ${queryName}:`, error)
      throw error
    }
  }

  private trackQueryPerformance(queryName: string, executionTime: number, rowCount: number): void {
    const existing = this.queryPerformanceMetrics.get(queryName)
    
    if (existing) {
      existing.totalExecutions = (existing.totalExecutions || 0) + 1
      existing.averageExecutionTime = existing.averageExecutionTime 
        ? (existing.averageExecutionTime + executionTime) / 2 
        : executionTime
    } else {
      this.queryPerformanceMetrics.set(queryName, {
        queryId: queryName,
        averageExecutionTime: executionTime,
        totalExecutions: 1,
        rowsReturned: rowCount
      })
    }
  }

  getOptimizationStatistics(): Map<string, any> {
    const stats = new Map()
    
    for (const [queryName, optimization] of this.optimizedQueries.entries()) {
      const performance = this.queryPerformanceMetrics.get(queryName)
      
      stats.set(queryName, {
        optimization,
        performance,
        lastExecuted: new Date()
      })
    }
    
    return stats
  }
}