import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ModelValidationFramework, ValidationConfig, ValidationResult } from '../../../lib/smart-onboarding/testing/modelValidationFramework';
import { MLModel, ModelMetrics } from '../../../lib/smart-onboarding/types';

describe('ModelValidationFramework', () => {
  let validator: ModelValidationFramework;
  let mockModel: MLModel;
  let testDataset: any[];

  beforeEach(() => {
    validator = new ModelValidationFramework();
    
    mockModel = {
      id: 'test-model-1',
      type: 'persona_classification',
      version: '1.0.0',
      parameters: { learning_rate: 0.001, epochs: 100 },
      trainedAt: new Date(),
      modelData: {
        weights: 'mock_weights_data',
        architecture: 'neural_network',
        inputShape: [50],
        outputShape: [5]
      }
    };

    testDataset = generateMockDataset(100);
  });

  afterEach(() => {
    validator.cleanup();
  });

  describe('Cross-Validation', () => {
    it('should perform k-fold cross-validation correctly', async () => {
      const config: ValidationConfig = {
        validationType: 'cross_validation',
        folds: 5,
        metrics: ['accuracy', 'precision', 'recall', 'f1Score'],
        testSize: 0.2,
        randomSeed: 42
      };

      const result = await validator.validateModel(mockModel, testDataset, config);

      expect(result.validationType).toBe('cross_validation');
      expect(result.folds).toBe(5);
      expect(result.overallMetrics).toBeDefined();
      expect(result.foldResults).toHaveLength(5);
      
      // Each fold should have results
      result.foldResults.forEach(fold => {
        expect(fold.metrics.accuracy).toBeGreaterThan(0);
        expect(fold.metrics.accuracy).toBeLessThanOrEqual(1);
        expect(fold.trainSize).toBeGreaterThan(0);
        expect(fold.testSize).toBeGreaterThan(0);
      });

      // Overall metrics should be averages
      const avgAccuracy = result.foldResults.reduce((sum, fold) => sum + fold.metrics.accuracy, 0) / 5;
      expect(Math.abs(result.overallMetrics.accuracy - avgAccuracy)).toBeLessThan(0.001);
    });

    it('should handle different numbers of folds', async () => {
      const configs = [
        { folds: 3 },
        { folds: 5 },
        { folds: 10 }
      ];

      for (const { folds } of configs) {
        const config: ValidationConfig = {
          validationType: 'cross_validation',
          folds,
          metrics: ['accuracy'],
          testSize: 0.2
        };

        const result = await validator.validateModel(mockModel, testDataset, config);
        expect(result.foldResults).toHaveLength(folds);
      }
    });

    it('should calculate confidence intervals', async () => {
      const config: ValidationConfig = {
        validationType: 'cross_validation',
        folds: 5,
        metrics: ['accuracy', 'f1Score'],
        confidenceLevel: 0.95
      };

      const result = await validator.validateModel(mockModel, testDataset, config);

      expect(result.confidenceIntervals).toBeDefined();
      expect(result.confidenceIntervals!.accuracy).toBeDefined();
      expect(result.confidenceIntervals!.f1Score).toBeDefined();
      
      const accuracyCI = result.confidenceIntervals!.accuracy;
      expect(accuracyCI.lower).toBeLessThan(accuracyCI.upper);
      expect(accuracyCI.lower).toBeGreaterThanOrEqual(0);
      expect(accuracyCI.upper).toBeLessThanOrEqual(1);
    });
  });

  describe('Holdout Validation', () => {
    it('should perform holdout validation with specified test size', async () => {
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.3,
        metrics: ['accuracy', 'precision', 'recall'],
        randomSeed: 123
      };

      const result = await validator.validateModel(mockModel, testDataset, config);

      expect(result.validationType).toBe('holdout');
      expect(result.trainSize).toBe(70); // 70% of 100
      expect(result.testSize).toBe(30); // 30% of 100
      expect(result.overallMetrics).toBeDefined();
      expect(result.overallMetrics.accuracy).toBeGreaterThan(0);
    });

    it('should be reproducible with same random seed', async () => {
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.2,
        metrics: ['accuracy'],
        randomSeed: 456
      };

      const result1 = await validator.validateModel(mockModel, testDataset, config);
      const result2 = await validator.validateModel(mockModel, testDataset, config);

      expect(result1.overallMetrics.accuracy).toBe(result2.overallMetrics.accuracy);
      expect(result1.trainSize).toBe(result2.trainSize);
      expect(result1.testSize).toBe(result2.testSize);
    });
  });

  describe('Bootstrap Validation', () => {
    it('should perform bootstrap validation with multiple samples', async () => {
      const config: ValidationConfig = {
        validationType: 'bootstrap',
        bootstrapSamples: 100,
        metrics: ['accuracy', 'f1Score'],
        confidenceLevel: 0.95
      };

      const result = await validator.validateModel(mockModel, testDataset, config);

      expect(result.validationType).toBe('bootstrap');
      expect(result.bootstrapResults).toHaveLength(100);
      expect(result.confidenceIntervals).toBeDefined();
      
      // Each bootstrap sample should have metrics
      result.bootstrapResults!.forEach(sample => {
        expect(sample.metrics.accuracy).toBeGreaterThan(0);
        expect(sample.sampleSize).toBeGreaterThan(0);
      });
    });

    it('should calculate bootstrap confidence intervals correctly', async () => {
      const config: ValidationConfig = {
        validationType: 'bootstrap',
        bootstrapSamples: 50,
        metrics: ['accuracy'],
        confidenceLevel: 0.90
      };

      const result = await validator.validateModel(mockModel, testDataset, config);

      const accuracies = result.bootstrapResults!.map(r => r.metrics.accuracy);
      const sortedAccuracies = accuracies.sort((a, b) => a - b);
      
      const lowerIndex = Math.floor(0.05 * accuracies.length);
      const upperIndex = Math.floor(0.95 * accuracies.length);
      
      const expectedLower = sortedAccuracies[lowerIndex];
      const expectedUpper = sortedAccuracies[upperIndex];
      
      const actualCI = result.confidenceIntervals!.accuracy;
      expect(Math.abs(actualCI.lower - expectedLower)).toBeLessThan(0.01);
      expect(Math.abs(actualCI.upper - expectedUpper)).toBeLessThan(0.01);
    });
  });

  describe('Bias Detection', () => {
    it('should detect demographic bias in model predictions', async () => {
      const biasedDataset = generateBiasedDataset(200);
      
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.3,
        metrics: ['accuracy'],
        biasDetection: {
          enabled: true,
          protectedAttributes: ['age_group', 'gender'],
          fairnessMetrics: ['demographic_parity', 'equalized_odds']
        }
      };

      const result = await validator.validateModel(mockModel, biasedDataset, config);

      expect(result.biasAnalysis).toBeDefined();
      expect(result.biasAnalysis!.overallBiasScore).toBeGreaterThan(0);
      expect(result.biasAnalysis!.attributeAnalysis).toBeDefined();
      
      const ageAnalysis = result.biasAnalysis!.attributeAnalysis['age_group'];
      expect(ageAnalysis).toBeDefined();
      expect(ageAnalysis.groups.length).toBeGreaterThan(1);
      
      // Should detect bias in the biased dataset
      expect(result.biasAnalysis!.overallBiasScore).toBeGreaterThan(0.1);
    });

    it('should calculate fairness metrics correctly', async () => {
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.2,
        metrics: ['accuracy'],
        biasDetection: {
          enabled: true,
          protectedAttributes: ['gender'],
          fairnessMetrics: ['demographic_parity', 'equalized_odds', 'equal_opportunity']
        }
      };

      const result = await validator.validateModel(mockModel, generateBiasedDataset(150), config);

      const genderAnalysis = result.biasAnalysis!.attributeAnalysis['gender'];
      expect(genderAnalysis.fairnessMetrics).toBeDefined();
      expect(genderAnalysis.fairnessMetrics.demographic_parity).toBeDefined();
      expect(genderAnalysis.fairnessMetrics.equalized_odds).toBeDefined();
      expect(genderAnalysis.fairnessMetrics.equal_opportunity).toBeDefined();
      
      // Fairness metrics should be between 0 and 1
      Object.values(genderAnalysis.fairnessMetrics).forEach(metric => {
        expect(metric).toBeGreaterThanOrEqual(0);
        expect(metric).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance Benchmarking', () => {
    it('should measure prediction latency', async () => {
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.2,
        metrics: ['accuracy'],
        performanceBenchmark: {
          enabled: true,
          measureLatency: true,
          measureThroughput: true,
          measureMemory: true
        }
      };

      const result = await validator.validateModel(mockModel, testDataset, config);

      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics!.averageLatency).toBeGreaterThan(0);
      expect(result.performanceMetrics!.throughput).toBeGreaterThan(0);
      expect(result.performanceMetrics!.memoryUsage).toBeGreaterThan(0);
      
      // Latency should be reasonable (less than 1 second for mock model)
      expect(result.performanceMetrics!.averageLatency).toBeLessThan(1000);
    });

    it('should measure throughput correctly', async () => {
      const largeDataset = generateMockDataset(1000);
      
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.1,
        metrics: ['accuracy'],
        performanceBenchmark: {
          enabled: true,
          measureThroughput: true
        }
      };

      const result = await validator.validateModel(mockModel, largeDataset, config);

      expect(result.performanceMetrics!.throughput).toBeGreaterThan(0);
      
      // Throughput should be reasonable (at least 10 predictions per second)
      expect(result.performanceMetrics!.throughput).toBeGreaterThan(10);
    });
  });

  describe('Model Comparison', () => {
    it('should compare multiple models statistically', async () => {
      const model2: MLModel = {
        ...mockModel,
        id: 'test-model-2',
        parameters: { learning_rate: 0.01, epochs: 50 }
      };

      const config: ValidationConfig = {
        validationType: 'cross_validation',
        folds: 5,
        metrics: ['accuracy', 'f1Score']
      };

      const result1 = await validator.validateModel(mockModel, testDataset, config);
      const result2 = await validator.validateModel(model2, testDataset, config);

      const comparison = await validator.compareModels([result1, result2], 'accuracy');

      expect(comparison.metric).toBe('accuracy');
      expect(comparison.models).toHaveLength(2);
      expect(comparison.statisticalSignificance).toBeDefined();
      expect(comparison.bestModel).toBeDefined();
      
      // Should identify which model is better
      const bestModelId = comparison.bestModel.modelId;
      expect([mockModel.id, model2.id]).toContain(bestModelId);
    });

    it('should perform statistical significance testing', async () => {
      const config: ValidationConfig = {
        validationType: 'bootstrap',
        bootstrapSamples: 30,
        metrics: ['accuracy']
      };

      // Create two models with different performance
      const goodModel = { ...mockModel, id: 'good-model' };
      const poorModel = { ...mockModel, id: 'poor-model' };

      const result1 = await validator.validateModel(goodModel, testDataset, config);
      const result2 = await validator.validateModel(poorModel, testDataset, config);

      const comparison = await validator.compareModels([result1, result2], 'accuracy');

      expect(comparison.statisticalSignificance.pValue).toBeGreaterThanOrEqual(0);
      expect(comparison.statisticalSignificance.pValue).toBeLessThanOrEqual(1);
      expect(comparison.statisticalSignificance.isSignificant).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty datasets gracefully', async () => {
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.2,
        metrics: ['accuracy']
      };

      await expect(validator.validateModel(mockModel, [], config))
        .rejects.toThrow('Dataset cannot be empty');
    });

    it('should handle invalid test size', async () => {
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 1.5, // Invalid: > 1
        metrics: ['accuracy']
      };

      await expect(validator.validateModel(mockModel, testDataset, config))
        .rejects.toThrow('Test size must be between 0 and 1');
    });

    it('should handle insufficient data for cross-validation', async () => {
      const smallDataset = generateMockDataset(3);
      
      const config: ValidationConfig = {
        validationType: 'cross_validation',
        folds: 5, // More folds than data points
        metrics: ['accuracy']
      };

      await expect(validator.validateModel(mockModel, smallDataset, config))
        .rejects.toThrow('Insufficient data for cross-validation');
    });

    it('should validate model compatibility', async () => {
      const incompatibleModel: MLModel = {
        ...mockModel,
        type: 'unsupported_type' as any
      };

      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.2,
        metrics: ['accuracy']
      };

      await expect(validator.validateModel(incompatibleModel, testDataset, config))
        .rejects.toThrow('Unsupported model type');
    });
  });

  describe('Memory and Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = generateMockDataset(10000);
      
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.1,
        metrics: ['accuracy'],
        performanceBenchmark: {
          enabled: true,
          measureMemory: true
        }
      };

      const startTime = Date.now();
      const result = await validator.validateModel(mockModel, largeDataset, config);
      const duration = Date.now() - startTime;

      expect(result.overallMetrics).toBeDefined();
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.performanceMetrics!.memoryUsage).toBeLessThan(1000); // Less than 1GB
    });

    it('should clean up resources properly', async () => {
      const config: ValidationConfig = {
        validationType: 'holdout',
        testSize: 0.2,
        metrics: ['accuracy']
      };

      // Run multiple validations
      for (let i = 0; i < 5; i++) {
        await validator.validateModel(mockModel, testDataset, config);
      }

      // Cleanup should not throw
      expect(() => validator.cleanup()).not.toThrow();
    });
  });
});

// Helper functions
function generateMockDataset(size: number): any[] {
  const dataset = [];
  
  for (let i = 0; i < size; i++) {
    dataset.push({
      features: {
        profileData: generateRandomProfile(),
        behaviorPatterns: generateRandomBehavior(),
        technicalProficiency: Math.random()
      },
      label: ['technical_expert', 'business_user', 'novice_user', 'creative_professional'][
        Math.floor(Math.random() * 4)
      ]
    });
  }
  
  return dataset;
}

function generateBiasedDataset(size: number): any[] {
  const dataset = [];
  
  for (let i = 0; i < size; i++) {
    const ageGroup = Math.random() < 0.7 ? 'young' : 'old';
    const gender = Math.random() < 0.6 ? 'male' : 'female';
    
    // Introduce bias: young males more likely to be classified as technical_expert
    let label = 'business_user';
    if (ageGroup === 'young' && gender === 'male' && Math.random() < 0.8) {
      label = 'technical_expert';
    } else if (Math.random() < 0.3) {
      label = ['novice_user', 'creative_professional'][Math.floor(Math.random() * 2)];
    }
    
    dataset.push({
      features: {
        profileData: generateRandomProfile(),
        behaviorPatterns: generateRandomBehavior(),
        technicalProficiency: Math.random(),
        age_group: ageGroup,
        gender: gender
      },
      label
    });
  }
  
  return dataset;
}

function generateRandomProfile(): any {
  return {
    socialConnections: Math.floor(Math.random() * 5),
    contentGoals: ['growth', 'engagement', 'monetization'][Math.floor(Math.random() * 3)],
    experience: Math.random()
  };
}

function generateRandomBehavior(): any {
  return {
    clickPatterns: Math.random() * 100,
    timeSpent: Math.random() * 300,
    helpRequests: Math.floor(Math.random() * 10)
  };
}