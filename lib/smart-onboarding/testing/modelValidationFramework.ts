import { MLModel, ModelMetrics } from '../types';
import { logger } from '../../utils/logger';

export interface ValidationConfig {
  validationType: 'cross_validation' | 'holdout' | 'bootstrap';
  folds?: number; // for cross-validation
  testSize?: number; // for holdout
  bootstrapSamples?: number; // for bootstrap
  metrics: string[];
  randomSeed?: number;
  confidenceLevel?: number;
  biasDetection?: BiasDetectionConfig;
  performanceBenchmark?: PerformanceBenchmarkConfig;
}

export interface BiasDetectionConfig {
  enabled: boolean;
  protectedAttributes: string[];
  fairnessMetrics: string[];
}

export interface PerformanceBenchmarkConfig {
  enabled: boolean;
  measureLatency?: boolean;
  measureThroughput?: boolean;
  measureMemory?: boolean;
}

export interface ValidationResult {
  modelId: string;
  validationType: string;
  overallMetrics: ModelMetrics;
  folds?: number;
  trainSize?: number;
  testSize?: number;
  foldResults?: FoldResult[];
  bootstrapResults?: BootstrapResult[];
  confidenceIntervals?: ConfidenceIntervals;
  biasAnalysis?: BiasAnalysis;
  performanceMetrics?: PerformanceMetrics;
  timestamp: Date;
}

export interface FoldResult {
  fold: number;
  metrics: ModelMetrics;
  trainSize: number;
  testSize: number;
}

export interface BootstrapResult {
  sample: number;
  metrics: ModelMetrics;
  sampleSize: number;
}

export interface ConfidenceIntervals {
  [metric: string]: {
    lower: number;
    upper: number;
    level: number;
  };
}

export interface BiasAnalysis {
  overallBiasScore: number;
  attributeAnalysis: {
    [attribute: string]: AttributeBiasAnalysis;
  };
}

export interface AttributeBiasAnalysis {
  groups: GroupAnalysis[];
  fairnessMetrics: {
    [metric: string]: number;
  };
  biasScore: number;
}

export interface GroupAnalysis {
  groupValue: string;
  size: number;
  metrics: ModelMetrics;
}

export interface PerformanceMetrics {
  averageLatency: number; // milliseconds
  throughput: number; // predictions per second
  memoryUsage: number; // MB
  cpuUsage?: number; // percentage
}

export interface ModelComparison {
  metric: string;
  models: ModelComparisonResult[];
  bestModel: ModelComparisonResult;
  statisticalSignificance: StatisticalTest;
}

export interface ModelComparisonResult {
  modelId: string;
  meanScore: number;
  standardDeviation: number;
  confidenceInterval: { lower: number; upper: number };
}

export interface StatisticalTest {
  testType: string;
  pValue: number;
  isSignificant: boolean;
  alpha: number;
}

export class ModelValidationFramework {
  private validationCache = new Map<string, ValidationResult>();

  async validateModel(
    model: MLModel, 
    dataset: any[], 
    config: ValidationConfig
  ): Promise<ValidationResult> {
    this.validateInputs(model, dataset, config);
    
    logger.info(`Starting model validation: ${config.validationType}`, { 
      modelId: model.id, 
      datasetSize: dataset.length 
    });

    const startTime = Date.now();
    let result: ValidationResult;

    switch (config.validationType) {
      case 'cross_validation':
        result = await this.performCrossValidation(model, dataset, config);
        break;
      case 'holdout':
        result = await this.performHoldoutValidation(model, dataset, config);
        break;
      case 'bootstrap':
        result = await this.performBootstrapValidation(model, dataset, config);
        break;
      default:
        throw new Error(`Unsupported validation type: ${config.validationType}`);
    }

    // Add performance benchmarking if requested
    if (config.performanceBenchmark?.enabled) {
      result.performanceMetrics = await this.benchmarkPerformance(model, dataset, config);
    }

    // Add bias detection if requested
    if (config.biasDetection?.enabled) {
      result.biasAnalysis = await this.detectBias(model, dataset, config);
    }

    const duration = Date.now() - startTime;
    logger.info(`Model validation completed in ${duration}ms`, { 
      modelId: model.id,
      validationType: config.validationType 
    });

    // Cache result
    this.validationCache.set(`${model.id}_${Date.now()}`, result);

    return result;
  }  private a
sync performCrossValidation(
    model: MLModel, 
    dataset: any[], 
    config: ValidationConfig
  ): Promise<ValidationResult> {
    const folds = config.folds || 5;
    
    if (dataset.length < folds) {
      throw new Error('Insufficient data for cross-validation');
    }

    const shuffledData = this.shuffleArray([...dataset], config.randomSeed);
    const foldSize = Math.floor(dataset.length / folds);
    const foldResults: FoldResult[] = [];

    for (let i = 0; i < folds; i++) {
      const testStart = i * foldSize;
      const testEnd = i === folds - 1 ? dataset.length : (i + 1) * foldSize;
      
      const testData = shuffledData.slice(testStart, testEnd);
      const trainData = [
        ...shuffledData.slice(0, testStart),
        ...shuffledData.slice(testEnd)
      ];

      const metrics = await this.evaluateModel(model, trainData, testData, config.metrics);
      
      foldResults.push({
        fold: i + 1,
        metrics,
        trainSize: trainData.length,
        testSize: testData.length
      });
    }

    const overallMetrics = this.aggregateMetrics(foldResults.map(f => f.metrics));
    const confidenceIntervals = config.confidenceLevel 
      ? this.calculateConfidenceIntervals(foldResults, config.confidenceLevel)
      : undefined;

    return {
      modelId: model.id,
      validationType: 'cross_validation',
      overallMetrics,
      folds,
      foldResults,
      confidenceIntervals,
      timestamp: new Date()
    };
  }

  private async performHoldoutValidation(
    model: MLModel, 
    dataset: any[], 
    config: ValidationConfig
  ): Promise<ValidationResult> {
    const testSize = config.testSize || 0.2;
    
    if (testSize <= 0 || testSize >= 1) {
      throw new Error('Test size must be between 0 and 1');
    }

    const shuffledData = this.shuffleArray([...dataset], config.randomSeed);
    const splitIndex = Math.floor(dataset.length * (1 - testSize));
    
    const trainData = shuffledData.slice(0, splitIndex);
    const testData = shuffledData.slice(splitIndex);

    const overallMetrics = await this.evaluateModel(model, trainData, testData, config.metrics);

    return {
      modelId: model.id,
      validationType: 'holdout',
      overallMetrics,
      trainSize: trainData.length,
      testSize: testData.length,
      timestamp: new Date()
    };
  }

  private async performBootstrapValidation(
    model: MLModel, 
    dataset: any[], 
    config: ValidationConfig
  ): Promise<ValidationResult> {
    const samples = config.bootstrapSamples || 100;
    const bootstrapResults: BootstrapResult[] = [];

    for (let i = 0; i < samples; i++) {
      const bootstrapSample = this.createBootstrapSample(dataset, config.randomSeed ? config.randomSeed + i : undefined);
      const outOfBagSample = this.getOutOfBagSample(dataset, bootstrapSample);
      
      if (outOfBagSample.length === 0) continue;

      const metrics = await this.evaluateModel(model, bootstrapSample, outOfBagSample, config.metrics);
      
      bootstrapResults.push({
        sample: i + 1,
        metrics,
        sampleSize: bootstrapSample.length
      });
    }

    const overallMetrics = this.aggregateMetrics(bootstrapResults.map(r => r.metrics));
    const confidenceIntervals = config.confidenceLevel 
      ? this.calculateBootstrapConfidenceIntervals(bootstrapResults, config.confidenceLevel)
      : undefined;

    return {
      modelId: model.id,
      validationType: 'bootstrap',
      overallMetrics,
      bootstrapResults,
      confidenceIntervals,
      timestamp: new Date()
    };
  }

  private async evaluateModel(
    model: MLModel, 
    trainData: any[], 
    testData: any[], 
    metrics: string[]
  ): Promise<ModelMetrics> {
    // Simulate model training and prediction
    // In a real implementation, this would use actual ML libraries
    
    const predictions = testData.map(() => this.simulateModelPrediction(model));
    const trueLabels = testData.map(item => item.label);
    
    return this.calculateMetrics(predictions, trueLabels, metrics);
  }

  private simulateModelPrediction(model: MLModel): any {
    // Simulate model prediction based on model type
    switch (model.type) {
      case 'persona_classification':
        const personas = ['technical_expert', 'business_user', 'novice_user', 'creative_professional'];
        return personas[Math.floor(Math.random() * personas.length)];
      case 'success_prediction':
        return Math.random() > 0.3 ? 1 : 0; // 70% success rate
      case 'engagement_scoring':
        return Math.random() * 100;
      default:
        return Math.random();
    }
  }

  private calculateMetrics(predictions: any[], trueLabels: any[], metricNames: string[]): ModelMetrics {
    const metrics: ModelMetrics = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      auc: 0,
      loss: 0,
      validationSamples: predictions.length,
      evaluatedAt: new Date()
    };

    if (predictions.length === 0) return metrics;

    // Calculate accuracy
    const correct = predictions.filter((pred, i) => pred === trueLabels[i]).length;
    metrics.accuracy = correct / predictions.length;

    // For classification tasks, calculate precision, recall, F1
    if (metricNames.includes('precision') || metricNames.includes('recall') || metricNames.includes('f1Score')) {
      const { precision, recall, f1Score } = this.calculateClassificationMetrics(predictions, trueLabels);
      metrics.precision = precision;
      metrics.recall = recall;
      metrics.f1Score = f1Score;
    }

    // Simulate AUC for binary classification
    if (metricNames.includes('auc')) {
      metrics.auc = 0.7 + Math.random() * 0.25; // Simulate AUC between 0.7-0.95
    }

    // Simulate loss
    metrics.loss = (1 - metrics.accuracy) * 0.5 + Math.random() * 0.1;

    return metrics;
  }

  private calculateClassificationMetrics(predictions: any[], trueLabels: any[]): {
    precision: number;
    recall: number;
    f1Score: number;
  } {
    // For multi-class, calculate macro-averaged metrics
    const classes = [...new Set(trueLabels)];
    let totalPrecision = 0;
    let totalRecall = 0;

    for (const cls of classes) {
      const tp = predictions.filter((pred, i) => pred === cls && trueLabels[i] === cls).length;
      const fp = predictions.filter((pred, i) => pred === cls && trueLabels[i] !== cls).length;
      const fn = predictions.filter((pred, i) => pred !== cls && trueLabels[i] === cls).length;

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

      totalPrecision += precision;
      totalRecall += recall;
    }

    const avgPrecision = totalPrecision / classes.length;
    const avgRecall = totalRecall / classes.length;
    const f1Score = avgPrecision + avgRecall > 0 ? 2 * (avgPrecision * avgRecall) / (avgPrecision + avgRecall) : 0;

    return {
      precision: avgPrecision,
      recall: avgRecall,
      f1Score
    };
  }

  private aggregateMetrics(metricsList: ModelMetrics[]): ModelMetrics {
    if (metricsList.length === 0) {
      throw new Error('No metrics to aggregate');
    }

    const aggregated: ModelMetrics = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      auc: 0,
      loss: 0,
      validationSamples: metricsList.reduce((sum, m) => sum + m.validationSamples, 0),
      evaluatedAt: new Date()
    };

    const count = metricsList.length;
    aggregated.accuracy = metricsList.reduce((sum, m) => sum + m.accuracy, 0) / count;
    aggregated.precision = metricsList.reduce((sum, m) => sum + m.precision, 0) / count;
    aggregated.recall = metricsList.reduce((sum, m) => sum + m.recall, 0) / count;
    aggregated.f1Score = metricsList.reduce((sum, m) => sum + m.f1Score, 0) / count;
    aggregated.auc = metricsList.reduce((sum, m) => sum + m.auc, 0) / count;
    aggregated.loss = metricsList.reduce((sum, m) => sum + m.loss, 0) / count;

    return aggregated;
  }

  private calculateConfidenceIntervals(
    foldResults: FoldResult[], 
    confidenceLevel: number
  ): ConfidenceIntervals {
    const intervals: ConfidenceIntervals = {};
    const alpha = 1 - confidenceLevel;
    
    const metrics = ['accuracy', 'precision', 'recall', 'f1Score', 'auc'];
    
    for (const metric of metrics) {
      const values = foldResults.map(f => (f.metrics as any)[metric]).filter(v => v !== undefined);
      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        const lowerIndex = Math.floor(alpha / 2 * values.length);
        const upperIndex = Math.floor((1 - alpha / 2) * values.length);
        
        intervals[metric] = {
          lower: sorted[lowerIndex] || sorted[0],
          upper: sorted[upperIndex] || sorted[sorted.length - 1],
          level: confidenceLevel
        };
      }
    }
    
    return intervals;
  }

  private calculateBootstrapConfidenceIntervals(
    bootstrapResults: BootstrapResult[], 
    confidenceLevel: number
  ): ConfidenceIntervals {
    const intervals: ConfidenceIntervals = {};
    const alpha = 1 - confidenceLevel;
    
    const metrics = ['accuracy', 'precision', 'recall', 'f1Score', 'auc'];
    
    for (const metric of metrics) {
      const values = bootstrapResults.map(r => (r.metrics as any)[metric]).filter(v => v !== undefined);
      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        const lowerIndex = Math.floor(alpha / 2 * values.length);
        const upperIndex = Math.floor((1 - alpha / 2) * values.length);
        
        intervals[metric] = {
          lower: sorted[lowerIndex] || sorted[0],
          upper: sorted[upperIndex] || sorted[sorted.length - 1],
          level: confidenceLevel
        };
      }
    }
    
    return intervals;
  }

  private async benchmarkPerformance(
    model: MLModel, 
    dataset: any[], 
    config: ValidationConfig
  ): Promise<PerformanceMetrics> {
    const sampleSize = Math.min(100, dataset.length);
    const testSample = dataset.slice(0, sampleSize);
    
    // Measure latency
    let totalLatency = 0;
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    
    const startTime = Date.now();
    
    for (const sample of testSample) {
      const predictionStart = Date.now();
      this.simulateModelPrediction(model);
      totalLatency += Date.now() - predictionStart;
    }
    
    const totalTime = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    
    return {
      averageLatency: totalLatency / sampleSize,
      throughput: (sampleSize / totalTime) * 1000, // predictions per second
      memoryUsage: endMemory - startMemory
    };
  }

  private async detectBias(
    model: MLModel, 
    dataset: any[], 
    config: ValidationConfig
  ): Promise<BiasAnalysis> {
    const biasConfig = config.biasDetection!;
    const attributeAnalysis: { [attribute: string]: AttributeBiasAnalysis } = {};
    
    for (const attribute of biasConfig.protectedAttributes) {
      const groups = this.groupByAttribute(dataset, attribute);
      const groupAnalyses: GroupAnalysis[] = [];
      
      for (const [groupValue, groupData] of Object.entries(groups)) {
        if (groupData.length === 0) continue;
        
        const predictions = groupData.map(() => this.simulateModelPrediction(model));
        const trueLabels = groupData.map(item => item.label);
        const metrics = this.calculateMetrics(predictions, trueLabels, config.metrics);
        
        groupAnalyses.push({
          groupValue,
          size: groupData.length,
          metrics
        });
      }
      
      const fairnessMetrics = this.calculateFairnessMetrics(groupAnalyses, biasConfig.fairnessMetrics);
      const biasScore = this.calculateBiasScore(groupAnalyses);
      
      attributeAnalysis[attribute] = {
        groups: groupAnalyses,
        fairnessMetrics,
        biasScore
      };
    }
    
    const overallBiasScore = Object.values(attributeAnalysis)
      .reduce((sum, analysis) => sum + analysis.biasScore, 0) / Object.keys(attributeAnalysis).length;
    
    return {
      overallBiasScore,
      attributeAnalysis
    };
  }

  private groupByAttribute(dataset: any[], attribute: string): { [key: string]: any[] } {
    const groups: { [key: string]: any[] } = {};
    
    for (const item of dataset) {
      const value = item.features[attribute] || 'unknown';
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item);
    }
    
    return groups;
  }

  private calculateFairnessMetrics(groups: GroupAnalysis[], metricNames: string[]): { [metric: string]: number } {
    const fairnessMetrics: { [metric: string]: number } = {};
    
    if (groups.length < 2) return fairnessMetrics;
    
    for (const metricName of metricNames) {
      switch (metricName) {
        case 'demographic_parity':
          fairnessMetrics[metricName] = this.calculateDemographicParity(groups);
          break;
        case 'equalized_odds':
          fairnessMetrics[metricName] = this.calculateEqualizedOdds(groups);
          break;
        case 'equal_opportunity':
          fairnessMetrics[metricName] = this.calculateEqualOpportunity(groups);
          break;
      }
    }
    
    return fairnessMetrics;
  }

  private calculateDemographicParity(groups: GroupAnalysis[]): number {
    const accuracies = groups.map(g => g.metrics.accuracy);
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);
    return 1 - (maxAccuracy - minAccuracy); // 1 = perfect parity, 0 = maximum disparity
  }

  private calculateEqualizedOdds(groups: GroupAnalysis[]): number {
    // Simplified calculation - in reality would need true positive/false positive rates
    const f1Scores = groups.map(g => g.metrics.f1Score);
    const maxF1 = Math.max(...f1Scores);
    const minF1 = Math.min(...f1Scores);
    return 1 - (maxF1 - minF1);
  }

  private calculateEqualOpportunity(groups: GroupAnalysis[]): number {
    // Simplified calculation - in reality would need true positive rates
    const recalls = groups.map(g => g.metrics.recall);
    const maxRecall = Math.max(...recalls);
    const minRecall = Math.min(...recalls);
    return 1 - (maxRecall - minRecall);
  }

  private calculateBiasScore(groups: GroupAnalysis[]): number {
    if (groups.length < 2) return 0;
    
    const accuracies = groups.map(g => g.metrics.accuracy);
    const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
    
    return Math.sqrt(variance); // Higher variance indicates more bias
  }

  async compareModels(results: ValidationResult[], metric: string = 'accuracy'): Promise<ModelComparison> {
    if (results.length < 2) {
      throw new Error('At least two models required for comparison');
    }

    const modelResults: ModelComparisonResult[] = results.map(result => {
      const scores = this.extractMetricScores(result, metric);
      const meanScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / scores.length;
      const standardDeviation = Math.sqrt(variance);
      
      return {
        modelId: result.modelId,
        meanScore,
        standardDeviation,
        confidenceInterval: this.calculateMeanConfidenceInterval(scores, 0.95)
      };
    });

    const bestModel = modelResults.reduce((best, current) => 
      current.meanScore > best.meanScore ? current : best
    );

    const statisticalTest = this.performStatisticalTest(modelResults, metric);

    return {
      metric,
      models: modelResults,
      bestModel,
      statisticalSignificance: statisticalTest
    };
  }

  private extractMetricScores(result: ValidationResult, metric: string): number[] {
    if (result.foldResults) {
      return result.foldResults.map(fold => (fold.metrics as any)[metric]);
    } else if (result.bootstrapResults) {
      return result.bootstrapResults.map(bootstrap => (bootstrap.metrics as any)[metric]);
    } else {
      return [(result.overallMetrics as any)[metric]];
    }
  }

  private calculateMeanConfidenceInterval(scores: number[], confidenceLevel: number): { lower: number; upper: number } {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / (scores.length - 1);
    const standardError = Math.sqrt(variance / scores.length);
    
    // Using t-distribution approximation (simplified)
    const tValue = 1.96; // Approximate for 95% confidence
    const margin = tValue * standardError;
    
    return {
      lower: mean - margin,
      upper: mean + margin
    };
  }

  private performStatisticalTest(models: ModelComparisonResult[], metric: string): StatisticalTest {
    // Simplified t-test between best and second-best model
    if (models.length < 2) {
      return {
        testType: 'none',
        pValue: 1,
        isSignificant: false,
        alpha: 0.05
      };
    }

    const sortedModels = models.sort((a, b) => b.meanScore - a.meanScore);
    const best = sortedModels[0];
    const secondBest = sortedModels[1];
    
    // Simplified t-test calculation
    const pooledStd = Math.sqrt((Math.pow(best.standardDeviation, 2) + Math.pow(secondBest.standardDeviation, 2)) / 2);
    const tStatistic = Math.abs(best.meanScore - secondBest.meanScore) / (pooledStd * Math.sqrt(2));
    
    // Simplified p-value calculation (normally would use proper t-distribution)
    const pValue = Math.max(0.001, 1 / (1 + tStatistic));
    
    return {
      testType: 't-test',
      pValue,
      isSignificant: pValue < 0.05,
      alpha: 0.05
    };
  }

  private shuffleArray(array: any[], seed?: number): any[] {
    const rng = seed ? this.createSeededRandom(seed) : Math.random;
    
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    
    return array;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  private createBootstrapSample(dataset: any[], seed?: number): any[] {
    const rng = seed ? this.createSeededRandom(seed) : Math.random;
    const sample = [];
    
    for (let i = 0; i < dataset.length; i++) {
      const index = Math.floor(rng() * dataset.length);
      sample.push(dataset[index]);
    }
    
    return sample;
  }

  private getOutOfBagSample(original: any[], bootstrap: any[]): any[] {
    const bootstrapIndices = new Set();
    
    // Track which original indices were selected in bootstrap
    for (const item of bootstrap) {
      const index = original.indexOf(item);
      if (index !== -1) {
        bootstrapIndices.add(index);
      }
    }
    
    // Return items not in bootstrap sample
    return original.filter((_, index) => !bootstrapIndices.has(index));
  }

  private validateInputs(model: MLModel, dataset: any[], config: ValidationConfig): void {
    if (!model || !model.id) {
      throw new Error('Invalid model provided');
    }
    
    if (!dataset || dataset.length === 0) {
      throw new Error('Dataset cannot be empty');
    }
    
    if (!['persona_classification', 'success_prediction', 'engagement_scoring', 'path_optimization'].includes(model.type)) {
      throw new Error('Unsupported model type');
    }
    
    if (config.testSize && (config.testSize <= 0 || config.testSize >= 1)) {
      throw new Error('Test size must be between 0 and 1');
    }
    
    if (config.folds && config.folds > dataset.length) {
      throw new Error('Insufficient data for cross-validation');
    }
  }

  cleanup(): void {
    this.validationCache.clear();
  }
}