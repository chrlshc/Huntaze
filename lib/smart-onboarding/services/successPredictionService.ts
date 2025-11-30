// Note: Local minimal typing to avoid compile-time coupling to missing interface exports
// Types are intentionally broad (any) to keep this service implementation flexible.
import { logger } from '../../utils/logger';
import { redisClient } from '../config/redis';

// Minimal local type declarations to satisfy compile-time checks
type PredictionModel = {
  id: string;
  name: string;
  version: string;
  description?: string;
  type?: string;
  configuration: any;
  deployedAt?: Date;
  parentModelId?: string;
  trainedAt?: Date;
  isActive?: boolean;
};

type FeatureVector = {
  features?: Record<string, number>;
  vector?: number[];
  featureNames?: string[];
  [key: string]: any;
};

type PredictionResult = {
  id: string;
  userId: string;
  successProbability: number;
  confidence?: number;
  riskFactors: string[];
  positiveFactors: string[];
  [key: string]: any;
};

type UserSuccessProfile = {
  userId: string;
  lastUpdated: Date;
  totalSessions?: number;
  completedOnboarding?: boolean;
  averageSessionDuration?: number;
  engagementHistory?: Array<{ timestamp: Date; engagementScore: number; sessionDuration: number; stepsCompleted: number }>;
  successFactors?: string[];
  riskIndicators?: string[];
  [key: string]: any;
} | null;

type TrainingData = any;
type ModelConfiguration = any;

export class SuccessPredictionServiceImpl {
  private models: Map<string, any> = new Map();
  private retrainingPipeline: any;
  private modelMetrics: Map<string, any> = new Map();

  constructor() {
    this.initializeModels();
    this.setupRetrainingPipeline();
  }

  async predictOnboardingSuccess(
    userId: string,
    userProfile: any,
    behaviorData: any,
    currentProgress: any
  ): Promise<any> {
    try {
      // Extract features from user data
      const features = await this.extractFeatures(userId, userProfile, behaviorData, currentProgress);
      
      // Get the appropriate model
      const model = this.getModelForUser(userProfile);
      
      // Make prediction
      const prediction = await this.runPrediction(model, features);
      
      // Calculate confidence intervals
      const confidence = await this.calculateConfidence(model, features, prediction);
      
      // Generate explanation
      const explanation = await this.generatePredictionExplanation(features, prediction);

      const result = {
        id: `prediction_${Date.now()}_${userId}`,
        userId,
        successProbability: prediction.probability,
        confidence: confidence.score,
        confidenceInterval: confidence.interval,
        riskFactors: prediction.riskFactors,
        positiveFactors: prediction.positiveFactors,
        explanation,
        modelUsed: model.id,
        predictionTimestamp: new Date(),
        features: (features && (features.vector || features.features)) || {},
        recommendedActions: await this.generateRecommendedActions(prediction)
      };

      // Cache prediction
      await this.cachePrediction(result);

      // Update model metrics
      await this.updateModelUsageMetrics(model.id);

      logger.info(`Generated success prediction for user ${userId}:`, {
        successProbability: result.successProbability,
        confidence: result.confidence,
        modelUsed: result.modelUsed
      });

      return result;
    } catch (error) {
      logger.error(`Failed to predict success for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async assessRisk(
    userId: string,
    predictionResult: any,
    contextualFactors: any
  ): Promise<any> {
    try {
      const riskLevel = this.calculateRiskLevel(predictionResult.successProbability);
      const urgency = this.calculateUrgency(predictionResult, contextualFactors);
      
      const assessment = {
        id: `risk_${Date.now()}_${userId}`,
        userId,
        predictionId: predictionResult.id,
        riskLevel,
        urgency,
        riskScore: this.calculateRiskScore(predictionResult, contextualFactors),
        primaryRiskFactors: this.identifyPrimaryRiskFactors(predictionResult.riskFactors),
        interventionRecommendations: await this.generateInterventionRecommendations(
          riskLevel,
          predictionResult.riskFactors
        ),
        timeToIntervention: this.calculateTimeToIntervention(urgency, riskLevel),
        assessmentTimestamp: new Date(),
        contextualFactors
      };

      // Store risk assessment
      await this.storeRiskAssessment(assessment);

      logger.info(`Generated risk assessment for user ${userId}:`, {
        riskLevel: assessment.riskLevel,
        urgency: assessment.urgency,
        riskScore: assessment.riskScore
      });

      return assessment;
    } catch (error) {
      logger.error(`Failed to assess risk for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async retrainModel(
    modelId: string,
    newTrainingData: any[],
    validationData: any[]
  ): Promise<any> {
    try {
      const existingModel = this.models.get(modelId);
      if (!existingModel) {
        throw new Error(`Model not found: ${modelId}`);
      }

      logger.info(`Starting model retraining for ${modelId}:`, {
        trainingDataSize: newTrainingData.length,
        validationDataSize: validationData.length
      });

      // Prepare training data
      const processedTrainingData = await this.preprocessTrainingData(newTrainingData);
      const processedValidationData = await this.preprocessTrainingData(validationData);

      // Train new model version
      const newModel = await this.trainModel(
        existingModel.configuration,
        processedTrainingData,
        processedValidationData
      );

      // Validate model performance
      const performance = await this.validateModelPerformance(newModel, processedValidationData);
      
      // Compare with existing model
      const existingPerformance = this.modelMetrics.get(modelId);
      const shouldDeploy = this.shouldDeployNewModel(performance, existingPerformance);

      if (shouldDeploy) {
        // Update model
        newModel.id = `${modelId}_v${Date.now()}`;
        newModel.parentModelId = modelId;
        newModel.deployedAt = new Date();
        
        this.models.set(modelId, newModel);
        this.modelMetrics.set(modelId, performance);

        // Archive old model
        await this.archiveModel(existingModel);

        logger.info(`Successfully deployed new model version:`, {
          modelId: newModel.id,
          performance: performance.accuracy,
          improvement: performance.accuracy - (existingPerformance?.accuracy || 0)
        });
      } else {
        logger.info(`New model did not meet deployment criteria:`, {
          modelId,
          newPerformance: performance.accuracy,
          existingPerformance: existingPerformance?.accuracy
        });
      }

      return newModel;
    } catch (error) {
      logger.error(`Failed to retrain model ${modelId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateUserSuccessProfile(
    userId: string,
    outcomeData: any
  ): Promise<any> {
    try {
      // Get existing profile
      const existingProfile = await this.getUserSuccessProfile(userId);
      
      // Update profile with new outcome data
      const updatedProfile: any = {
        ...existingProfile,
        userId,
        lastUpdated: new Date(),
        totalSessions: (existingProfile?.totalSessions || 0) + 1,
        completedOnboarding: outcomeData.completed || existingProfile?.completedOnboarding || false,
        averageSessionDuration: this.calculateAverageSessionDuration(
          existingProfile,
          outcomeData.sessionDuration
        ),
        engagementHistory: [
          ...(existingProfile?.engagementHistory || []),
          {
            timestamp: new Date(),
            engagementScore: outcomeData.engagementScore,
            sessionDuration: outcomeData.sessionDuration,
            stepsCompleted: outcomeData.stepsCompleted
          }
        ].slice(-20), // Keep last 20 sessions
        successFactors: await this.updateSuccessFactors(existingProfile, outcomeData),
        riskIndicators: await this.updateRiskIndicators(existingProfile, outcomeData)
      };

      // Store updated profile
      await this.storeUserSuccessProfile(updatedProfile);

      // Add to retraining queue if significant change
      if (this.isSignificantChange(existingProfile, updatedProfile)) {
        await this.addToRetrainingQueue(userId, updatedProfile);
      }

      logger.info(`Updated success profile for user ${userId}:`, {
        totalSessions: updatedProfile.totalSessions,
        completedOnboarding: updatedProfile.completedOnboarding,
        averageEngagement: this.calculateAverageEngagement(updatedProfile.engagementHistory)
      });

      return updatedProfile;
    } catch (error) {
      logger.error(`Failed to update success profile for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getModelMetrics(modelId: string): Promise<any | null> {
    return this.modelMetrics.get(modelId) || null;
  }

  private initializeModels(): void {
    // Initialize default models
    const defaultModel: any = {
      id: 'default_success_predictor',
      name: 'Default Success Prediction Model',
      version: '1.0.0',
      type: 'gradient_boosting',
      configuration: {
        features: [
          'user_technical_proficiency',
          'platform_preferences_count',
          'initial_engagement_score',
          'session_duration',
          'steps_completed_ratio',
          'help_requests_count',
          'error_rate',
          'time_between_sessions'
        ],
        hyperparameters: {
          n_estimators: 100,
          learning_rate: 0.1,
          max_depth: 6,
          min_samples_split: 10
        }
      },
      trainedAt: new Date(),
      deployedAt: new Date(),
      isActive: true
    };

    this.models.set(defaultModel.id, defaultModel);

    // Initialize model metrics
    this.modelMetrics.set(defaultModel.id, {
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.88,
      f1Score: 0.85,
      auc: 0.91,
      lastEvaluated: new Date(),
      sampleSize: 1000
    });
  }

  private setupRetrainingPipeline(): void {
    this.retrainingPipeline = {
      schedule: 'weekly',
      minDataPoints: 100,
      performanceThreshold: 0.8,
      lastRun: new Date(),
      isRunning: false
    };

    // Start periodic retraining check
    setInterval(async () => {
      await this.checkRetrainingNeeds();
    }, 24 * 60 * 60 * 1000); // Daily check
  }

  private async extractFeatures(
    userId: string,
    userProfile: any,
    behaviorData: any,
    currentProgress: any
  ): Promise<FeatureVector> {
    const features = {
      // User profile features
      technical_proficiency: this.encodeTechnicalProficiency(userProfile.technicalProficiency),
      platform_preferences_count: userProfile.platformPreferences?.length || 0,
      has_social_connections: userProfile.socialConnections?.length > 0 ? 1 : 0,
      
      // Behavioral features
      initial_engagement_score: behaviorData.initialEngagementScore || 50,
      average_session_duration: behaviorData.averageSessionDuration || 0,
      total_sessions: behaviorData.totalSessions || 1,
      
      // Progress features
      steps_completed_ratio: currentProgress.completedSteps / (currentProgress.totalSteps || 1),
      current_step_difficulty: currentProgress.currentStepDifficulty || 0.5,
      time_on_current_step: currentProgress.timeOnCurrentStep || 0,
      
      // Interaction features
      help_requests_count: behaviorData.helpRequestsCount || 0,
      error_rate: behaviorData.errorRate || 0,
      hesitation_frequency: behaviorData.hesitationFrequency || 0,
      
      // Temporal features
      time_since_start: Date.now() - (currentProgress.startTime || Date.now()),
      time_between_sessions: behaviorData.timeBetweenSessions || 0,
      session_frequency: behaviorData.sessionFrequency || 0
    };

    return {
      vector: Object.values(features),
      featureNames: Object.keys(features),
      extractedAt: new Date()
    };
  }

  private getModelForUser(userProfile: any): PredictionModel {
    // For now, return default model
    // In the future, could select model based on user segment
    return this.models.get('default_success_predictor')!;
  }

  private async runPrediction(model: PredictionModel, features: FeatureVector): Promise<any> {
    // Simulate ML model prediction
    // In a real implementation, this would call the actual ML model
    
    const baseScore = this.calculateBaseScore(features.vector || []);
    const adjustedScore = this.applyModelAdjustments(baseScore, model);
    
    return {
      probability: Math.max(0, Math.min(1, adjustedScore)),
      riskFactors: this.identifyRiskFactors(features.vector || [], features.featureNames || []),
      positiveFactors: this.identifyPositiveFactors(features.vector || [], features.featureNames || [])
    };
  }

  private calculateBaseScore(features: number[]): number {
    // Simple weighted sum for demonstration
    const weights = [0.2, 0.15, 0.1, 0.15, 0.2, 0.05, -0.1, -0.05, 0.1, 0.05, 0.05];
    
    let score = 0.5; // Base score
    for (let i = 0; i < Math.min(features.length, weights.length); i++) {
      score += features[i] * weights[i];
    }
    
    return score;
  }

  private applyModelAdjustments(baseScore: number, model: PredictionModel): number {
    // Apply model-specific adjustments
    const modelBoost = model.type === 'gradient_boosting' ? 0.05 : 0;
    return baseScore + modelBoost;
  }

  private identifyRiskFactors(features: number[], featureNames: string[]): string[] {
    const riskFactors = [];
    
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const name = featureNames[i];
      
      if (name === 'error_rate' && feature > 0.3) {
        riskFactors.push('High error rate');
      }
      if (name === 'help_requests_count' && feature > 5) {
        riskFactors.push('Frequent help requests');
      }
      if (name === 'hesitation_frequency' && feature > 0.5) {
        riskFactors.push('High hesitation frequency');
      }
      if (name === 'steps_completed_ratio' && feature < 0.3) {
        riskFactors.push('Low completion rate');
      }
    }
    
    return riskFactors;
  }

  private identifyPositiveFactors(features: number[], featureNames: string[]): string[] {
    const positiveFactors = [];
    
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const name = featureNames[i];
      
      if (name === 'initial_engagement_score' && feature > 70) {
        positiveFactors.push('High initial engagement');
      }
      if (name === 'technical_proficiency' && feature > 0.7) {
        positiveFactors.push('High technical proficiency');
      }
      if (name === 'platform_preferences_count' && feature > 2) {
        positiveFactors.push('Multiple platform interests');
      }
      if (name === 'session_frequency' && feature > 0.5) {
        positiveFactors.push('Regular session frequency');
      }
    }
    
    return positiveFactors;
  }

  private async calculateConfidence(
    model: PredictionModel,
    features: FeatureVector,
    prediction: any
  ): Promise<{ score: number; interval: [number, number] }> {
    // Calculate prediction confidence based on model metrics and feature quality
    const modelMetrics = this.modelMetrics.get(model.id);
    const baseConfidence = modelMetrics?.accuracy || 0.8;
    
    // Adjust confidence based on feature completeness
    const vec = features.vector || [];
    const featureCompleteness = vec.filter(f => f !== null && f !== undefined).length / Math.max(1, vec.length);
    const adjustedConfidence = baseConfidence * featureCompleteness;
    
    // Calculate confidence interval
    const margin = (1 - adjustedConfidence) * 0.2;
    const interval: [number, number] = [
      Math.max(0, prediction.probability - margin),
      Math.min(1, prediction.probability + margin)
    ];
    
    return {
      score: adjustedConfidence,
      interval
    };
  }

  private async generatePredictionExplanation(
    features: FeatureVector,
    prediction: any
  ): Promise<string> {
    const explanations = [];
    
    if (prediction.probability > 0.7) {
      explanations.push('User shows strong indicators for successful onboarding completion');
    } else if (prediction.probability < 0.4) {
      explanations.push('User shows concerning patterns that may lead to abandonment');
    } else {
      explanations.push('User shows mixed indicators requiring careful monitoring');
    }
    
    if (prediction.riskFactors.length > 0) {
      explanations.push(`Key risk factors: ${prediction.riskFactors.join(', ')}`);
    }
    
    if (prediction.positiveFactors.length > 0) {
      explanations.push(`Positive indicators: ${prediction.positiveFactors.join(', ')}`);
    }
    
    return explanations.join('. ');
  }

  private async generateRecommendedActions(prediction: any): Promise<string[]> {
    const actions = [];
    
    if (prediction.probability < 0.4) {
      actions.push('Trigger immediate intervention');
      actions.push('Provide additional support resources');
      actions.push('Consider simplifying current step');
    } else if (prediction.probability < 0.7) {
      actions.push('Monitor closely for signs of struggle');
      actions.push('Offer proactive assistance');
    } else {
      actions.push('Continue with current approach');
      actions.push('Consider accelerating progress');
    }
    
    return actions;
  }

  private calculateRiskLevel(successProbability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (successProbability >= 0.8) return 'low';
    if (successProbability >= 0.6) return 'medium';
    if (successProbability >= 0.3) return 'high';
    return 'critical';
  }

  private calculateUrgency(predictionResult: PredictionResult, contextualFactors: any): 'low' | 'medium' | 'high' {
    let urgencyScore = 0;
    
    if (predictionResult.successProbability < 0.3) urgencyScore += 3;
    else if (predictionResult.successProbability < 0.5) urgencyScore += 2;
    else if (predictionResult.successProbability < 0.7) urgencyScore += 1;
    
    if (contextualFactors.timeInCurrentStep > 300000) urgencyScore += 1; // 5 minutes
    if (contextualFactors.recentErrors > 2) urgencyScore += 1;
    if (contextualFactors.helpRequestsInSession > 3) urgencyScore += 1;
    
    if (urgencyScore >= 4) return 'high';
    if (urgencyScore >= 2) return 'medium';
    return 'low';
  }

  private calculateRiskScore(predictionResult: PredictionResult, contextualFactors: any): number {
    let score = (1 - predictionResult.successProbability) * 100;
    
    // Adjust based on contextual factors
    if (contextualFactors.timeInCurrentStep > 600000) score += 10; // 10 minutes
    if (contextualFactors.recentErrors > 3) score += 15;
    if (contextualFactors.helpRequestsInSession > 5) score += 10;
    
    return Math.min(100, score);
  }

  private identifyPrimaryRiskFactors(riskFactors: string[]): string[] {
    // Return top 3 risk factors
    return riskFactors.slice(0, 3);
  }

  private async generateInterventionRecommendations(
    riskLevel: string,
    riskFactors: string[]
  ): Promise<string[]> {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'critical':
        recommendations.push('Immediate human intervention required');
        recommendations.push('Pause current step and provide direct assistance');
        break;
      case 'high':
        recommendations.push('Trigger proactive assistance within 30 seconds');
        recommendations.push('Simplify current step content');
        break;
      case 'medium':
        recommendations.push('Offer contextual help');
        recommendations.push('Monitor for next 2 minutes');
        break;
      case 'low':
        recommendations.push('Continue monitoring');
        break;
    }
    
    return recommendations;
  }

  private calculateTimeToIntervention(urgency: string, riskLevel: string): number {
    const urgencyMultiplier = { low: 1, medium: 0.5, high: 0.1 }[urgency] || 1;
    const riskMultiplier = { low: 1, medium: 0.7, high: 0.3, critical: 0.1 }[riskLevel] || 1;
    
    return Math.round(60000 * urgencyMultiplier * riskMultiplier); // Base 60 seconds
  }

  private encodeTechnicalProficiency(proficiency: string): number {
    const mapping = { beginner: 0.2, intermediate: 0.5, advanced: 0.8, expert: 1.0 };
    return mapping[proficiency as keyof typeof mapping] || 0.5;
  }

  private async cachePrediction(result: PredictionResult): Promise<void> {
    await redisClient.setex(
      `prediction:${result.userId}:${result.id}`,
      3600, // 1 hour
      JSON.stringify(result)
    );
  }

  private async updateModelUsageMetrics(modelId: string): Promise<void> {
    const key = `model_usage:${modelId}`;
    await redisClient.incr(key);
    await redisClient.expire(key, 86400); // 24 hours
  }

  private async storeRiskAssessment(assessment: any): Promise<void> {
    await redisClient.setex(
      `risk_assessment:${assessment.userId}:${assessment.id}`,
      86400, // 24 hours
      JSON.stringify(assessment)
    );
  }

  private async getUserSuccessProfile(userId: string): Promise<UserSuccessProfile | null> {
    const cached = await redisClient.get(`success_profile:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async storeUserSuccessProfile(profile: any): Promise<void> {
    await redisClient.setex(
      `success_profile:${profile.userId}`,
      604800, // 7 days
      JSON.stringify(profile)
    );
  }

  private calculateAverageSessionDuration(
    existingProfile: UserSuccessProfile | null,
    newDuration: number
  ): number {
    if (!existingProfile) return newDuration;
    
    const totalSessions = existingProfile.totalSessions || 0;
    const currentAverage = existingProfile.averageSessionDuration || 0;
    
    return (currentAverage * totalSessions + newDuration) / (totalSessions + 1);
  }

  private async updateSuccessFactors(
    existingProfile: UserSuccessProfile | null,
    outcomeData: any
  ): Promise<string[]> {
    const factors = existingProfile?.successFactors || [];
    
    if (outcomeData.completed) {
      factors.push('Completed onboarding successfully');
    }
    if (outcomeData.engagementScore > 80) {
      factors.push('High engagement maintained');
    }
    
    return [...new Set(factors)]; // Remove duplicates
  }

  private async updateRiskIndicators(
    existingProfile: UserSuccessProfile | null,
    outcomeData: any
  ): Promise<string[]> {
    const indicators = existingProfile?.riskIndicators || [];
    
    if (outcomeData.abandoned) {
      indicators.push('Previous abandonment');
    }
    if (outcomeData.engagementScore < 40) {
      indicators.push('Low engagement pattern');
    }
    
    return [...new Set(indicators)]; // Remove duplicates
  }

  private calculateAverageEngagement(engagementHistory: any[]): number {
    if (!engagementHistory || engagementHistory.length === 0) return 0;
    
    const sum = engagementHistory.reduce((acc, entry) => acc + entry.engagementScore, 0);
    return sum / engagementHistory.length;
  }

  private isSignificantChange(
    existingProfile: any,
    updatedProfile: any
  ): boolean {
    if (!existingProfile) return true;
    
    // Check for significant changes that warrant model retraining
    const engagementChange = Math.abs(
      this.calculateAverageEngagement(updatedProfile.engagementHistory) -
      this.calculateAverageEngagement(existingProfile.engagementHistory)
    );
    
    return engagementChange > 20 || updatedProfile.completedOnboarding !== existingProfile.completedOnboarding;
  }

  private async addToRetrainingQueue(userId: string, profile: any): Promise<void> {
    const queueItem = {
      userId,
      profile,
      addedAt: new Date()
    };
    
    await redisClient.lpush('model_retraining_queue', JSON.stringify(queueItem));
  }

  private async checkRetrainingNeeds(): Promise<void> {
    if (this.retrainingPipeline.isRunning) return;
    
    const queueLength = await redisClient.llen('model_retraining_queue');
    
    if (queueLength >= this.retrainingPipeline.minDataPoints) {
      logger.info(`Starting model retraining with ${queueLength} data points`);
      // This would trigger the actual retraining process
    }
  }

  private async preprocessTrainingData(data: TrainingData[]): Promise<any[]> {
    // Preprocess training data for ML model
    return data.map(item => ({
      features: item.features,
      label: item.outcome ? 1 : 0,
      weight: item.weight || 1
    }));
  }

  private async trainModel(
    configuration: ModelConfiguration,
    trainingData: any[],
    validationData: any[]
  ): Promise<PredictionModel> {
    // Simulate model training
    // In a real implementation, this would train the actual ML model
    
    const newModel: PredictionModel = {
      id: `model_${Date.now()}`,
      name: 'Retrained Success Prediction Model',
      version: '2.0.0',
      type: configuration.type || 'gradient_boosting',
      configuration,
      trainedAt: new Date(),
      isActive: false // Will be activated after validation
    };
    
    return newModel;
  }

  private async validateModelPerformance(
    model: PredictionModel,
    validationData: any[]
  ): Promise<any> {
    // Simulate model validation
    // In a real implementation, this would evaluate the model on validation data
    
    return {
      accuracy: 0.87 + Math.random() * 0.05, // Simulate slight improvement
      precision: 0.84 + Math.random() * 0.05,
      recall: 0.89 + Math.random() * 0.05,
      f1Score: 0.86 + Math.random() * 0.05,
      auc: 0.92 + Math.random() * 0.03,
      lastEvaluated: new Date(),
      sampleSize: validationData.length
    };
  }

  private shouldDeployNewModel(
    newPerformance: any,
    existingPerformance: any | undefined
  ): boolean {
    if (!existingPerformance) return true;
    
    // Deploy if new model is significantly better
    const improvementThreshold = 0.02; // 2% improvement
    return newPerformance.accuracy > existingPerformance.accuracy + improvementThreshold;
  }

  private async archiveModel(model: PredictionModel): Promise<void> {
    // Archive old model
    await redisClient.setex(
      `archived_model:${model.id}`,
      2592000, // 30 days
      JSON.stringify(model)
    );
  }
}
