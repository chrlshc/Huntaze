// Smart Onboarding System - Dynamic Path Optimization Service

import { Pool } from 'pg';
import { PathVariation } from '../interfaces/services';
import {
  OnboardingJourney,
  LearningPath,
  BehaviorEvent,
  UserPersona,
  PersonaType,
  PathEffectiveness
} from '../types';
import { smartOnboardingCache } from '../config/redis';
import { smartOnboardingDb } from '../config/database';

// A/B Testing Framework for Path Optimization
// Local interfaces for missing service types
interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  variations: PathVariation[];
  targetPersonas: PersonaType[];
  trafficAllocation: number[];
  metrics: {
    totalParticipants: number;
    completionRates: Record<string, number>;
    engagementScores: Record<string, number>;
    timeToCompletion: Record<string, number>;
    userSatisfaction: Record<string, number>;
  };
  startDate: Date;
  endDate: Date | null;
  statisticalSignificance: number;
  winningVariation: string | null;
}

interface OptimizationResult {
  personaType: PersonaType;
  currentBestPath: string;
  optimizationOpportunities: any;
  newVariations: PathVariation[];
  experimentId: string;
  expectedImprovement: number;
}

class ABTestingFramework {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createExperiment(
    name: string,
    description: string,
    variations: PathVariation[],
    targetPersonas: PersonaType[],
    trafficAllocation: number[]
  ): Promise<ABTestExperiment> {
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const experiment: ABTestExperiment = {
      id: experimentId,
      name,
      description,
      status: 'active',
      variations,
      targetPersonas,
      trafficAllocation,
      metrics: {
        totalParticipants: 0,
        completionRates: {},
        engagementScores: {},
        timeToCompletion: {},
        userSatisfaction: {}
      },
      startDate: new Date(),
      endDate: null,
      statisticalSignificance: 0,
      winningVariation: null
    };

    // Store experiment
    await this.storeExperiment(experiment);
    
    return experiment;
  }

  async assignUserToVariation(
    experimentId: string, 
    userId: string, 
    persona: UserPersona
  ): Promise<string> {
    const experiment = await this.getExperiment(experimentId);
    
    if (!experiment || experiment.status !== 'active') {
      return experiment?.variations[0]?.id || 'default';
    }

    // Check if user is in target personas
    if (!experiment.targetPersonas.includes(persona.personaType)) {
      return experiment.variations[0]?.id || 'default';
    }

    // Check if user already assigned
    const existingAssignment = await this.getUserAssignment(experimentId, userId);
    if (existingAssignment) {
      return existingAssignment;
    }

    // Assign based on traffic allocation
    const variationId = this.selectVariationByTraffic(experiment);
    
    // Store assignment
    await this.storeUserAssignment(experimentId, userId, variationId);
    
    return variationId;
  }

  async recordExperimentResult(
    experimentId: string,
    userId: string,
    variationId: string,
    metrics: {
      completed: boolean;
      completionTime: number;
      engagementScore: number;
      satisfactionScore?: number;
    }
  ): Promise<void> {
    // Store individual result
    await this.storeExperimentResult(experimentId, userId, variationId, metrics);
    
    // Update experiment metrics
    await this.updateExperimentMetrics(experimentId);
    
    // Check for statistical significance
    await this.checkStatisticalSignificance(experimentId);
  }

  async getExperimentResults(experimentId: string): Promise<ABTestExperiment> {
    const exp = await this.getExperiment(experimentId);
    if (!exp) {
      return {
        id: experimentId,
        name: 'unknown',
        description: 'not found',
        status: 'completed',
        variations: [],
        targetPersonas: [],
        trafficAllocation: [],
        metrics: {
          totalParticipants: 0,
          completionRates: {},
          engagementScores: {},
          timeToCompletion: {},
          userSatisfaction: {}
        },
        startDate: new Date(0),
        endDate: new Date(0),
        statisticalSignificance: 0,
        winningVariation: null
      };
    }
    return exp;
  }

  private selectVariationByTraffic(experiment: ABTestExperiment): string {
    const random = Math.random();
    let cumulativeAllocation = 0;
    
    for (let i = 0; i < experiment.variations.length; i++) {
      cumulativeAllocation += experiment.trafficAllocation[i];
      if (random <= cumulativeAllocation) {
        return experiment.variations[i].id;
      }
    }
    
    return experiment.variations[0].id;
  }

  private async storeExperiment(experiment: ABTestExperiment): Promise<void> {
    const query = `
      INSERT INTO smart_onboarding_ab_experiments 
      (id, name, description, status, variations, target_personas, traffic_allocation, metrics, start_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await this.db.query(query, [
      experiment.id,
      experiment.name,
      experiment.description,
      experiment.status,
      JSON.stringify(experiment.variations),
      JSON.stringify(experiment.targetPersonas),
      JSON.stringify(experiment.trafficAllocation),
      JSON.stringify(experiment.metrics),
      experiment.startDate
    ]);
  }

  private async getExperiment(experimentId: string): Promise<ABTestExperiment | null> {
    const query = `SELECT * FROM smart_onboarding_ab_experiments WHERE id = $1`;
    const result = await this.db.query(query, [experimentId]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      variations: JSON.parse(row.variations),
      targetPersonas: JSON.parse(row.target_personas),
      trafficAllocation: JSON.parse(row.traffic_allocation),
      metrics: JSON.parse(row.metrics),
      startDate: row.start_date,
      endDate: row.end_date,
      statisticalSignificance: row.statistical_significance || 0,
      winningVariation: row.winning_variation
    };
  }

  private async getUserAssignment(experimentId: string, userId: string): Promise<string | null> {
    const query = `
      SELECT variation_id FROM smart_onboarding_ab_assignments 
      WHERE experiment_id = $1 AND user_id = $2
    `;
    
    const result = await this.db.query(query, [experimentId, userId]);
    return result.rows.length > 0 ? result.rows[0].variation_id : null;
  }

  private async storeUserAssignment(experimentId: string, userId: string, variationId: string): Promise<void> {
    const query = `
      INSERT INTO smart_onboarding_ab_assignments 
      (experiment_id, user_id, variation_id, assigned_at)
      VALUES ($1, $2, $3, NOW())
    `;

    await this.db.query(query, [experimentId, userId, variationId]);
  }

  private async storeExperimentResult(
    experimentId: string,
    userId: string,
    variationId: string,
    metrics: any
  ): Promise<void> {
    const query = `
      INSERT INTO smart_onboarding_ab_results 
      (experiment_id, user_id, variation_id, completed, completion_time, engagement_score, satisfaction_score, recorded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;

    await this.db.query(query, [
      experimentId,
      userId,
      variationId,
      metrics.completed,
      metrics.completionTime,
      metrics.engagementScore,
      metrics.satisfactionScore || null
    ]);
  }

  private async updateExperimentMetrics(experimentId: string): Promise<void> {
    const query = `
      SELECT 
        variation_id,
        COUNT(*) as total_participants,
        AVG(CASE WHEN completed THEN 1.0 ELSE 0.0 END) as completion_rate,
        AVG(engagement_score) as avg_engagement,
        AVG(completion_time) as avg_completion_time,
        AVG(satisfaction_score) as avg_satisfaction
      FROM smart_onboarding_ab_results 
      WHERE experiment_id = $1 
      GROUP BY variation_id
    `;

    const result = await this.db.query(query, [experimentId]);
    
    const metrics: any = {
      totalParticipants: 0,
      completionRates: {},
      engagementScores: {},
      timeToCompletion: {},
      userSatisfaction: {}
    };

    result.rows.forEach((row: any) => {
      metrics.totalParticipants += parseInt(row.total_participants);
      metrics.completionRates[row.variation_id] = parseFloat(row.completion_rate);
      metrics.engagementScores[row.variation_id] = parseFloat(row.avg_engagement);
      metrics.timeToCompletion[row.variation_id] = parseFloat(row.avg_completion_time);
      metrics.userSatisfaction[row.variation_id] = parseFloat(row.avg_satisfaction) || 0;
    });

    const updateQuery = `
      UPDATE smart_onboarding_ab_experiments 
      SET metrics = $1, updated_at = NOW()
      WHERE id = $2
    `;

    await this.db.query(updateQuery, [JSON.stringify(metrics), experimentId]);
  }

  private async checkStatisticalSignificance(experimentId: string): Promise<void> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment || experiment.variations.length < 2) return;

    // Simplified statistical significance calculation
    // In a real implementation, you'd use proper statistical tests
    const minSampleSize = 100;
    const totalParticipants = experiment.metrics.totalParticipants;
    
    if (totalParticipants < minSampleSize) return;

    // Calculate significance based on completion rate differences
    const completionRates = Object.values(experiment.metrics.completionRates);
    const maxRate = Math.max(...completionRates);
    const minRate = Math.min(...completionRates);
    const difference = maxRate - minRate;
    
    // Simple significance calculation (would use proper statistical tests in production)
    const significance = Math.min(0.99, difference * 2 + (totalParticipants / 1000) * 0.1);
    
    if (significance > 0.95) {
      // Find winning variation
      const winningVariationId = Object.keys(experiment.metrics.completionRates)
        .reduce((a, b) => 
          experiment.metrics.completionRates[a] > experiment.metrics.completionRates[b] ? a : b
        );

      const updateQuery = `
        UPDATE smart_onboarding_ab_experiments 
        SET statistical_significance = $1, winning_variation = $2, status = 'completed'
        WHERE id = $3
      `;

      await this.db.query(updateQuery, [significance, winningVariationId, experimentId]);
    }
  }
}

// Path Effectiveness Tracker
class PathEffectivenessTracker {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async trackPathPerformance(
    pathId: string,
    userId: string,
    persona: UserPersona,
    journey: OnboardingJourney
  ): Promise<void> {
    const metrics = this.calculatePathMetrics(journey);
    
    await this.storePathMetrics(pathId, userId, persona.personaType, metrics);
  }

  async getPathEffectiveness(pathId: string, personaType?: PersonaType): Promise<PathEffectiveness> {
    let query = `
      SELECT 
        AVG(completion_rate) as avg_completion_rate,
        AVG(engagement_score) as avg_engagement_score,
        AVG(time_to_completion) as avg_time_to_completion,
        AVG(user_satisfaction) as avg_user_satisfaction,
        COUNT(*) as total_users,
        persona_type
      FROM smart_onboarding_path_metrics 
      WHERE path_id = $1
    `;
    
    const params = [pathId];
    
    if (personaType) {
      query += ` AND persona_type = $2`;
      params.push(personaType);
    }
    
    query += ` GROUP BY persona_type`;
    
    const result = await this.db.query(query, params);
    
    if (result.rows.length === 0) {
      return {
        pathId,
        completionRate: 0,
        averageTimeToComplete: 0,
        averageEngagement: 0,
        userSatisfaction: 0,
        strugglesPerUser: 0,
        interventionsPerUser: 0,
        successRate: 0,
        cohortSize: 0,
        lastEvaluated: new Date(),
        recommendations: []
      };
    }

    // Weighted aggregation
    let totalUsers = 0;
    let sumCompletion = 0;
    let sumEngagement = 0;
    let sumTime = 0;
    let sumSatisfaction = 0;

    for (const row of result.rows) {
      const users = parseInt(row.total_users);
      totalUsers += users;
      sumCompletion += parseFloat(row.avg_completion_rate) * users;
      sumEngagement += parseFloat(row.avg_engagement_score) * users;
      sumTime += parseFloat(row.avg_time_to_completion) * users;
      sumSatisfaction += parseFloat(row.avg_user_satisfaction) * users;
    }

    const completionRate = totalUsers > 0 ? sumCompletion / totalUsers : 0;
    const averageEngagement = totalUsers > 0 ? sumEngagement / totalUsers : 0;
    const averageTimeToComplete = totalUsers > 0 ? sumTime / totalUsers : 0;
    const userSatisfaction = totalUsers > 0 ? sumSatisfaction / totalUsers : 0;

    return {
      pathId,
      completionRate,
      averageTimeToComplete,
      averageEngagement,
      userSatisfaction,
      strugglesPerUser: 0,
      interventionsPerUser: 0,
      successRate: completionRate,
      cohortSize: totalUsers,
      lastEvaluated: new Date(),
      recommendations: []
    };
  }

  async comparePathVariations(pathIds: string[]): Promise<any> {
    const comparisons: Record<string, any> = {};
    
    for (const pathId of pathIds) {
      comparisons[pathId] = await this.getPathEffectiveness(pathId);
    }
    
    return {
      paths: comparisons,
      bestPerforming: this.identifyBestPerformingPath(comparisons),
      recommendations: this.generateOptimizationRecommendations(comparisons)
    };
  }

  private calculatePathMetrics(journey: OnboardingJourney): any {
    const isCompleted = journey.status === 'completed';
    const completionRate = isCompleted ? 1 : 0;
    const engagementScore = journey.engagementHistory?.[journey.engagementHistory.length - 1]?.score ?? 0.5;
    
    // Calculate time to completion
    const startTime = journey.startedAt;
    const endTime = journey.completedAt || new Date();
    const timeToCompletion = (endTime.getTime() - startTime.getTime()) / 1000; // seconds
    
    // Calculate satisfaction based on completion and engagement
    const userSatisfaction = isCompleted ? 
      Math.min(1, (engagementScore + 0.5) / 1.5) : 
      engagementScore * 0.7;

    return {
      completionRate,
      engagementScore,
      timeToCompletion,
      userSatisfaction
    };
  }

  private async storePathMetrics(
    pathId: string,
    userId: string,
    personaType: PersonaType,
    metrics: any
  ): Promise<void> {
    const query = `
      INSERT INTO smart_onboarding_path_metrics 
      (path_id, user_id, persona_type, completion_rate, engagement_score, time_to_completion, user_satisfaction, recorded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (path_id, user_id) 
      DO UPDATE SET 
        completion_rate = EXCLUDED.completion_rate,
        engagement_score = EXCLUDED.engagement_score,
        time_to_completion = EXCLUDED.time_to_completion,
        user_satisfaction = EXCLUDED.user_satisfaction,
        recorded_at = NOW()
    `;

    await this.db.query(query, [
      pathId,
      userId,
      personaType,
      metrics.completionRate,
      metrics.engagementScore,
      metrics.timeToCompletion,
      metrics.userSatisfaction
    ]);
  }

  private identifyBestPerformingPath(comparisons: any): string {
    let bestPath = '';
    let bestScore = 0;
    
    Object.keys(comparisons).forEach(pathId => {
      const metrics = comparisons[pathId];
      // Weighted score combining multiple metrics
      const score = (
        metrics.completionRate * 0.4 +
        metrics.averageEngagement * 0.3 +
        metrics.userSatisfaction * 0.2 +
        (1 / Math.max(1, metrics.averageTimeToCompletion / 3600)) * 0.1 // Prefer faster completion
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestPath = pathId;
      }
    });
    
    return bestPath;
  }

  private generateOptimizationRecommendations(comparisons: any): string[] {
    const recommendations = [];
    
    // Analyze patterns across paths
    const allPaths = Object.values(comparisons) as any[];
    const avgCompletion = allPaths.reduce((sum, path: any) => sum + path.completionRate, 0) / allPaths.length;
    const avgEngagement = allPaths.reduce((sum, path: any) => sum + path.averageEngagement, 0) / allPaths.length;
    
    if (avgCompletion < 0.7) {
      recommendations.push('Consider simplifying onboarding steps to improve completion rates');
    }
    
    if (avgEngagement < 0.6) {
      recommendations.push('Add more interactive elements to boost user engagement');
    }
    
    // Find paths with high engagement but low completion
    Object.keys(comparisons).forEach(pathId => {
      const metrics = comparisons[pathId];
      if (metrics.averageEngagement > 0.7 && metrics.completionRate < 0.6) {
        recommendations.push(`Path ${pathId}: High engagement but low completion - consider reducing length or complexity`);
      }
    });
    
    return recommendations;
  }
}

// Continuous Optimization Engine
class ContinuousOptimizationEngine {
  private db: Pool;
  private abTesting: ABTestingFramework;
  private effectivenessTracker: PathEffectivenessTracker;

  constructor(db: Pool) {
    this.db = db;
    this.abTesting = new ABTestingFramework(db);
    this.effectivenessTracker = new PathEffectivenessTracker(db);
  }

  async optimizePathForPersona(personaType: PersonaType): Promise<OptimizationResult> {
    // Get current path performance for persona
    const currentPaths = await this.getCurrentPathsForPersona(personaType);
    const pathComparison: any = await this.effectivenessTracker.comparePathVariations(currentPaths);
    
    // Identify optimization opportunities
    const opportunities: any = this.identifyOptimizationOpportunities(pathComparison, personaType);
    
    // Generate new path variations
    const newVariations = await this.generatePathVariations(opportunities, personaType);
    
    // Create A/B test experiment
    const experiment = await this.createOptimizationExperiment(personaType, newVariations);
    
    return {
      personaType,
      currentBestPath: pathComparison.bestPerforming,
      optimizationOpportunities: opportunities,
      newVariations,
      experimentId: experiment.id,
      expectedImprovement: this.calculateExpectedImprovement(opportunities)
    };
  }

  async runContinuousOptimization(): Promise<void> {
    // Get all active personas
    const personas: PersonaType[] = ['content_creator', 'business_user', 'influencer', 'agency', 'casual_user'];
    
    for (const persona of personas) {
      try {
        // Check if optimization is needed
        const needsOptimization = await this.checkOptimizationNeed(persona);
        
        if (needsOptimization) {
          await this.optimizePathForPersona(persona);
        }
      } catch (error) {
        console.error(`Error optimizing path for persona ${persona}:`, error);
      }
    }
  }

  private async getCurrentPathsForPersona(personaType: PersonaType): Promise<string[]> {
    const query = `
      SELECT DISTINCT path_id 
      FROM smart_onboarding_path_metrics 
      WHERE persona_type = $1 
      AND recorded_at > NOW() - INTERVAL '30 days'
    `;
    
    const result = await this.db.query(query, [personaType]);
    return result.rows.map(row => row.path_id);
  }

  private identifyOptimizationOpportunities(pathComparison: any, personaType: PersonaType): any[] {
    const opportunities: any[] = [];
    const bestPath = pathComparison.paths[pathComparison.bestPerforming];
    
    if (!bestPath) return opportunities;
    
    // Low completion rate opportunity
    if (bestPath.completionRate < 0.8) {
      opportunities.push({
        type: 'completion_rate',
        current: bestPath.completionRate,
        target: 0.85,
        strategy: 'simplify_steps'
      });
    }
    
    // Low engagement opportunity
    if (bestPath.averageEngagement < 0.7) {
      opportunities.push({
        type: 'engagement',
        current: bestPath.averageEngagement,
        target: 0.8,
        strategy: 'add_interactivity'
      });
    }
    
    // Long completion time opportunity
    if (bestPath.averageTimeToCompletion > 1800) { // 30 minutes
      opportunities.push({
        type: 'completion_time',
        current: bestPath.averageTimeToCompletion,
        target: 1200, // 20 minutes
        strategy: 'streamline_content'
      });
    }
    
    return opportunities;
  }

  private async generatePathVariations(opportunities: any[], personaType: PersonaType): Promise<PathVariation[]> {
    const variations: PathVariation[] = [];
    
    opportunities.forEach((opportunity, index) => {
      const variation: PathVariation = {
        id: `opt_${personaType}_${opportunity.type}_${Date.now()}_${index}`,
        name: `Optimized for ${opportunity.type}`,
        steps: [],
        targetPersona: [personaType]
      };
      
      variations.push(variation);
    });
    
    return variations;
  }

  private generatePathConfiguration(opportunity: any, personaType: PersonaType): any {
    const baseConfig = {
      personaType,
      optimizationTarget: opportunity.type,
      strategy: opportunity.strategy
    };
    
    switch (opportunity.strategy) {
      case 'simplify_steps':
        return {
          ...baseConfig,
          modifications: {
            reduceStepCount: true,
            combineSimpleSteps: true,
            removeOptionalSteps: true
          }
        };
        
      case 'add_interactivity':
        return {
          ...baseConfig,
          modifications: {
            addInteractiveElements: true,
            includeProgressCelebrations: true,
            addGamificationElements: true
          }
        };
        
      case 'streamline_content':
        return {
          ...baseConfig,
          modifications: {
            shortenExplanations: true,
            useVideoInsteadOfText: true,
            parallelizeSteps: true
          }
        };
        
      default:
        return baseConfig;
    }
  }

  private async createOptimizationExperiment(
    personaType: PersonaType, 
    variations: PathVariation[]
  ): Promise<ABTestExperiment> {
    // Add control variation (current best path)
    const controlVariation: PathVariation = {
      id: `control_${personaType}_${Date.now()}`,
      name: 'Control (Current Path)',
      steps: [],
      targetPersona: [personaType]
    };
    
    const allVariations = [controlVariation, ...variations];
    const trafficAllocation = this.calculateTrafficAllocation(allVariations.length);
    
    return await this.abTesting.createExperiment(
      `Path Optimization for ${personaType}`,
      `Continuous optimization experiment for ${personaType} persona`,
      allVariations,
      [personaType],
      trafficAllocation
    );
  }

  private calculateTrafficAllocation(variationCount: number): number[] {
    // Equal allocation with slight preference for control
    const controlAllocation = 0.4;
    const testAllocation = (1 - controlAllocation) / (variationCount - 1);
    
    return [controlAllocation, ...Array(variationCount - 1).fill(testAllocation)];
  }

  private calculateExpectedImprovement(opportunities: any[]): number {
    if (opportunities.length === 0) return 0;
    
    // Calculate weighted expected improvement
    const improvements = opportunities.map(opp => {
      const currentValue = opp.current;
      const targetValue = opp.target;
      return (targetValue - currentValue) / currentValue;
    });
    
    return improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
  }

  private async checkOptimizationNeed(personaType: PersonaType): Promise<boolean> {
    // Check if there's been enough data since last optimization
    const query = `
      SELECT COUNT(*) as user_count, MAX(recorded_at) as last_recorded
      FROM smart_onboarding_path_metrics 
      WHERE persona_type = $1 
      AND recorded_at > NOW() - INTERVAL '7 days'
    `;
    
    const result = await this.db.query(query, [personaType]);
    const row = result.rows[0];
    
    const userCount = parseInt(row.user_count);
    const lastRecorded = row.last_recorded;
    
    // Need optimization if we have enough recent data (>50 users in last week)
    return userCount > 50;
  }
}

// Main Dynamic Path Optimizer Implementation
export class DynamicPathOptimizerImpl {
  private db: Pool;
  private abTesting: ABTestingFramework;
  private effectivenessTracker: PathEffectivenessTracker;
  private continuousOptimizer: ContinuousOptimizationEngine;

  constructor() {
    this.db = smartOnboardingDb.getPool();
    this.abTesting = new ABTestingFramework(this.db);
    this.effectivenessTracker = new PathEffectivenessTracker(this.db);
    this.continuousOptimizer = new ContinuousOptimizationEngine(this.db);
  }

  async optimizePath(personaType: PersonaType): Promise<OptimizationResult> {
    return await this.continuousOptimizer.optimizePathForPersona(personaType);
  }

  async createABTest(
    name: string,
    variations: PathVariation[],
    targetPersonas: PersonaType[]
  ): Promise<ABTestExperiment> {
    const trafficAllocation = Array(variations.length).fill(1 / variations.length);
    
    return await this.abTesting.createExperiment(
      name,
      `A/B test for path variations`,
      variations,
      targetPersonas,
      trafficAllocation
    );
  }

  async assignUserToVariation(experimentId: string, userId: string, persona: UserPersona): Promise<string> {
    return await this.abTesting.assignUserToVariation(experimentId, userId, persona);
  }

  async recordTestResult(
    experimentId: string,
    userId: string,
    variationId: string,
    journey: OnboardingJourney
  ): Promise<void> {
    const lastEngagement = journey.engagementHistory?.[journey.engagementHistory.length - 1]?.score ?? 0.5;
    const metrics = {
      completed: journey.status === 'completed',
      completionTime: this.calculateCompletionTime(journey),
      engagementScore: lastEngagement,
      satisfactionScore: this.calculateSatisfactionScore(journey)
    };

    await this.abTesting.recordExperimentResult(experimentId, userId, variationId, metrics);
  }

  async getExperimentResults(experimentId: string): Promise<ABTestExperiment> {
    const exp = await this.abTesting.getExperimentResults(experimentId);
    if (!exp) {
      // Return an empty placeholder experiment to satisfy return type
      return {
        id: experimentId,
        name: 'unknown',
        description: 'not found',
        status: 'completed',
        variations: [],
        targetPersonas: [],
        trafficAllocation: [],
        metrics: {
          totalParticipants: 0,
          completionRates: {},
          engagementScores: {},
          timeToCompletion: {},
          userSatisfaction: {}
        },
        startDate: new Date(0),
        endDate: new Date(0),
        statisticalSignificance: 0,
        winningVariation: null
      };
    }
    return exp;
  }

  async trackPathEffectiveness(pathId: string, userId: string, persona: UserPersona, journey: OnboardingJourney): Promise<void> {
    await this.effectivenessTracker.trackPathPerformance(pathId, userId, persona, journey);
  }

  async getPathMetrics(pathId: string, personaType?: PersonaType): Promise<PathEffectiveness> {
    return await this.effectivenessTracker.getPathEffectiveness(pathId, personaType);
  }

  async runContinuousOptimization(): Promise<void> {
    await this.continuousOptimizer.runContinuousOptimization();
  }

  private calculateCompletionTime(journey: OnboardingJourney): number {
    const startTime = journey.startedAt;
    const endTime = journey.completedAt || new Date();
    return (endTime.getTime() - startTime.getTime()) / 1000; // seconds
  }

  private calculateSatisfactionScore(journey: OnboardingJourney): number {
    // Calculate satisfaction based on completion, engagement, and time efficiency
    const completionBonus = journey.status === 'completed' ? 0.3 : 0;
    const lastEngagement = journey.engagementHistory?.[journey.engagementHistory.length - 1]?.score ?? 0.5;
    const engagementScore = lastEngagement * 0.5;
    
    // Time efficiency (faster completion = higher satisfaction, up to a point)
    const completionTime = this.calculateCompletionTime(journey);
    const expectedTime = (journey.personalizedPath?.estimatedDuration ?? 0) * 60; // convert to seconds
    const timeEfficiency = Math.max(0, Math.min(0.2, (expectedTime - completionTime) / expectedTime * 0.2));
    
    return Math.min(1, completionBonus + engagementScore + timeEfficiency);
  }
}
