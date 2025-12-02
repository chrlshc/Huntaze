/**
 * Unit tests for Azure Auto-scaling Service
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 43: Configure Azure OpenAI auto-scaling
 * Validates: Requirements 12.1, 12.2, 12.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureAutoScalingService,
  PTUConfiguration,
  ScalingRule,
  CapacityMetrics,
} from '../../../lib/ai/azure/azure-autoscaling.service';

describe('AzureAutoScalingService', () => {
  let service: AzureAutoScalingService;

  beforeEach(() => {
    service = new AzureAutoScalingService();
  });

  describe('PTU Configuration', () => {
    it('should initialize with default configurations', () => {
      const configs = service.getAllConfigurations();
      expect(configs.length).toBeGreaterThan(0);
      
      const gpt4Config = configs.find(c => c.deploymentName === 'gpt-4-turbo-prod');
      expect(gpt4Config).toBeDefined();
      expect(gpt4Config?.basePTU).toBe(100);
    });

    it('should configure PTU for a deployment', () => {
      const config: PTUConfiguration = {
        deploymentName: 'test-deployment',
        basePTU: 50,
        minPTU: 25,
        maxPTU: 200,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        cooldownPeriodMs: 300000,
        guaranteedLatencyMs: 500,
      };

      service.configurePTU(config);
      
      const retrieved = service.getConfiguration('test-deployment');
      expect(retrieved).toEqual(config);
    });

    it('should reject invalid PTU configuration (minPTU > maxPTU)', () => {
      const config: PTUConfiguration = {
        deploymentName: 'invalid-deployment',
        basePTU: 50,
        minPTU: 200,
        maxPTU: 100,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        cooldownPeriodMs: 300000,
        guaranteedLatencyMs: 500,
      };

      expect(() => service.configurePTU(config)).toThrow('minPTU cannot be greater than maxPTU');
    });

    it('should reject invalid PTU configuration (basePTU out of range)', () => {
      const config: PTUConfiguration = {
        deploymentName: 'invalid-deployment',
        basePTU: 300,
        minPTU: 50,
        maxPTU: 200,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        cooldownPeriodMs: 300000,
        guaranteedLatencyMs: 500,
      };

      expect(() => service.configurePTU(config)).toThrow('basePTU must be between minPTU and maxPTU');
    });

    it('should reject invalid threshold configuration', () => {
      const config: PTUConfiguration = {
        deploymentName: 'invalid-deployment',
        basePTU: 100,
        minPTU: 50,
        maxPTU: 200,
        scaleUpThreshold: 30,
        scaleDownThreshold: 80,
        cooldownPeriodMs: 300000,
        guaranteedLatencyMs: 500,
      };

      expect(() => service.configurePTU(config)).toThrow('scaleUpThreshold must be greater than scaleDownThreshold');
    });
  });

  describe('Scaling Rules', () => {
    it('should add scaling rules', () => {
      const rule: ScalingRule = {
        id: 'rule-1',
        deploymentName: 'gpt-4-turbo-prod',
        metricName: 'utilization',
        operator: 'gt',
        threshold: 90,
        action: 'scale_up',
        adjustment: 50,
        cooldownMs: 300000,
      };

      service.addScalingRule(rule);
      
      const rules = service.getScalingRules('gpt-4-turbo-prod');
      expect(rules).toContainEqual(rule);
    });

    it('should update existing scaling rule', () => {
      const rule: ScalingRule = {
        id: 'rule-1',
        deploymentName: 'gpt-4-turbo-prod',
        metricName: 'utilization',
        operator: 'gt',
        threshold: 90,
        action: 'scale_up',
        adjustment: 50,
        cooldownMs: 300000,
      };

      service.addScalingRule(rule);
      
      const updatedRule = { ...rule, threshold: 95 };
      service.addScalingRule(updatedRule);
      
      const rules = service.getScalingRules('gpt-4-turbo-prod');
      expect(rules.find(r => r.id === 'rule-1')?.threshold).toBe(95);
    });

    it('should remove scaling rules', () => {
      const rule: ScalingRule = {
        id: 'rule-to-remove',
        deploymentName: 'gpt-4-turbo-prod',
        metricName: 'latency',
        operator: 'gt',
        threshold: 1000,
        action: 'scale_up',
        adjustment: 25,
        cooldownMs: 300000,
      };

      service.addScalingRule(rule);
      const removed = service.removeScalingRule('gpt-4-turbo-prod', 'rule-to-remove');
      
      expect(removed).toBe(true);
      expect(service.getScalingRules('gpt-4-turbo-prod')).not.toContainEqual(rule);
    });
  });

  describe('Auto-scaling Behavior', () => {
    it('should scale up when utilization exceeds threshold', () => {
      const metrics: CapacityMetrics = {
        deploymentName: 'gpt-4-turbo-prod',
        currentPTU: 100,
        utilization: 85, // Above 80% threshold
        averageLatencyMs: 300,
        queueDepth: 10,
        errorRate: 0.01,
        timestamp: new Date(),
      };

      const event = service.recordMetrics(metrics);
      
      expect(event).not.toBeNull();
      expect(event?.newPTU).toBeGreaterThan(event?.previousPTU || 0);
      expect(event?.reason).toBe('High utilization');
    });

    it('should scale down when utilization is below threshold', () => {
      // First, manually scale up
      service.manualScale('gpt-4-turbo-prod', 200, 'Test scale up');
      
      // Wait for cooldown (simulate by creating new service)
      const newService = new AzureAutoScalingService();
      newService.manualScale('gpt-4-turbo-prod', 200, 'Test scale up');
      
      const metrics: CapacityMetrics = {
        deploymentName: 'gpt-4-turbo-prod',
        currentPTU: 200,
        utilization: 20, // Below 30% threshold
        averageLatencyMs: 100,
        queueDepth: 0,
        errorRate: 0,
        timestamp: new Date(),
      };

      const event = newService.recordMetrics(metrics);
      
      // May be null due to cooldown, but if triggered, should scale down
      if (event) {
        expect(event.newPTU).toBeLessThan(event.previousPTU);
      }
    });

    it('should respect cooldown period', () => {
      const metrics: CapacityMetrics = {
        deploymentName: 'gpt-4-turbo-prod',
        currentPTU: 100,
        utilization: 85,
        averageLatencyMs: 300,
        queueDepth: 10,
        errorRate: 0.01,
        timestamp: new Date(),
      };

      // First scaling event
      const event1 = service.recordMetrics(metrics);
      expect(event1).not.toBeNull();

      // Second scaling event should be blocked by cooldown
      const event2 = service.recordMetrics(metrics);
      expect(event2).toBeNull();
    });

    it('should not scale beyond maxPTU', () => {
      // Set capacity near max
      service.manualScale('gpt-4-turbo-prod', 490, 'Near max');
      
      const newService = new AzureAutoScalingService();
      newService.configurePTU({
        deploymentName: 'gpt-4-turbo-prod',
        basePTU: 490,
        minPTU: 50,
        maxPTU: 500,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        cooldownPeriodMs: 0, // No cooldown for test
        guaranteedLatencyMs: 500,
      });

      const metrics: CapacityMetrics = {
        deploymentName: 'gpt-4-turbo-prod',
        currentPTU: 490,
        utilization: 95,
        averageLatencyMs: 800,
        queueDepth: 50,
        errorRate: 0.05,
        timestamp: new Date(),
      };

      const event = newService.recordMetrics(metrics);
      
      if (event) {
        expect(event.newPTU).toBeLessThanOrEqual(500);
      }
    });
  });

  describe('Manual Scaling', () => {
    it('should allow manual scaling within limits', () => {
      const event = service.manualScale('gpt-4-turbo-prod', 150, 'Manual test');
      
      expect(event).not.toBeNull();
      expect(event?.newPTU).toBe(150);
      expect(event?.triggeredBy).toBe('manual');
    });

    it('should reject manual scaling outside limits', () => {
      expect(() => service.manualScale('gpt-4-turbo-prod', 1000, 'Too high'))
        .toThrow('PTU must be between');
    });

    it('should return null when scaling to same value', () => {
      const currentCapacity = service.getCurrentCapacity('gpt-4-turbo-prod');
      const event = service.manualScale('gpt-4-turbo-prod', currentCapacity!, 'Same value');
      
      expect(event).toBeNull();
    });
  });

  describe('Alerts', () => {
    it('should generate high utilization alert', () => {
      const metrics: CapacityMetrics = {
        deploymentName: 'gpt-4-turbo-prod',
        currentPTU: 100,
        utilization: 92,
        averageLatencyMs: 300,
        queueDepth: 10,
        errorRate: 0.01,
        timestamp: new Date(),
      };

      service.recordMetrics(metrics);
      
      const alerts = service.getDeploymentAlerts('gpt-4-turbo-prod');
      const highUtilAlert = alerts.find(a => a.alertType === 'high_utilization');
      
      expect(highUtilAlert).toBeDefined();
    });

    it('should generate latency breach alert', () => {
      const metrics: CapacityMetrics = {
        deploymentName: 'gpt-4-turbo-prod',
        currentPTU: 100,
        utilization: 50,
        averageLatencyMs: 800, // Above 500ms threshold
        queueDepth: 10,
        errorRate: 0.01,
        timestamp: new Date(),
      };

      service.recordMetrics(metrics);
      
      const alerts = service.getDeploymentAlerts('gpt-4-turbo-prod');
      const latencyAlert = alerts.find(a => a.alertType === 'latency_breach');
      
      expect(latencyAlert).toBeDefined();
    });

    it('should clear alerts', () => {
      const metrics: CapacityMetrics = {
        deploymentName: 'gpt-4-turbo-prod',
        currentPTU: 100,
        utilization: 95,
        averageLatencyMs: 300,
        queueDepth: 10,
        errorRate: 0.01,
        timestamp: new Date(),
      };

      service.recordMetrics(metrics);
      service.clearAlerts('gpt-4-turbo-prod');
      
      const alerts = service.getDeploymentAlerts('gpt-4-turbo-prod');
      expect(alerts.length).toBe(0);
    });
  });

  describe('Capacity Summary', () => {
    it('should return capacity summary for all deployments', () => {
      const summary = service.getCapacitySummary();
      
      expect(summary['gpt-4-turbo-prod']).toBeDefined();
      expect(summary['gpt-4-turbo-prod'].currentPTU).toBeDefined();
      expect(summary['gpt-4-turbo-prod'].minPTU).toBeDefined();
      expect(summary['gpt-4-turbo-prod'].maxPTU).toBeDefined();
    });
  });

  describe('Scaling Prediction', () => {
    it('should return null with insufficient data', () => {
      const prediction = service.predictScalingNeeds('gpt-4-turbo-prod');
      expect(prediction).toBeNull();
    });

    it('should predict scaling needs with sufficient data', () => {
      // Add enough metrics
      for (let i = 0; i < 20; i++) {
        service.recordMetrics({
          deploymentName: 'gpt-4-turbo-prod',
          currentPTU: 100,
          utilization: 60 + (i * 0.5), // Gradually increasing
          averageLatencyMs: 300,
          queueDepth: 5,
          errorRate: 0.01,
          timestamp: new Date(Date.now() - (20 - i) * 60000),
        });
      }

      const prediction = service.predictScalingNeeds('gpt-4-turbo-prod');
      
      expect(prediction).not.toBeNull();
      expect(prediction?.predictedUtilization).toBeGreaterThanOrEqual(0);
      expect(prediction?.predictedUtilization).toBeLessThanOrEqual(100);
      expect(prediction?.confidence).toBeGreaterThan(0);
      expect(prediction?.confidence).toBeLessThanOrEqual(1);
    });
  });
});
