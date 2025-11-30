import { mlModelManager } from '../smart-onboarding/services/mlModelManager';
import { modelDeploymentService } from '../smart-onboarding/services/modelDeploymentService';
import { modelVersioningService } from '../smart-onboarding/services/modelVersioningService';
import { redisClient } from '../smart-onboarding/config/redis';
import { logger } from '../utils/logger';

interface WorkerConfig {
  trainingInterval: number;
  maxConcurrentTraining: number;
  autoDeployment: boolean;
  performanceThreshold: number;
  retryAttempts: number;
}

interface TrainingSchedule {
  modelId: string;
  nextTraining: Date;
  interval: number;
  enabled: boolean;
  lastTraining?: Date;
  consecutiveFailures: number;
}

export class MLTrainingWorker {
  private config: WorkerConfig;
  private isRunning = false;
  private trainingSchedules: Map<string, TrainingSchedule> = new Map();
  private activeTrainingJobs = 0;
  private workerStats = {
    totalTrainingJobs: 0,
    successfulTrainings: 0,
    failedTrainings: 0,
    autoDeployments: 0,
    lastActivity: new Date()
  };

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      trainingInterval: 60000, // 1 minute check interval
      maxConcurrentTraining: 2,
      autoDeployment: false,
      performanceThreshold: 0.05, // 5% improvement threshold
      retryAttempts: 3,
      ...config
    };
  }

  /**
   * Start the ML training worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('ML training worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting ML training worker', { config: this.config });

    // Load existing schedules
    await this.loadTrainingSchedules();

    // Start monitoring loops
    this.startTrainingScheduler();
    this.startPerformanceMonitoring();
    this.startHealthMonitoring();

    // Graceful shutdown handling
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  /**
   * Stop the ML training worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping ML training worker');
    this.isRunning = false;

    // Wait for active training jobs to complete
    while (this.activeTrainingJobs > 0) {
      logger.info('Waiting for active training jobs to complete', { activeJobs: this.activeTrainingJobs });
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    logger.info('ML training worker stopped');
  }

  /**
   * Schedule model for automatic training
   */
  async scheduleModelTraining(
    modelId: string, 
    interval: number, 
    enabled: boolean = true
  ): Promise<void> {
    try {
      const schedule: TrainingSchedule = {
        modelId,
        nextTraining: new Date(Date.now() + interval),
        interval,
        enabled,
        consecutiveFailures: 0
      };

      this.trainingSchedules.set(modelId, schedule);
      await this.persistTrainingSchedules();

      logger.info('Model training scheduled', { modelId, interval, enabled });

    } catch (error) {
      logger.error('Failed to schedule model training', { error, modelId });
      throw error;
    }
  }

  /**
   * Start training scheduler loop
   */
  private startTrainingScheduler(): void {
    const checkSchedules = async () => {
      if (!this.isRunning) return;

      try {
        const now = new Date();
        
        for (const [modelId, schedule] of this.trainingSchedules.entries()) {
          if (schedule.enabled && 
              schedule.nextTraining <= now && 
              this.activeTrainingJobs < this.config.maxConcurrentTraining) {
            
            await this.executeScheduledTraining(modelId, schedule);
          }
        }

      } catch (error) {
        logger.error('Training scheduler check failed', { error });
      }

      setTimeout(checkSchedules, this.config.trainingInterval);
    };

    checkSchedules();
  }

  /**
   * Execute scheduled training for a model
   */
  private async executeScheduledTraining(modelId: string, schedule: TrainingSchedule): Promise<void> {
    try {
      this.activeTrainingJobs++;
      this.workerStats.totalTrainingJobs++;
      this.workerStats.lastActivity = new Date();

      logger.info('Starting scheduled training', { modelId });

      // Check if model needs retraining
      const shouldRetrain = await this.shouldRetrainModel(modelId);
      if (!shouldRetrain) {
        logger.info('Model does not need retraining', { modelId });
        this.updateNextTrainingTime(modelId, schedule);
        return;
      }

      // Queue training job
      const jobId = await mlModelManager.queueTraining(modelId);
      
      // Monitor training job
      const success = await this.monitorTrainingJob(jobId);

      if (success) {
        schedule.consecutiveFailures = 0;
        schedule.lastTraining = new Date();
        this.workerStats.successfulTrainings++;

        // Check if auto-deployment is enabled
        if (this.config.autoDeployment) {
          await this.evaluateAutoDeployment(modelId);
        }

        logger.info('Scheduled training completed successfully', { modelId, jobId });

      } else {
        schedule.consecutiveFailures++;
        this.workerStats.failedTrainings++;

        // Disable schedule if too many consecutive failures
        if (schedule.consecutiveFailures >= this.config.retryAttempts) {
          schedule.enabled = false;
          logger.warn('Model training disabled due to consecutive failures', { 
            modelId, 
            failures: schedule.consecutiveFailures 
          });
        }

        logger.error('Scheduled training failed', { modelId, jobId, failures: schedule.consecutiveFailures });
      }

      // Update next training time
      this.updateNextTrainingTime(modelId, schedule);
      await this.persistTrainingSchedules();

    } catch (error) {
      logger.error('Scheduled training execution failed', { error, modelId });
      schedule.consecutiveFailures++;
    } finally {
      this.activeTrainingJobs--;
    }
  }

  /**
   * Check if model should be retrained
   */
  private async shouldRetrainModel(modelId: string): Promise<boolean> {
    try {
      // Check model performance drift
      const monitoring = await mlModelManager.monitorModelPerformance(modelId);
      
      if (monitoring.alerts && monitoring.alerts.length > 0) {
        const criticalAlerts = monitoring.alerts.filter(alert => 
          alert.severity === 'critical' || alert.severity === 'high'
        );
        
        if (criticalAlerts.length > 0) {
          logger.info('Model needs retraining due to performance alerts', { 
            modelId, 
            alerts: criticalAlerts.length 
          });
          return true;
        }
      }

      // Check data drift
      if (monitoring.drift && monitoring.drift.overallDrift > 0.1) {
        logger.info('Model needs retraining due to data drift', { 
          modelId, 
          drift: monitoring.drift.overallDrift 
        });
        return true;
      }

      // Check if enough new data is available
      const newDataAvailable = await this.checkNewDataAvailability(modelId);
      if (newDataAvailable) {
        logger.info('Model needs retraining due to new data availability', { modelId });
        return true;
      }

      return false;

    } catch (error) {
      logger.error('Failed to check if model should be retrained', { error, modelId });
      return false;
    }
  }

  /**
   * Monitor training job progress
   */
  private async monitorTrainingJob(jobId: string): Promise<boolean> {
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const checkInterval = 10000; // 10 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const queueStatus = mlModelManager.getTrainingQueueStatus();
        const job = queueStatus.jobs.find(j => j.id === jobId);

        if (!job) {
          // Job might be completed, check training stats
          const stats = mlModelManager.getTrainingStats();
          return stats.completedJobs > 0;
        }

        if (job.status === 'completed') {
          return true;
        } else if (job.status === 'failed') {
          return false;
        }

        // Job is still running, wait and check again
        await new Promise(resolve => setTimeout(resolve, checkInterval));

      } catch (error) {
        logger.error('Error monitoring training job', { error, jobId });
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    // Timeout reached
    logger.warn('Training job monitoring timeout', { jobId });
    return false;
  }

  /**
   * Evaluate if model should be auto-deployed
   */
  private async evaluateAutoDeployment(modelId: string): Promise<void> {
    try {
      // Get latest model version
      const model = await mlModelManager.getActiveModel(modelId);
      if (!model) {
        logger.warn('No active model found for auto-deployment evaluation', { modelId });
        return;
      }

      // Get previous version for comparison
      const versions = await modelVersioningService.listVersions(modelId, { limit: 2 });
      if (versions.length < 2) {
        logger.info('Not enough versions for performance comparison', { modelId });
        return;
      }

      const [currentVersion, previousVersion] = versions;
      
      // Compare performance
      const comparison = await modelVersioningService.compareVersions(
        modelId,
        previousVersion.version,
        currentVersion.version
      );

      // Check if performance improvement meets threshold
      const performanceImprovement = this.calculatePerformanceImprovement(comparison);
      
      if (performanceImprovement >= this.config.performanceThreshold) {
        logger.info('Auto-deploying model due to performance improvement', {
          modelId,
          improvement: performanceImprovement,
          threshold: this.config.performanceThreshold
        });

        // Deploy to staging first
        const deploymentConfig = {
          strategy: 'canary' as const,
          canary: {
            initialTraffic: 10,
            incrementStep: 20,
            maxTraffic: 50,
            evaluationPeriod: 300000 // 5 minutes
          }
        };

        await modelDeploymentService.deployModel(
          modelId,
          currentVersion.version,
          'staging',
          deploymentConfig
        );

        this.workerStats.autoDeployments++;

      } else {
        logger.info('Model performance improvement below threshold', {
          modelId,
          improvement: performanceImprovement,
          threshold: this.config.performanceThreshold
        });
      }

    } catch (error) {
      logger.error('Auto-deployment evaluation failed', { error, modelId });
    }
  }

  /**
   * Start performance monitoring loop
   */
  private startPerformanceMonitoring(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const registry = mlModelManager.getModelRegistry();
        
        for (const modelId of Object.keys(registry)) {
          // Monitor model performance
          const monitoring = await mlModelManager.monitorModelPerformance(modelId);
          
          // Check for critical alerts
          if (monitoring.alerts) {
            const criticalAlerts = monitoring.alerts.filter(alert => 
              alert.severity === 'critical'
            );
            
            if (criticalAlerts.length > 0) {
              logger.warn('Critical model performance alerts detected', {
                modelId,
                alerts: criticalAlerts
              });
              
              // Trigger immediate retraining if not already scheduled
              const schedule = this.trainingSchedules.get(modelId);
              if (schedule && schedule.enabled) {
                schedule.nextTraining = new Date(); // Schedule immediately
                await this.persistTrainingSchedules();
              }
            }
          }
        }

      } catch (error) {
        logger.error('Performance monitoring failed', { error });
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Start health monitoring loop
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Update worker health metrics
        const healthMetrics = {
          isRunning: this.isRunning,
          activeTrainingJobs: this.activeTrainingJobs,
          scheduledModels: this.trainingSchedules.size,
          stats: this.workerStats,
          timestamp: new Date()
        };

        await redisClient.setex('ml_training_worker_health', 300, JSON.stringify(healthMetrics));

        logger.info('ML training worker health updated', healthMetrics);

      } catch (error) {
        logger.error('Health monitoring update failed', { error });
      }
    }, 60000); // Every minute
  }

  /**
   * Helper methods
   */
  private async loadTrainingSchedules(): Promise<void> {
    try {
      const schedulesData = await redisClient.get('ml_training_schedules');
      if (schedulesData) {
        const schedules = JSON.parse(schedulesData);
        this.trainingSchedules = new Map(Object.entries(schedules));
        
        // Convert date strings back to Date objects
        for (const schedule of this.trainingSchedules.values()) {
          schedule.nextTraining = new Date(schedule.nextTraining);
          if (schedule.lastTraining) {
            schedule.lastTraining = new Date(schedule.lastTraining);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load training schedules', { error });
    }
  }

  private async persistTrainingSchedules(): Promise<void> {
    try {
      const schedulesObj = Object.fromEntries(this.trainingSchedules);
      await redisClient.set('ml_training_schedules', JSON.stringify(schedulesObj));
    } catch (error) {
      logger.error('Failed to persist training schedules', { error });
    }
  }

  private updateNextTrainingTime(modelId: string, schedule: TrainingSchedule): void {
    schedule.nextTraining = new Date(Date.now() + schedule.interval);
  }

  private async checkNewDataAvailability(modelId: string): Promise<boolean> {
    // Check if significant new data is available since last training
    // This would integrate with the data warehouse service
    return false; // Simplified for now
  }

  private calculatePerformanceImprovement(comparison: any): number {
    // Calculate overall performance improvement from version comparison
    if (!comparison.differences.performance) {
      return 0;
    }

    const improvements = comparison.differences.performance
      .filter((change: any) => change.improvement > 0)
      .map((change: any) => change.percentage);

    if (improvements.length === 0) {
      return 0;
    }

    // Return average improvement
    return improvements.reduce((sum: number, imp: number) => sum + imp, 0) / improvements.length / 100;
  }

  /**
   * Get worker status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      config: this.config,
      activeTrainingJobs: this.activeTrainingJobs,
      scheduledModels: Array.from(this.trainingSchedules.entries()).map(([modelId, schedule]) => ({
        modelId,
        ...schedule
      })),
      stats: this.workerStats
    };
  }

  /**
   * Update worker configuration
   */
  updateConfig(newConfig: Partial<WorkerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('ML training worker configuration updated', { config: this.config });
  }

  /**
   * Enable/disable model training schedule
   */
  async toggleModelSchedule(modelId: string, enabled: boolean): Promise<void> {
    const schedule = this.trainingSchedules.get(modelId);
    if (schedule) {
      schedule.enabled = enabled;
      await this.persistTrainingSchedules();
      logger.info('Model training schedule toggled', { modelId, enabled });
    } else {
      throw new Error(`No training schedule found for model ${modelId}`);
    }
  }

  /**
   * Force immediate training for a model
   */
  async forceTraining(modelId: string): Promise<string> {
    try {
      const jobId = await mlModelManager.queueTraining(modelId);
      logger.info('Forced training initiated', { modelId, jobId });
      return jobId;
    } catch (error) {
      logger.error('Failed to force training', { error, modelId });
      throw error;
    }
  }
}

// Export singleton instance
export const mlTrainingWorker = new MLTrainingWorker();