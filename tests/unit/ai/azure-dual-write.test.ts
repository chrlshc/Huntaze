/**
 * Unit tests for Azure Dual-Write Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureDualWriteService,
  WriteOperation,
  DualWriteConfig
} from '../../../lib/ai/azure/azure-dual-write.service';

describe('AzureDualWriteService', () => {
  let service: AzureDualWriteService;

  beforeEach(() => {
    service = new AzureDualWriteService();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const config = service.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.primaryProvider).toBe('azure');
      expect(config.secondaryProvider).toBe('openai');
      expect(config.consistencyCheckEnabled).toBe(true);
      expect(config.conflictResolution).toBe('primary-wins');
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<DualWriteConfig> = {
        primaryProvider: 'openai',
        secondaryProvider: 'anthropic',
        conflictResolution: 'latest-wins'
      };
      const customService = new AzureDualWriteService(customConfig);
      const config = customService.getConfig();
      
      expect(config.primaryProvider).toBe('openai');
      expect(config.secondaryProvider).toBe('anthropic');
      expect(config.conflictResolution).toBe('latest-wins');
    });

    it('should initialize metrics to zero', () => {
      const metrics = service.getMetrics();
      expect(metrics.totalWrites).toBe(0);
      expect(metrics.successfulWrites).toBe(0);
      expect(metrics.failedWrites).toBe(0);
      expect(metrics.consistencyRate).toBe(100);
    });
  });

  describe('write operations', () => {
    it('should execute dual-write when enabled', async () => {
      const operation: WriteOperation = {
        id: 'test-op-1',
        type: 'memory',
        data: { key: 'value' },
        timestamp: new Date(),
        correlationId: 'corr-123'
      };

      const result = await service.write(operation);

      expect(result.operationId).toBe('test-op-1');
      expect(typeof result.primaryLatencyMs).toBe('number');
      expect(typeof result.secondaryLatencyMs).toBe('number');
    });

    it('should only write to primary when disabled', async () => {
      service.setEnabled(false);
      
      const operation: WriteOperation = {
        id: 'test-op-2',
        type: 'embedding',
        data: { vector: [1, 2, 3] },
        timestamp: new Date(),
        correlationId: 'corr-456'
      };

      const result = await service.write(operation);

      expect(result.secondaryLatencyMs).toBe(0);
      expect(result.consistencyVerified).toBe(true);
    });

    it('should track write history', async () => {
      const operation: WriteOperation = {
        id: 'test-op-3',
        type: 'preference',
        data: { preference: 'dark-mode' },
        timestamp: new Date(),
        correlationId: 'corr-789'
      };

      await service.write(operation);
      const result = service.getWriteResult('test-op-3');

      expect(result).toBeDefined();
      expect(result?.operationId).toBe('test-op-3');
    });

    it('should update metrics after write', async () => {
      const operation: WriteOperation = {
        id: 'test-op-4',
        type: 'interaction',
        data: { action: 'click' },
        timestamp: new Date(),
        correlationId: 'corr-101'
      };

      await service.write(operation);
      const metrics = service.getMetrics();

      expect(metrics.totalWrites).toBe(1);
    });
  });


  describe('consistency verification', () => {
    it('should verify consistency between providers', async () => {
      const result = await service.verifyConsistency('test-op-1');
      
      expect(typeof result.consistent).toBe('boolean');
      expect(Array.isArray(result.conflicts)).toBe(true);
    });
  });

  describe('conflict resolution', () => {
    it('should resolve conflicts with primary-wins strategy', () => {
      const service = new AzureDualWriteService({ conflictResolution: 'primary-wins' });
      
      const result = service.resolveConflict(
        'primary-value',
        'secondary-value',
        new Date(),
        new Date()
      );

      expect(result.resolution).toBe('primary');
      expect(result.value).toBe('primary-value');
    });

    it('should resolve conflicts with secondary-wins strategy', () => {
      const service = new AzureDualWriteService({ conflictResolution: 'secondary-wins' });
      
      const result = service.resolveConflict(
        'primary-value',
        'secondary-value',
        new Date(),
        new Date()
      );

      expect(result.resolution).toBe('secondary');
      expect(result.value).toBe('secondary-value');
    });

    it('should resolve conflicts with latest-wins strategy', () => {
      const service = new AzureDualWriteService({ conflictResolution: 'latest-wins' });
      
      const olderTimestamp = new Date('2024-01-01');
      const newerTimestamp = new Date('2024-12-01');
      
      const result = service.resolveConflict(
        'primary-value',
        'secondary-value',
        olderTimestamp,
        newerTimestamp
      );

      expect(result.resolution).toBe('secondary');
      expect(result.value).toBe('secondary-value');
    });
  });

  describe('reconciliation', () => {
    it('should reconcile data between providers', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const result = await service.reconcile(startDate, endDate);

      expect(result.totalRecords).toBeGreaterThan(0);
      expect(typeof result.matchingRecords).toBe('number');
      expect(typeof result.mismatchedRecords).toBe('number');
      expect(typeof result.reconciled).toBe('boolean');
      expect(Array.isArray(result.details)).toBe(true);
    });
  });

  describe('configuration management', () => {
    it('should enable and disable dual-write', () => {
      expect(service.isEnabled()).toBe(true);
      
      service.setEnabled(false);
      expect(service.isEnabled()).toBe(false);
      
      service.setEnabled(true);
      expect(service.isEnabled()).toBe(true);
    });

    it('should update configuration', () => {
      service.updateConfig({ maxRetries: 5, retryDelayMs: 2000 });
      const config = service.getConfig();
      
      expect(config.maxRetries).toBe(5);
      expect(config.retryDelayMs).toBe(2000);
    });

    it('should reset metrics', () => {
      service.resetMetrics();
      const metrics = service.getMetrics();
      
      expect(metrics.totalWrites).toBe(0);
      expect(metrics.successfulWrites).toBe(0);
      expect(metrics.failedWrites).toBe(0);
    });

    it('should clear history', () => {
      service.clearHistory();
      const result = service.getWriteResult('any-id');
      
      expect(result).toBeUndefined();
    });
  });
});
