/**
 * Azure Cost Reporting Service - Unit Tests
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 34: Implement cost reporting and analytics
 * Validates: Requirements 5.3, 5.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  AzureCostReportingService,
  calculateRequestCost,
  getModelPricing,
  type CostEntry,
  type CostReport,
} from '../../../lib/ai/azure/azure-cost-reporting.service';

describe('Cost Calculation Utilities', () => {
  describe('calculateRequestCost', () => {
    it('should calculate cost for GPT-4 Turbo', () => {
      const cost = calculateRequestCost('gpt-4-turbo-prod', 1000, 500);
      // Input: 1000 tokens * $0.01/1k = $0.01
      // Output: 500 tokens * $0.03/1k = $0.015
      expect(cost).toBeCloseTo(0.025, 4);
    });

    it('should calculate cost for GPT-3.5 Turbo', () => {
      const cost = calculateRequestCost('gpt-35-turbo-prod', 1000, 500);
      // Input: 1000 tokens * $0.0005/1k = $0.0005
      // Output: 500 tokens * $0.0015/1k = $0.00075
      expect(cost).toBeCloseTo(0.00125, 5);
    });

    it('should calculate cost for embeddings', () => {
      const cost = calculateRequestCost('text-embedding-ada-002-prod', 1000, 0);
      // 1000 tokens * $0.0001/1k = $0.0001
      expect(cost).toBeCloseTo(0.0001, 5);
    });

    it('should return 0 for unknown deployment', () => {
      const cost = calculateRequestCost('unknown-deployment', 1000, 500);
      expect(cost).toBe(0);
    });
  });

  describe('getModelPricing', () => {
    it('should return pricing for GPT-4 Turbo', () => {
      const pricing = getModelPricing('gpt-4-turbo-prod');
      expect(pricing).not.toBeNull();
      expect(pricing!.inputCost).toBe(0.01);
      expect(pricing!.outputCost).toBe(0.03);
    });

    it('should return null for unknown deployment', () => {
      const pricing = getModelPricing('unknown-deployment');
      expect(pricing).toBeNull();
    });
  });
});

describe('AzureCostReportingService', () => {
  let service: AzureCostReportingService;

  beforeEach(() => {
    AzureCostReportingService.resetInstance();
    service = new AzureCostReportingService();
  });

  afterEach(() => {
    service.clearCostEntries();
  });

  describe('Cost Entry Recording', () => {
    it('should record cost entry with generated ID', () => {
      const entry = service.recordCost({
        timestamp: new Date(),
        accountId: 'account-123',
        creatorId: 'creator-456',
        deployment: 'gpt-4-turbo-prod',
        model: 'gpt-4-turbo',
        tier: 'premium',
        operation: 'chat',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.005,
        success: true,
      });

      expect(entry.id).toMatch(/^cost_\d+_[a-z0-9]+$/);
      expect(service.getCostEntries()).toHaveLength(1);
    });
  });

  describe('Report Generation', () => {
    it('should generate report with correct totals', () => {
      const entries = createTestEntries([
        { cost: 0.01, totalTokens: 100 },
        { cost: 0.02, totalTokens: 200 },
        { cost: 0.03, totalTokens: 300 },
      ]);

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.totalCost).toBeCloseTo(0.06, 4);
      expect(report.totalTokens).toBe(600);
      expect(report.totalRequests).toBe(3);
    });

    it('should calculate success rate correctly', () => {
      const entries = createTestEntries([
        { success: true },
        { success: true },
        { success: false },
        { success: true },
      ]);

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.successRate).toBeCloseTo(0.75, 2);
    });

    it('should aggregate by creator correctly', () => {
      const entries = createTestEntries([
        { creatorId: 'creator-1', cost: 0.01 },
        { creatorId: 'creator-1', cost: 0.02 },
        { creatorId: 'creator-2', cost: 0.03 },
      ]);

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.byCreator).toHaveLength(2);
      
      const creator1 = report.byCreator.find(c => c.creatorId === 'creator-1');
      expect(creator1?.totalCost).toBeCloseTo(0.03, 4);
      expect(creator1?.requestCount).toBe(2);

      const creator2 = report.byCreator.find(c => c.creatorId === 'creator-2');
      expect(creator2?.totalCost).toBeCloseTo(0.03, 4);
      expect(creator2?.requestCount).toBe(1);
    });

    it('should aggregate by model correctly', () => {
      const entries = createTestEntries([
        { model: 'gpt-4-turbo', cost: 0.05 },
        { model: 'gpt-4-turbo', cost: 0.03 },
        { model: 'gpt-3.5-turbo', cost: 0.01 },
      ]);

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.byModel).toHaveLength(2);
      
      const gpt4 = report.byModel.find(m => m.model === 'gpt-4-turbo');
      expect(gpt4?.totalCost).toBeCloseTo(0.08, 4);
      expect(gpt4?.requestCount).toBe(2);
    });

    it('should aggregate by operation correctly', () => {
      const entries = createTestEntries([
        { operation: 'chat', cost: 0.02 },
        { operation: 'chat', cost: 0.03 },
        { operation: 'embedding', cost: 0.001 },
      ]);

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.byOperation).toHaveLength(2);
      
      const chat = report.byOperation.find(o => o.operation === 'chat');
      expect(chat?.totalCost).toBeCloseTo(0.05, 4);
      expect(chat?.requestCount).toBe(2);
    });

    it('should aggregate by day correctly', () => {
      const entries = [
        createCostEntry({ timestamp: new Date('2024-01-01T10:00:00'), cost: 0.01 }),
        createCostEntry({ timestamp: new Date('2024-01-01T15:00:00'), cost: 0.02 }),
        createCostEntry({ timestamp: new Date('2024-01-02T10:00:00'), cost: 0.03 }),
      ];

      const report = service.generateReport(
        entries,
        'week',
        new Date('2024-01-01'),
        new Date('2024-01-03')
      );

      expect(report.byDay).toHaveLength(2);
      expect(report.byDay[0].totalCost).toBeCloseTo(0.03, 4);
      expect(report.byDay[1].totalCost).toBeCloseTo(0.03, 4);
    });

    it('should handle empty entries', () => {
      const report = service.generateReport(
        [],
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.totalCost).toBe(0);
      expect(report.totalTokens).toBe(0);
      expect(report.totalRequests).toBe(0);
      expect(report.successRate).toBe(0);
    });
  });

  describe('Cost Trends', () => {
    it('should detect increasing trend', () => {
      const entries = [
        createCostEntry({ timestamp: new Date('2024-01-01'), cost: 0.01 }),
        createCostEntry({ timestamp: new Date('2024-01-02'), cost: 0.01 }),
        createCostEntry({ timestamp: new Date('2024-01-03'), cost: 0.05 }),
        createCostEntry({ timestamp: new Date('2024-01-04'), cost: 0.05 }),
      ];

      const report = service.generateReport(
        entries,
        'week',
        new Date('2024-01-01'),
        new Date('2024-01-05')
      );

      expect(report.trends.trend).toBe('increasing');
      expect(report.trends.costChangePercent).toBeGreaterThan(0);
    });

    it('should detect decreasing trend', () => {
      const entries = [
        createCostEntry({ timestamp: new Date('2024-01-01'), cost: 0.05 }),
        createCostEntry({ timestamp: new Date('2024-01-02'), cost: 0.05 }),
        createCostEntry({ timestamp: new Date('2024-01-03'), cost: 0.01 }),
        createCostEntry({ timestamp: new Date('2024-01-04'), cost: 0.01 }),
      ];

      const report = service.generateReport(
        entries,
        'week',
        new Date('2024-01-01'),
        new Date('2024-01-05')
      );

      expect(report.trends.trend).toBe('decreasing');
      expect(report.trends.costChangePercent).toBeLessThan(0);
    });

    it('should calculate projected monthly cost', () => {
      const entries = [
        createCostEntry({ timestamp: new Date('2024-01-01'), cost: 10 }),
        createCostEntry({ timestamp: new Date('2024-01-02'), cost: 10 }),
        createCostEntry({ timestamp: new Date('2024-01-03'), cost: 10 }),
      ];

      const report = service.generateReport(
        entries,
        'week',
        new Date('2024-01-01'),
        new Date('2024-01-04')
      );

      // $30 over 3 days = $10/day * 30 days = $300/month
      expect(report.trends.projectedMonthlyCost).toBeCloseTo(300, 0);
    });
  });

  describe('Optimization Recommendations', () => {
    it('should recommend tier downgrade for high premium usage', () => {
      const entries = createTestEntries([
        { tier: 'premium', cost: 0.10 },
        { tier: 'premium', cost: 0.10 },
        { tier: 'premium', cost: 0.10 },
        { tier: 'standard', cost: 0.02 },
      ]);

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      const recommendations = service.generateOptimizationRecommendations(entries, report);
      
      const tierRec = recommendations.find(r => r.type === 'tier_downgrade');
      expect(tierRec).toBeDefined();
      expect(tierRec?.priority).toBe('high');
    });

    it('should recommend model switch for high GPT-4 usage', () => {
      const entries = createTestEntries([
        { model: 'gpt-4-turbo', cost: 0.10 },
        { model: 'gpt-4-turbo', cost: 0.10 },
        { model: 'gpt-4-turbo', cost: 0.10 },
        { model: 'gpt-3.5-turbo', cost: 0.01 },
      ]);

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      const recommendations = service.generateOptimizationRecommendations(entries, report);
      
      const modelRec = recommendations.find(r => r.type === 'model_switch');
      expect(modelRec).toBeDefined();
      expect(modelRec?.priority).toBe('medium');
    });

    it('should recommend caching for high-frequency operations', () => {
      const entries = createTestEntries(
        Array(10).fill({ operation: 'chat', cost: 0.01 })
      );

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      const recommendations = service.generateOptimizationRecommendations(entries, report);
      
      const cacheRec = recommendations.find(r => r.type === 'caching_opportunity');
      expect(cacheRec).toBeDefined();
    });

    it('should recommend prompt optimization for long prompts', () => {
      const entries = createTestEntries([
        { promptTokens: 3000, cost: 0.05 },
        { promptTokens: 3500, cost: 0.06 },
        { promptTokens: 2500, cost: 0.04 },
      ]);

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      const recommendations = service.generateOptimizationRecommendations(entries, report);
      
      const promptRec = recommendations.find(r => r.type === 'prompt_optimization');
      expect(promptRec).toBeDefined();
    });

    it('should sort recommendations by priority', () => {
      const entries = createTestEntries([
        { tier: 'premium', model: 'gpt-4-turbo', cost: 0.10, promptTokens: 3000 },
        { tier: 'premium', model: 'gpt-4-turbo', cost: 0.10, promptTokens: 3000 },
        { tier: 'premium', model: 'gpt-4-turbo', cost: 0.10, promptTokens: 3000 },
      ]);

      const report = service.generateReport(
        entries,
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      const recommendations = service.generateOptimizationRecommendations(entries, report);
      
      // High priority should come first
      if (recommendations.length > 1) {
        const priorities = recommendations.map(r => r.priority);
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        
        for (let i = 1; i < priorities.length; i++) {
          expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i - 1]]);
        }
      }
    });
  });

  describe('Cost Thresholds', () => {
    it('should return warning alert at warning threshold', () => {
      const alert = service.checkThresholds(85, 'daily');
      
      expect(alert).not.toBeNull();
      expect(alert!.type).toBe('warning');
      expect(alert!.percentUsed).toBe(85);
    });

    it('should return critical alert at critical threshold', () => {
      const alert = service.checkThresholds(95, 'daily');
      
      expect(alert).not.toBeNull();
      expect(alert!.type).toBe('critical');
    });

    it('should return exceeded alert when limit exceeded', () => {
      const alert = service.checkThresholds(110, 'daily');
      
      expect(alert).not.toBeNull();
      expect(alert!.type).toBe('exceeded');
    });

    it('should return null when under warning threshold', () => {
      const alert = service.checkThresholds(50, 'daily');
      expect(alert).toBeNull();
    });

    it('should allow custom thresholds', () => {
      service.setThresholds([
        { type: 'daily', limit: 50, warningPercent: 70, criticalPercent: 85 },
      ]);

      const alert = service.checkThresholds(40, 'daily');
      expect(alert).not.toBeNull();
      expect(alert!.type).toBe('warning');
    });
  });
});

// Helper functions
function createCostEntry(overrides: Partial<CostEntry> = {}): CostEntry {
  return {
    id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date('2024-01-01T12:00:00'),
    accountId: 'account-123',
    creatorId: 'creator-456',
    deployment: 'gpt-4-turbo-prod',
    model: 'gpt-4-turbo',
    tier: 'premium',
    operation: 'chat',
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
    cost: 0.01,
    success: true,
    ...overrides,
  };
}

function createTestEntries(configs: Partial<CostEntry>[]): CostEntry[] {
  return configs.map((config, i) => createCostEntry({
    timestamp: new Date('2024-01-01T12:00:00'),
    ...config,
  }));
}
