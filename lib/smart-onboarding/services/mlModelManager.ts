import { MLModel, ModelMetrics, PredictionRequest, PredictionResult } from '../types';
import { modelVersioningService } from './modelVersioningService';
import { modelDeploymentService } from './modelDeploymentService';
import { logger } from '../../utils/logger';

export interface ModelLoadBalancer {
  modelType: string;
  endpoints: ModelEndpoint[];
  currentIndex: number;
  strategy: 'round_robin' | 'weighted' | 'least_connections';
}

export interface ModelEndpoint {
  id: string;
  modelVersion: string;
  url: string;
  weight: number;
  connections: number;
  responseTime: number;
  errorRate: number;
  isHealthy: boolean;
}

export interface ModelCache {
  modelType: string;
  modelVersion: string;
  model: MLModel;
  loadedAt: Date;
  lastUsed: Date;
  hitCount: number;
}

class MLModelManager {
  private loadBalancers = new Map<string, ModelLoadBalancer>();
  private modelCache = new Map<string, ModelCache>();
  private maxCacheSize = 10;
  private cacheTimeout = 3600000; // 1 hour

  constructor() {
    this.startCacheCleanup();
  }

  async predict(request: PredictionRequest): Promise<PredictionResult> {
    try {
      // Get the appropriate model endpoint
      const endpoint = await this.getModelEndpoint(request.modelType);
      if (!endpoint) {
        throw new Error(`No healthy endpoint available for model type: ${request.modelType}`);
      }

      // Load model if not cached
      const model = await this.loadModel(request.modelType, endpoint.modelVersion);
      
      // Make prediction
      const result = await this.makePrediction(model, request);
      
      // Update endpoint metrics
      this.updateEndpointMetrics(endpoint, true, result.responseTime);
      
      return result;

    } catch (error) {
      logger.error('Prediction failed', { error, request });
      
      // Update endpoint metrics for failure
      const endpoint = await this.getModelEndpoint(request.modelType);
      if (endpoint) {
        this.updateEndpointMetrics(endpoint, false, 0);
      }
      
      throw error;
    }
  }

  async loadModel(modelType: string, modelVersion?: string): Promise<MLModel> {
    const cacheKey = `${modelType}:${modelVersion || 'latest'}`;
    
    // Check cache first
    const cached = this.modelCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      cached.lastUsed = new Date();
      cached.hitCount++;
      return cached.model;
    }

    // Load model from versioning service
    let model: MLModel;
    if (modelVersion) {
      const versionData = await modelVersioningService.getVersion(modelVersion);
      if (!versionData) {
        throw new Error(`Model version not found: ${modelVersion}`);
      }
      model = versionData.model;
    } else {
      const currentVersion = await modelVersioningService.getCurrentProductionVersion(modelType);
      if (!currentVersion) {
        throw new Error(`No production model available for type: ${modelType}`);
      }
      model = currentVersion.model;
    }

    // Cache the model
    this.cacheModel(cacheKey, model, modelVersion || 'latest');
    
    logger.info(`Model loaded: ${modelType}:${modelVersion || 'latest'}`);
    
    return model;
  }

  private async getModelEndpoint(modelType: string): Promise<ModelEndpoint | null> {
    let loadBalancer = this.loadBalancers.get(modelType);
    
    if (!loadBalancer) {
      // Initialize load balancer for this model type
      loadBalancer = await this.initializeLoadBalancer(modelType);
      this.loadBalancers.set(modelType, loadBalancer);
    }

    // Update endpoints from deployment service
    await this.updateLoadBalancerEndpoints(loadBalancer);
    
    // Select endpoint based on strategy
    return this.selectEndpoint(loadBalancer);
  }

  private async initializeLoadBalancer(modelType: string): Promise<ModelLoadBalancer> {
    const deploymentEndpoints = await modelDeploymentService.getModelEndpoints(modelType);
    
    const endpoints: ModelEndpoint[] = deploymentEndpoints
      .filter(e => e.status === 'active')
      .map(e => ({
        id: e.id,
        modelVersion: e.modelVersion,
        url: e.url,
        weight: e.trafficPercentage,
        connections: 0,
        responseTime: 0,
        errorRate: 0,
        isHealthy: e.healthStatus === 'healthy'
      }));

    return {
      modelType,
      endpoints,
      currentIndex: 0,
      strategy: 'weighted'
    };
  }

  private async updateLoadBalancerEndpoints(loadBalancer: ModelLoadBalancer): Promise<void> {
    const deploymentEndpoints = await modelDeploymentService.getModelEndpoints(loadBalancer.modelType);
    
    // Update existing endpoints and add new ones
    const updatedEndpoints = new Map<string, ModelEndpoint>();
    
    // Keep existing endpoint metrics
    for (const endpoint of loadBalancer.endpoints) {
      updatedEndpoints.set(endpoint.id, endpoint);
    }
    
    // Update with latest deployment info
    for (const deploymentEndpoint of deploymentEndpoints) {
      if (deploymentEndpoint.status === 'active') {
        const existing = updatedEndpoints.get(deploymentEndpoint.id);
        if (existing) {
          existing.weight = deploymentEndpoint.trafficPercentage;
          existing.isHealthy = deploymentEndpoint.healthStatus === 'healthy';
        } else {
          updatedEndpoints.set(deploymentEndpoint.id, {
            id: deploymentEndpoint.id,
            modelVersion: deploymentEndpoint.modelVersion,
            url: deploymentEndpoint.url,
            weight: deploymentEndpoint.trafficPercentage,
            connections: 0,
            responseTime: 0,
            errorRate: 0,
            isHealthy: deploymentEndpoint.healthStatus === 'healthy'
          });
        }
      }
    }
    
    loadBalancer.endpoints = Array.from(updatedEndpoints.values())
      .filter(e => e.weight > 0 && e.isHealthy);
  }

  private selectEndpoint(loadBalancer: ModelLoadBalancer): ModelEndpoint | null {
    const healthyEndpoints = loadBalancer.endpoints.filter(e => e.isHealthy && e.weight > 0);
    
    if (healthyEndpoints.length === 0) {
      return null;
    }

    switch (loadBalancer.strategy) {
      case 'round_robin':
        return this.selectRoundRobin(loadBalancer, healthyEndpoints);
      case 'weighted':
        return this.selectWeighted(healthyEndpoints);
      case 'least_connections':
        return this.selectLeastConnections(healthyEndpoints);
      default:
        return healthyEndpoints[0];
    }
  }

  private selectRoundRobin(loadBalancer: ModelLoadBalancer, endpoints: ModelEndpoint[]): ModelEndpoint {
    const endpoint = endpoints[loadBalancer.currentIndex % endpoints.length];
    loadBalancer.currentIndex++;
    return endpoint;
  }

  private selectWeighted(endpoints: ModelEndpoint[]): ModelEndpoint {
    const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return endpoints[0];
  }

  private selectLeastConnections(endpoints: ModelEndpoint[]): ModelEndpoint {
    return endpoints.reduce((min, current) => 
      current.connections < min.connections ? current : min
    );
  }

  private async makePrediction(model: MLModel, request: PredictionRequest): Promise<PredictionResult> {
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would use the actual ML model
      // For now, we'll simulate predictions based on model type
      const prediction = await this.simulatePrediction(model, request);
      
      const responseTime = Date.now() - startTime;
      
      return {
        modelType: request.modelType,
        modelVersion: model.version,
        prediction,
        confidence: 0.85 + Math.random() * 0.1,
        responseTime,
        timestamp: new Date()
      };

    } catch (error) {
      throw new Error(`Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async simulatePrediction(model: MLModel, request: PredictionRequest): Promise<any> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    switch (model.type) {
      case 'persona_classification':
        return this.simulatePersonaPrediction(request.features);
      case 'success_prediction':
        return this.simulateSuccessPrediction(request.features);
      case 'engagement_scoring':
        return this.simulateEngagementPrediction(request.features);
      case 'path_optimization':
        return this.simulatePathPrediction(request.features);
      default:
        return { result: 'unknown' };
    }
  }

  private simulatePersonaPrediction(features: any): any {
    const personas = ['technical_expert', 'business_user', 'creative_professional', 'social_media_manager', 'entrepreneur'];
    return {
      persona: personas[Math.floor(Math.random() * personas.length)],
      probabilities: personas.reduce((acc, persona) => {
        acc[persona] = Math.random();
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private simulateSuccessPrediction(features: any): any {
    return {
      successProbability: Math.random(),
      riskFactors: ['low_engagement', 'complex_setup'].filter(() => Math.random() > 0.7),
      recommendedInterventions: ['contextual_help', 'simplified_flow'].filter(() => Math.random() > 0.5)
    };
  }

  private simulateEngagementPrediction(features: any): any {
    return {
      engagementScore: Math.random() * 100,
      attentionLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      struggleIndicators: ['hesitation', 'backtracking'].filter(() => Math.random() > 0.8)
    };
  }

  private simulatePathPrediction(features: any): any {
    const steps = ['profile_setup', 'platform_connection', 'content_creation', 'analytics_setup', 'advanced_features'];
    return {
      nextStep: steps[Math.floor(Math.random() * steps.length)],
      alternativePaths: steps.filter(() => Math.random() > 0.6),
      estimatedDuration: Math.floor(Math.random() * 300) + 60 // 1-5 minutes
    };
  }

  private updateEndpointMetrics(endpoint: ModelEndpoint, success: boolean, responseTime: number): void {
    endpoint.connections++;
    
    if (success) {
      // Update response time with exponential moving average
      endpoint.responseTime = endpoint.responseTime * 0.9 + responseTime * 0.1;
      // Decrease error rate
      endpoint.errorRate = endpoint.errorRate * 0.95;
    } else {
      // Increase error rate
      endpoint.errorRate = endpoint.errorRate * 0.9 + 0.1;
    }
    
    // Update health status based on metrics
    endpoint.isHealthy = endpoint.errorRate < 0.05 && endpoint.responseTime < 1000;
    
    // Decrease connection count after some time
    setTimeout(() => {
      endpoint.connections = Math.max(0, endpoint.connections - 1);
    }, 5000);
  }

  private cacheModel(cacheKey: string, model: MLModel, modelVersion: string): void {
    // Remove oldest cache entry if at capacity
    if (this.modelCache.size >= this.maxCacheSize) {
      const oldestKey = Array.from(this.modelCache.entries())
        .sort(([, a], [, b]) => a.lastUsed.getTime() - b.lastUsed.getTime())[0][0];
      this.modelCache.delete(oldestKey);
    }

    this.modelCache.set(cacheKey, {
      modelType: model.type,
      modelVersion,
      model,
      loadedAt: new Date(),
      lastUsed: new Date(),
      hitCount: 0
    });
  }

  private isCacheValid(cached: ModelCache): boolean {
    const age = Date.now() - cached.loadedAt.getTime();
    return age < this.cacheTimeout;
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.modelCache.entries()) {
        const age = now - cached.lastUsed.getTime();
        if (age > this.cacheTimeout) {
          this.modelCache.delete(key);
          logger.debug(`Removed expired model from cache: ${key}`);
        }
      }
    }, 300000); // Clean every 5 minutes
  }

  async getModelStats(modelType?: string): Promise<any> {
    const stats = {
      cacheSize: this.modelCache.size,
      loadBalancers: Array.from(this.loadBalancers.keys()),
      endpoints: {} as Record<string, any>
    };

    for (const [type, loadBalancer] of this.loadBalancers.entries()) {
      if (!modelType || type === modelType) {
        stats.endpoints[type] = {
          strategy: loadBalancer.strategy,
          endpointCount: loadBalancer.endpoints.length,
          healthyEndpoints: loadBalancer.endpoints.filter(e => e.isHealthy).length,
          totalWeight: loadBalancer.endpoints.reduce((sum, e) => sum + e.weight, 0),
          averageResponseTime: loadBalancer.endpoints.reduce((sum, e) => sum + e.responseTime, 0) / loadBalancer.endpoints.length || 0,
          averageErrorRate: loadBalancer.endpoints.reduce((sum, e) => sum + e.errorRate, 0) / loadBalancer.endpoints.length || 0
        };
      }
    }

    return stats;
  }

  async warmupModels(modelTypes: string[]): Promise<void> {
    logger.info('Warming up models', { modelTypes });
    
    for (const modelType of modelTypes) {
      try {
        await this.loadModel(modelType);
        logger.info(`Model warmed up: ${modelType}`);
      } catch (error) {
        logger.error(`Failed to warm up model: ${modelType}`, { error });
      }
    }
  }
}

export const mlModelManager = new MLModelManager();