/**
 * Unit tests for Azure Rollback Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureRollbackService,
  RollbackConfig,
  AIProvider
} from '../../../lib/ai/azure/azure-rollback.service';

describe('AzureRollbackService', () => {
  let service: AzureRollbackService;

  beforeEach(() => {
    service = new AzureRollbackService({
      cooldownPeriodMs: 100 // Short cooldown for testing
    });
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const config = service.getConfig();
      expect(config.currentProvider).toBe('azure');
      expect(config.fallbackProvider).toBe('openai');
      expect(config.autoRollbackEnabled).toBe(true);
      expect(config.errorThreshold).toBe(10);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<RollbackConfig> = {
        currentProvider: 'openai',
        fallbackProvider: 'anthropic',
        errorThreshold: 20
      };
      const customService = new AzureRollbackService(customConfig);
      const config = customService.getConfig();
      
      expect(config.currentProvider).toBe('openai');
      expect(config.fallbackProvider).toBe('anthropic');
      expect(config.errorThreshold).toBe(20);
    });

    it('should initialize health status for all providers', () => {
      const providers: AIProvider[] = ['azure', 'openai', 'anthropic'];
      
      for (const provider of providers) {
        const health = service.getHealthStatus(provider);
        expect(health).toBeDefined();
        expect(health?.healthy).toBe(true);
      }
    });
  });

  describe('rollback execution', () => {
    it('should execute manual rollback', async () => {
      const event = await service.rollback('manual', 'test-user');

      expect(event.fromProvider).toBe('azure');
      expect(event.toProvider).toBe('openai');
      expect(event.reason).toBe('manual');
      expect(event.triggeredBy).toBe('test-user');
      expect(event.dataPreserved).toBe(true);
      expect(event.rollbackDurationMs).toBeGreaterThan(0);
    });

    it('should update state after rollback', async () => {
      await service.rollback('manual', 'test-user');
      const state = service.getState();

      expect(state.currentProvider).toBe('openai');
      expect(state.previousProvider).toBe('azure');
      expect(state.rollbackCount).toBe(1);
      expect(state.lastRollback).toBeDefined();
    });

    it('should enter cooldown after rollback', async () => {
      await service.rollback('manual', 'test-user');
      const state = service.getState();

      expect(state.inCooldown).toBe(true);
      expect(state.cooldownEndsAt).toBeDefined();
    });

    it('should prevent rollback during cooldown', async () => {
      await service.rollback('manual', 'test-user');

      await expect(service.rollback('manual', 'test-user'))
        .rejects.toThrow(/cooldown/);
    });

    it('should allow rollback after cooldown expires', async () => {
      await service.rollback('manual', 'test-user');
      
      // Wait for cooldown to expire
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update fallback to allow another rollback
      service.updateConfig({ fallbackProvider: 'azure' });
      
      // Should not throw
      const event = await service.rollback('manual', 'test-user');
      expect(event).toBeDefined();
    });

    it('should track rollback history', async () => {
      await service.rollback('manual', 'test-user');
      const history = service.getRollbackHistory();

      expect(history.length).toBe(1);
      expect(history[0].reason).toBe('manual');
    });
  });


  describe('health monitoring', () => {
    it('should record errors for providers', () => {
      service.recordError('azure');
      const health = service.getHealthStatus('azure');

      expect(health?.errorRate).toBeGreaterThan(0);
    });

    it('should record latency measurements', () => {
      service.recordLatency('azure', 500);
      const health = service.getHealthStatus('azure');

      expect(health?.averageLatencyMs).toBeGreaterThan(0);
    });

    it('should update health status based on errors', () => {
      // Record many errors to exceed threshold
      for (let i = 0; i < 15; i++) {
        service.recordError('azure');
      }
      
      const health = service.getHealthStatus('azure');
      expect(health?.healthy).toBe(false);
    });

    it('should get all health statuses', () => {
      const statuses = service.getAllHealthStatuses();
      
      expect(statuses.length).toBe(3);
      expect(statuses.map(s => s.provider)).toContain('azure');
      expect(statuses.map(s => s.provider)).toContain('openai');
      expect(statuses.map(s => s.provider)).toContain('anthropic');
    });
  });

  describe('provider switching', () => {
    it('should get current provider', () => {
      expect(service.getCurrentProvider()).toBe('azure');
    });

    it('should switch to healthy provider', async () => {
      await service.switchProvider('openai');
      expect(service.getCurrentProvider()).toBe('openai');
    });
  });

  describe('rollback capability', () => {
    it('should check if rollback is available', () => {
      expect(service.canRollback()).toBe(true);
    });

    it('should return false during cooldown', async () => {
      await service.rollback('manual', 'test-user');
      expect(service.canRollback()).toBe(false);
    });

    it('should verify rollback capability', async () => {
      const result = await service.verifyRollbackCapability();
      
      expect(result.canRollback).toBe(true);
      expect(result.reason).toBe('Rollback available');
    });

    it('should report cooldown in verification', async () => {
      await service.rollback('manual', 'test-user');
      const result = await service.verifyRollbackCapability();
      
      expect(result.canRollback).toBe(false);
      expect(result.reason).toContain('cooldown');
    });
  });

  describe('data preservation', () => {
    it('should preserve data during rollback', async () => {
      const event = await service.rollback('manual', 'test-user');
      
      expect(event.dataPreserved).toBe(true);
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      service.updateConfig({ errorThreshold: 25 });
      const config = service.getConfig();
      
      expect(config.errorThreshold).toBe(25);
    });

    it('should reset state', () => {
      service.reset();
      const state = service.getState();
      
      expect(state.rollbackCount).toBe(0);
      expect(state.lastRollback).toBeNull();
      expect(state.inCooldown).toBe(false);
    });
  });
});
