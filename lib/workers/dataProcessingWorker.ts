import { behavioralDataProcessor } from '../smart-onboarding/services/behavioralDataProcessor';
import { dataWarehouseService } from '../smart-onboarding/services/dataWarehouseService';
import { redisClient } from '../smart-onboarding/config/redis';
import { logger } from '../utils/logger';

interface WorkerConfig {
  batchSize: number;
  processingInterval: number;
  maxRetries: number;
  errorThreshold: number;
}

interface ProcessingStats {
  totalProcessed: number;
  totalErrors: number;
  lastProcessedAt: Date;
  averageProcessingTime: number;
}

export class DataProcessingWorker {
  private config: WorkerConfig;
  private isRunning = false;
  private processingStats: ProcessingStats = {
    totalProcessed: 0,
    totalErrors: 0,
    lastProcessedAt: new Date(),
    averageProcessingTime: 0
  };

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      batchSize: 100,
      processingInterval: 5000, // 5 seconds
      maxRetries: 3,
      errorThreshold: 0.1, // 10% error rate threshold
      ...config
    };
  }

  /**
   * Start the data processing worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Data processing worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting data processing worker', { config: this.config });

    // Start processing loops
    this.startRedisQueueProcessor();
    this.startDataWarehouseProcessor();
    this.startHealthMonitoring();

    // Graceful shutdown handling
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  /**
   * Stop the data processing worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping data processing worker');
    this.isRunning = false;

    // Allow current operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logger.info('Data processing worker stopped');
  }

  /**
   * Process events from Redis queue
   */
  private startRedisQueueProcessor(): void {
    const processQueue = async () => {
      if (!this.isRunning) return;

      try {
        const startTime = Date.now();
        
        // Get batch of events from Redis queue
        const queueKey = 'behavioral_events_queue';
        const events = await redisClient.lrange(queueKey, 0, this.config.batchSize - 1);
        
        if (events.length === 0) {
          setTimeout(processQueue, this.config.processingInterval);
          return;
        }

        // Remove processed events from queue
        await redisClient.ltrim(queueKey, events.length, -1);

        // Process events
        const results = await Promise.allSettled(
          events.map(eventStr => this.processQueuedEvent(eventStr))
        );

        // Update statistics
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        this.updateStats(successful, failed, Date.now() - startTime);

        // Check error threshold
        const errorRate = failed / events.length;
        if (errorRate > this.config.errorThreshold) {
          logger.warn('High error rate detected in queue processing', {
            errorRate,
            threshold: this.config.errorThreshold,
            batchSize: events.length
          });
        }

        logger.debug('Redis queue batch processed', {
          processed: successful,
          failed,
          queueRemaining: await redisClient.llen(queueKey)
        });

      } catch (error) {
        logger.error('Redis queue processing failed', { error });
      }

      // Schedule next processing cycle
      setTimeout(processQueue, this.config.processingInterval);
    };

    processQueue();
  }

  /**
   * Process individual queued event
   */
  private async processQueuedEvent(eventStr: string): Promise<void> {
    let retries = 0;
    
    while (retries < this.config.maxRetries) {
      try {
        const event = JSON.parse(eventStr);
        await behavioralDataProcessor.queueEvent(event);
        return;
        
      } catch (error) {
        retries++;
        
        if (retries >= this.config.maxRetries) {
          logger.error('Event processing failed after max retries', {
            error,
            retries,
            eventPreview: eventStr.substring(0, 100)
          });
          
          // Move to dead letter queue
          await this.moveToDeadLetterQueue(eventStr, error);
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }

  /**
   * Process data warehouse queue
   */
  private startDataWarehouseProcessor(): void {
    const processWarehouseQueue = async () => {
      if (!this.isRunning) return;

      try {
        const queueKey = 'data_warehouse_queue';
        const items = await redisClient.lrange(queueKey, 0, this.config.batchSize - 1);
        
        if (items.length === 0) {
          setTimeout(processWarehouseQueue, this.config.processingInterval * 2); // Less frequent
          return;
        }

        // Remove processed items from queue
        await redisClient.ltrim(queueKey, items.length, -1);

        // Process warehouse items
        for (const itemStr of items) {
          try {
            const data = JSON.parse(itemStr);
            await dataWarehouseService.queueForWarehouse(data);
          } catch (error) {
            logger.error('Warehouse item processing failed', { error, item: itemStr.substring(0, 100) });
            await this.moveToDeadLetterQueue(itemStr, error, 'warehouse');
          }
        }

        logger.debug('Warehouse queue batch processed', {
          processed: items.length,
          queueRemaining: await redisClient.llen(queueKey)
        });

      } catch (error) {
        logger.error('Warehouse queue processing failed', { error });
      }

      setTimeout(processWarehouseQueue, this.config.processingInterval * 2);
    };

    processWarehouseQueue();
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    const monitorHealth = async () => {
      if (!this.isRunning) return;

      try {
        // Check queue sizes
        const eventQueueSize = await redisClient.llen('behavioral_events_queue');
        const warehouseQueueSize = await redisClient.llen('data_warehouse_queue');
        const deadLetterQueueSize = await redisClient.llen('dead_letter_queue');

        // Check processing metrics
        const processingMetrics = behavioralDataProcessor.getMetrics();
        const queueStatus = behavioralDataProcessor.getQueueStatus();

        // Log health status
        logger.info('Data processing worker health check', {
          queues: {
            events: eventQueueSize,
            warehouse: warehouseQueueSize,
            deadLetter: deadLetterQueueSize
          },
          processing: {
            isProcessing: queueStatus.isProcessing,
            queueSize: queueStatus.queueSize,
            eventsProcessed: processingMetrics.eventsProcessed,
            averageProcessingTime: processingMetrics.averageProcessingTime
          },
          worker: {
            totalProcessed: this.processingStats.totalProcessed,
            totalErrors: this.processingStats.totalErrors,
            errorRate: this.processingStats.totalProcessed > 0 
              ? (this.processingStats.totalErrors / this.processingStats.totalProcessed) * 100 
              : 0
          }
        });

        // Alert on high queue sizes
        if (eventQueueSize > 10000) {
          logger.warn('High event queue size detected', { queueSize: eventQueueSize });
        }

        if (warehouseQueueSize > 5000) {
          logger.warn('High warehouse queue size detected', { queueSize: warehouseQueueSize });
        }

        if (deadLetterQueueSize > 100) {
          logger.warn('High dead letter queue size detected', { queueSize: deadLetterQueueSize });
        }

        // Store health metrics in Redis
        await redisClient.setex('worker_health_metrics', 300, JSON.stringify({
          timestamp: new Date().toISOString(),
          queues: { events: eventQueueSize, warehouse: warehouseQueueSize, deadLetter: deadLetterQueueSize },
          processing: processingMetrics,
          worker: this.processingStats
        }));

      } catch (error) {
        logger.error('Health monitoring failed', { error });
      }

      setTimeout(monitorHealth, 60000); // Every minute
    };

    monitorHealth();
  }

  /**
   * Move failed item to dead letter queue
   */
  private async moveToDeadLetterQueue(item: string, error: any, queueType: string = 'events'): Promise<void> {
    try {
      const deadLetterItem = {
        originalItem: item,
        error: error instanceof Error ? error.message : String(error),
        queueType,
        failedAt: new Date().toISOString(),
        retries: this.config.maxRetries
      };

      await redisClient.lpush('dead_letter_queue', JSON.stringify(deadLetterItem));
      
      // Set expiration on dead letter queue items (30 days)
      await redisClient.expire('dead_letter_queue', 30 * 24 * 60 * 60);

    } catch (dlqError) {
      logger.error('Failed to move item to dead letter queue', { dlqError, originalError: error });
    }
  }

  /**
   * Update processing statistics
   */
  private updateStats(successful: number, failed: number, processingTime: number): void {
    this.processingStats.totalProcessed += successful;
    this.processingStats.totalErrors += failed;
    this.processingStats.lastProcessedAt = new Date();
    
    // Update average processing time (exponential moving average)
    if (this.processingStats.averageProcessingTime === 0) {
      this.processingStats.averageProcessingTime = processingTime;
    } else {
      this.processingStats.averageProcessingTime = 
        (this.processingStats.averageProcessingTime * 0.9) + (processingTime * 0.1);
    }
  }

  /**
   * Get worker statistics
   */
  getStats(): ProcessingStats {
    return { ...this.processingStats };
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; config: WorkerConfig; stats: ProcessingStats } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: this.getStats()
    };
  }

  /**
   * Process dead letter queue items (manual recovery)
   */
  async processDeadLetterQueue(maxItems: number = 10): Promise<{ processed: number; failed: number }> {
    const results = { processed: 0, failed: 0 };

    try {
      const items = await redisClient.lrange('dead_letter_queue', 0, maxItems - 1);
      
      if (items.length === 0) {
        return results;
      }

      // Remove items from dead letter queue
      await redisClient.ltrim('dead_letter_queue', items.length, -1);

      for (const itemStr of items) {
        try {
          const deadLetterItem = JSON.parse(itemStr);
          
          // Attempt to reprocess original item
          if (deadLetterItem.queueType === 'events') {
            await this.processQueuedEvent(deadLetterItem.originalItem);
          } else if (deadLetterItem.queueType === 'warehouse') {
            const data = JSON.parse(deadLetterItem.originalItem);
            await dataWarehouseService.queueForWarehouse(data);
          }
          
          results.processed++;
          
        } catch (error) {
          results.failed++;
          logger.error('Dead letter queue item reprocessing failed', { error, item: itemStr.substring(0, 100) });
        }
      }

      logger.info('Dead letter queue processing completed', results);

    } catch (error) {
      logger.error('Dead letter queue processing failed', { error });
    }

    return results;
  }
}

// Export singleton instance
export const dataProcessingWorker = new DataProcessingWorker();
