#!/usr/bin/env node

/**
 * ML Training Worker
 * 
 * This worker monitors for scheduled training jobs and executes them.
 * It can be run as a standalone process or scheduled via cron.
 * 
 * Usage:
 *   node scripts/run-ml-training-worker.js
 *   
 * Environment Variables:
 *   - ML_TRAINING_INTERVAL: Interval between checks (default: 60000ms)
 *   - ML_MAX_CONCURRENT_JOBS: Maximum concurrent training jobs (default: 1)
 *   - NODE_ENV: Environment (development/production)
 */

const { mlTrainingPipeline } = require('../lib/smart-onboarding/services/mlTrainingPipeline');
const { logger } = require('../lib/utils/logger');

class MLTrainingWorker {
  constructor() {
    this.isRunning = false;
    this.interval = parseInt(process.env.ML_TRAINING_INTERVAL) || 60000; // 1 minute
    this.maxConcurrentJobs = parseInt(process.env.ML_MAX_CONCURRENT_JOBS) || 1;
    this.intervalId = null;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('ML Training Worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting ML Training Worker', {
      interval: this.interval,
      maxConcurrentJobs: this.maxConcurrentJobs
    });

    // Initial check
    await this.checkAndProcessJobs();

    // Set up periodic checks
    this.intervalId = setInterval(async () => {
      try {
        await this.checkAndProcessJobs();
      } catch (error) {
        logger.error('Error in ML training worker cycle', { error });
      }
    }, this.interval);

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping ML Training Worker');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Wait for current jobs to complete (with timeout)
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const queueStatus = await mlTrainingPipeline.getQueueStatus();
      if (queueStatus.running === 0) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('ML Training Worker stopped');
    process.exit(0);
  }

  async checkAndProcessJobs() {
    try {
      const queueStatus = await mlTrainingPipeline.getQueueStatus();
      
      logger.debug('ML Training queue status', queueStatus);

      // Check if we need to trigger automatic retraining
      await this.checkAutoRetraining();

      // Log queue status if there are pending jobs
      if (queueStatus.pending > 0 || queueStatus.running > 0) {
        logger.info('ML Training queue status', {
          pending: queueStatus.pending,
          running: queueStatus.running,
          completed: queueStatus.completed,
          failed: queueStatus.failed
        });
      }

    } catch (error) {
      logger.error('Failed to check training jobs', { error });
    }
  }

  async checkAutoRetraining() {
    try {
      // Check each model type for retraining needs
      const modelTypes = ['persona_classification', 'success_prediction', 'engagement_scoring', 'path_optimization'];
      
      for (const modelType of modelTypes) {
        await this.checkModelRetraining(modelType);
      }
    } catch (error) {
      logger.error('Failed to check auto retraining', { error });
    }
  }

  async checkModelRetraining(modelType) {
    try {
      // In a real implementation, this would:
      // 1. Check model performance metrics
      // 2. Check data freshness
      // 3. Check if enough new data is available
      // 4. Schedule retraining if needed

      logger.debug(`Checking retraining needs for ${modelType}`);
      
      // Mock logic - in reality this would check actual metrics
      const shouldRetrain = Math.random() < 0.01; // 1% chance for demo
      
      if (shouldRetrain) {
        logger.info(`Scheduling automatic retraining for ${modelType}`);
        
        const config = {
          modelType,
          trainingDataQuery: this.getTrainingQuery(modelType),
          validationSplit: 0.2,
          hyperparameters: this.getDefaultHyperparameters(modelType),
          evaluationMetrics: ['accuracy', 'precision', 'recall', 'f1Score'],
          retrainingThreshold: 0.05,
          maxTrainingTime: 3600000 // 1 hour
        };

        await mlTrainingPipeline.scheduleTraining(config);
      }
    } catch (error) {
      logger.error(`Failed to check retraining for ${modelType}`, { error });
    }
  }

  getTrainingQuery(modelType) {
    const queries = {
      persona_classification: `
        SELECT 
          profile_data, social_connections, behavior_patterns, 
          technical_proficiency, persona_type
        FROM user_personas 
        WHERE created_at > NOW() - INTERVAL '30 days'
      `,
      success_prediction: `
        SELECT 
          engagement_metrics, progress_patterns, intervention_history,
          time_spent, completion_success
        FROM onboarding_sessions 
        WHERE created_at > NOW() - INTERVAL '30 days'
      `,
      engagement_scoring: `
        SELECT 
          mouse_movements, click_patterns, scroll_behavior,
          time_on_step, engagement_score
        FROM behavioral_events 
        WHERE created_at > NOW() - INTERVAL '7 days'
      `,
      path_optimization: `
        SELECT 
          user_persona, current_progress, historical_paths,
          cohort_data, optimal_next_step
        FROM learning_paths 
        WHERE created_at > NOW() - INTERVAL '30 days'
      `
    };

    return queries[modelType] || 'SELECT 1';
  }

  getDefaultHyperparameters(modelType) {
    const hyperparameters = {
      persona_classification: {
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 100,
        hidden_layers: [128, 64, 32],
        dropout_rate: 0.2
      },
      success_prediction: {
        learning_rate: 0.001,
        batch_size: 64,
        epochs: 50,
        hidden_layers: [64, 32],
        dropout_rate: 0.3
      },
      engagement_scoring: {
        learning_rate: 0.0005,
        batch_size: 128,
        epochs: 75,
        hidden_layers: [32, 16],
        dropout_rate: 0.1
      },
      path_optimization: {
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 100,
        hidden_layers: [128, 64],
        dropout_rate: 0.25
      }
    };

    return hyperparameters[modelType] || {};
  }
}

// Run the worker if this script is executed directly
if (require.main === module) {
  const worker = new MLTrainingWorker();
  
  worker.start().catch(error => {
    logger.error('Failed to start ML Training Worker', { error });
    process.exit(1);
  });
}

module.exports = { MLTrainingWorker };