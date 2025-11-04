import { MLModel, TrainingConfig, TrainingResult, ModelMetrics } from '../types';
import { modelVersioningService } from './modelVersioningService';
import { dataWarehouseService } from './dataWarehouseService';
import { logger } from '../../utils/logger';

export interface TrainingPipelineConfig {
  modelType: 'persona_classification' | 'success_prediction' | 'engagement_scoring' | 'path_optimization';
  trainingDataQuery: string;
  validationSplit: number;
  hyperparameters: Record<string, any>;
  evaluationMetrics: string[];
  retrainingThreshold: number;
  maxTrainingTime: number;
}

export interface TrainingJob {
  id: string;
  modelType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  config: TrainingPipelineConfig;
  metrics?: ModelMetrics;
  errorMessage?: string;
  modelVersion?: string;
}

class MLTrainingPipeline {
  private activeJobs = new Map<string, TrainingJob>();
  private trainingQueue: TrainingJob[] = [];

  async scheduleTraining(config: TrainingPipelineConfig): Promise<string> {
    const jobId = `training_${config.modelType}_${Date.now()}`;
    
    const job: TrainingJob = {
      id: jobId,
      modelType: config.modelType,
      status: 'pending',
      startTime: new Date(),
      config
    };

    this.trainingQueue.push(job);
    this.activeJobs.set(jobId, job);

    logger.info(`Training job scheduled: ${jobId}`, { config });

    // Start training if no other jobs are running
    this.processTrainingQueue();

    return jobId;
  }

  async getTrainingStatus(jobId: string): Promise<TrainingJob | null> {
    return this.activeJobs.get(jobId) || null;
  }

  async cancelTraining(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    if (job.status === 'running') {
      // In a real implementation, this would cancel the actual training process
      job.status = 'failed';
      job.errorMessage = 'Training cancelled by user';
      job.endTime = new Date();
    } else if (job.status === 'pending') {
      // Remove from queue
      const queueIndex = this.trainingQueue.findIndex(j => j.id === jobId);
      if (queueIndex > -1) {
        this.trainingQueue.splice(queueIndex, 1);
      }
      this.activeJobs.delete(jobId);
    }

    return true;
  }

  private async processTrainingQueue(): Promise<void> {
    if (this.trainingQueue.length === 0) return;

    const runningJobs = Array.from(this.activeJobs.values()).filter(job => job.status === 'running');
    if (runningJobs.length > 0) return; // Only one training job at a time

    const nextJob = this.trainingQueue.shift();
    if (!nextJob) return;

    await this.executeTraining(nextJob);
  }

  private async executeTraining(job: TrainingJob): Promise<void> {
    try {
      job.status = 'running';
      logger.info(`Starting training job: ${job.id}`);

      // 1. Prepare training data
      const trainingData = await this.prepareTrainingData(job.config);
      
      // 2. Split data for training and validation
      const { trainData, validationData } = this.splitData(trainingData, job.config.validationSplit);

      // 3. Train the model
      const trainedModel = await this.trainModel(job.config, trainData);

      // 4. Evaluate the model
      const metrics = await this.evaluateModel(trainedModel, validationData, job.config.evaluationMetrics);

      // 5. Version and store the model
      const modelVersion = await modelVersioningService.createVersion({
        modelType: job.config.modelType,
        model: trainedModel,
        metrics,
        trainingConfig: job.config,
        trainingDataHash: this.hashData(trainingData)
      });

      // 6. Update job status
      job.status = 'completed';
      job.endTime = new Date();
      job.metrics = metrics;
      job.modelVersion = modelVersion;

      logger.info(`Training job completed: ${job.id}`, { metrics, modelVersion });

      // 7. Check if model should be deployed
      await this.evaluateForDeployment(job.config.modelType, modelVersion, metrics);

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error(`Training job failed: ${job.id}`, { error });
    }

    // Process next job in queue
    setTimeout(() => this.processTrainingQueue(), 1000);
  }

  private async prepareTrainingData(config: TrainingPipelineConfig): Promise<any[]> {
    // Fetch training data from data warehouse
    const rawData = await dataWarehouseService.executeQuery(config.trainingDataQuery);
    
    // Apply data preprocessing based on model type
    return this.preprocessData(rawData, config.modelType);
  }

  private preprocessData(rawData: any[], modelType: string): any[] {
    switch (modelType) {
      case 'persona_classification':
        return this.preprocessPersonaData(rawData);
      case 'success_prediction':
        return this.preprocessSuccessData(rawData);
      case 'engagement_scoring':
        return this.preprocessEngagementData(rawData);
      case 'path_optimization':
        return this.preprocessPathData(rawData);
      default:
        return rawData;
    }
  }

  private preprocessPersonaData(data: any[]): any[] {
    return data.map(record => ({
      features: {
        profileData: record.profile_data,
        socialConnections: record.social_connections,
        behaviorPatterns: record.behavior_patterns,
        technicalProficiency: record.technical_proficiency
      },
      label: record.persona_type
    }));
  }

  private preprocessSuccessData(data: any[]): any[] {
    return data.map(record => ({
      features: {
        engagementMetrics: record.engagement_metrics,
        progressPatterns: record.progress_patterns,
        interventionHistory: record.intervention_history,
        timeSpent: record.time_spent
      },
      label: record.completion_success ? 1 : 0
    }));
  }

  private preprocessEngagementData(data: any[]): any[] {
    return data.map(record => ({
      features: {
        mouseMovements: record.mouse_movements,
        clickPatterns: record.click_patterns,
        scrollBehavior: record.scroll_behavior,
        timeOnStep: record.time_on_step
      },
      label: record.engagement_score
    }));
  }

  private preprocessPathData(data: any[]): any[] {
    return data.map(record => ({
      features: {
        userPersona: record.user_persona,
        currentProgress: record.current_progress,
        historicalPaths: record.historical_paths,
        cohortData: record.cohort_data
      },
      label: record.optimal_next_step
    }));
  }

  private splitData(data: any[], validationSplit: number): { trainData: any[], validationData: any[] } {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(data.length * (1 - validationSplit));
    
    return {
      trainData: shuffled.slice(0, splitIndex),
      validationData: shuffled.slice(splitIndex)
    };
  }

  private async trainModel(config: TrainingPipelineConfig, trainData: any[]): Promise<MLModel> {
    // In a real implementation, this would use actual ML libraries like TensorFlow.js or call external ML services
    logger.info(`Training ${config.modelType} model with ${trainData.length} samples`);
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return a mock trained model
    return {
      id: `model_${config.modelType}_${Date.now()}`,
      type: config.modelType,
      version: '1.0.0',
      parameters: config.hyperparameters,
      trainedAt: new Date(),
      // In reality, this would contain the actual model weights/parameters
      modelData: {
        weights: 'base64_encoded_model_weights',
        architecture: config.modelType,
        inputShape: this.getInputShape(config.modelType),
        outputShape: this.getOutputShape(config.modelType)
      }
    };
  }

  private async evaluateModel(model: MLModel, validationData: any[], metrics: string[]): Promise<ModelMetrics> {
    logger.info(`Evaluating model with ${validationData.length} validation samples`);
    
    // Simulate model evaluation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock metrics (in reality, these would be calculated from actual predictions)
    const mockMetrics: ModelMetrics = {
      accuracy: 0.85 + Math.random() * 0.1,
      precision: 0.82 + Math.random() * 0.1,
      recall: 0.88 + Math.random() * 0.1,
      f1Score: 0.85 + Math.random() * 0.1,
      auc: 0.90 + Math.random() * 0.05,
      loss: 0.15 + Math.random() * 0.1,
      validationSamples: validationData.length,
      evaluatedAt: new Date()
    };

    return mockMetrics;
  }

  private async evaluateForDeployment(modelType: string, modelVersion: string, metrics: ModelMetrics): Promise<void> {
    // Get current production model metrics
    const currentModel = await modelVersioningService.getCurrentProductionVersion(modelType);
    
    if (!currentModel) {
      // No current model, deploy this one
      await this.deployModel(modelType, modelVersion);
      return;
    }

    // Compare metrics to decide if new model should be deployed
    const shouldDeploy = this.shouldDeployNewModel(currentModel.metrics, metrics);
    
    if (shouldDeploy) {
      await this.deployModel(modelType, modelVersion);
      logger.info(`New model deployed for ${modelType}`, { 
        oldVersion: currentModel.version,
        newVersion: modelVersion,
        improvement: this.calculateImprovement(currentModel.metrics, metrics)
      });
    } else {
      logger.info(`New model not deployed - insufficient improvement`, {
        modelType,
        currentAccuracy: currentModel.metrics.accuracy,
        newAccuracy: metrics.accuracy
      });
    }
  }

  private shouldDeployNewModel(currentMetrics: ModelMetrics, newMetrics: ModelMetrics): boolean {
    // Deploy if new model has significantly better accuracy
    const accuracyImprovement = newMetrics.accuracy - currentMetrics.accuracy;
    const f1Improvement = newMetrics.f1Score - currentMetrics.f1Score;
    
    return accuracyImprovement > 0.02 || f1Improvement > 0.02;
  }

  private async deployModel(modelType: string, modelVersion: string): Promise<void> {
    // This would trigger the model deployment pipeline
    logger.info(`Deploying model ${modelVersion} for ${modelType}`);
    
    // In reality, this would:
    // 1. Update model serving infrastructure
    // 2. Run deployment tests
    // 3. Gradually roll out the new model
    // 4. Monitor performance
  }

  private calculateImprovement(oldMetrics: ModelMetrics, newMetrics: ModelMetrics): Record<string, number> {
    return {
      accuracy: newMetrics.accuracy - oldMetrics.accuracy,
      precision: newMetrics.precision - oldMetrics.precision,
      recall: newMetrics.recall - oldMetrics.recall,
      f1Score: newMetrics.f1Score - oldMetrics.f1Score,
      auc: newMetrics.auc - oldMetrics.auc
    };
  }

  private getInputShape(modelType: string): number[] {
    switch (modelType) {
      case 'persona_classification': return [50]; // 50 features
      case 'success_prediction': return [30]; // 30 features
      case 'engagement_scoring': return [20]; // 20 features
      case 'path_optimization': return [40]; // 40 features
      default: return [10];
    }
  }

  private getOutputShape(modelType: string): number[] {
    switch (modelType) {
      case 'persona_classification': return [5]; // 5 persona types
      case 'success_prediction': return [1]; // Binary classification
      case 'engagement_scoring': return [1]; // Regression score
      case 'path_optimization': return [10]; // 10 possible next steps
      default: return [1];
    }
  }

  private hashData(data: any[]): string {
    // Simple hash function for data versioning
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  async getTrainingHistory(modelType?: string): Promise<TrainingJob[]> {
    const jobs = Array.from(this.activeJobs.values());
    return modelType 
      ? jobs.filter(job => job.modelType === modelType)
      : jobs;
  }

  async getQueueStatus(): Promise<{ pending: number, running: number, completed: number, failed: number }> {
    const jobs = Array.from(this.activeJobs.values());
    return {
      pending: jobs.filter(job => job.status === 'pending').length,
      running: jobs.filter(job => job.status === 'running').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length
    };
  }
}

export const mlTrainingPipeline = new MLTrainingPipeline();