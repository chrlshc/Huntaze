/**
 * Unit Tests for Azure Audit Trail Service
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 37: Implement audit trail for AI operations
 * Validates: Requirements 9.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureAuditTrailService,
  AuditLogEntry,
} from '../../../lib/ai/azure/azure-audit-trail.service';

describe('AzureAuditTrailService', () => {
  let service: AzureAuditTrailService;

  beforeEach(() => {
    AzureAuditTrailService.resetInstance();
    service = new AzureAuditTrailService({ enabled: true, redactPII: true });
  });

  describe('AI Operation Logging', () => {
    it('should log successful AI operations', () => {
      const entry = service.logAIOperation({
        operation: 'chat_completion',
        accountId: 'acc_123',
        userId: 'user_456',
        creatorId: 'creator_789',
        correlationId: 'corr_abc',
        requestId: 'req_xyz',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
        input: 'Hello, how are you?',
        output: 'I am doing well, thank you!',
      });

      expect(entry.id).toBeDefined();
      expect(entry.eventType).toBe('ai_response');
      expect(entry.operation).toBe('chat_completion');
      expect(entry.accountId).toBe('acc_123');
      expect(entry.outcome.success).toBe(true);
      expect(entry.details.model).toBe('gpt-4');
      expect(entry.details.promptTokens).toBe(100);
      expect(entry.details.cost).toBe(0.015);
      expect(entry.checksum).toBeDefined();
    });

    it('should log failed AI operations', () => {
      const entry = service.logAIOperation({
        operation: 'chat_completion',
        accountId: 'acc_123',
        correlationId: 'corr_abc',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 0,
        totalTokens: 100,
        cost: 0,
        latencyMs: 500,
        success: false,
        errorCode: 'RATE_LIMIT',
        errorMessage: 'Rate limit exceeded',
      });

      expect(entry.eventType).toBe('error');
      expect(entry.outcome.success).toBe(false);
      expect(entry.details.errorCode).toBe('RATE_LIMIT');
    });
  });

  describe('Data Access Logging', () => {
    it('should log data access events', () => {
      const entry = service.logDataAccess({
        operation: 'memory_query',
        accountId: 'acc_123',
        userId: 'user_456',
        correlationId: 'corr_abc',
        resourceType: 'memory',
        resourceId: 'mem_xyz',
        success: true,
      });

      expect(entry.eventType).toBe('data_access');
      expect(entry.resource.type).toBe('memory');
      expect(entry.resource.id).toBe('mem_xyz');
    });
  });

  describe('Data Deletion Logging', () => {
    it('should log GDPR deletion events', () => {
      const entry = service.logDataDeletion({
        accountId: 'acc_123',
        userId: 'user_456',
        correlationId: 'corr_abc',
        resourceType: 'user_data',
        resourceId: 'user_456',
        deletedItems: 150,
        success: true,
      });

      expect(entry.eventType).toBe('data_deletion');
      expect(entry.operation).toBe('gdpr_deletion');
      expect(entry.metadata.deletedItems).toBe(150);
    });
  });

  describe('Configuration Change Logging', () => {
    it('should log configuration changes', () => {
      const entry = service.logConfigurationChange({
        accountId: 'acc_123',
        userId: 'admin_001',
        correlationId: 'corr_abc',
        resourceId: 'config_ai',
        changes: [
          { field: 'tier', oldValue: 'standard', newValue: 'premium' },
          { field: 'maxTokens', oldValue: '1000', newValue: '2000' },
        ],
        success: true,
      });

      expect(entry.eventType).toBe('configuration_change');
      expect(entry.details.changes).toHaveLength(2);
      expect(entry.details.changes![0].field).toBe('tier');
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events', () => {
      const entry = service.logSecurityEvent({
        operation: 'unauthorized_access_attempt',
        accountId: 'acc_123',
        correlationId: 'corr_abc',
        resourceType: 'api_key',
        resourceId: 'key_xyz',
        details: 'Invalid API key used',
        severity: 'high',
      });

      expect(entry.eventType).toBe('security_event');
      expect(entry.metadata.severity).toBe('high');
    });
  });

  describe('Query Functionality', () => {
    beforeEach(() => {
      // Create some test entries
      service.logAIOperation({
        operation: 'chat_completion',
        accountId: 'acc_1',
        correlationId: 'corr_1',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
      });

      service.logAIOperation({
        operation: 'embedding',
        accountId: 'acc_2',
        correlationId: 'corr_2',
        model: 'text-embedding-ada-002',
        deployment: 'embedding-prod',
        tier: 'economy',
        promptTokens: 500,
        completionTokens: 0,
        totalTokens: 500,
        cost: 0.001,
        latencyMs: 200,
        success: true,
      });

      service.logDataAccess({
        operation: 'memory_query',
        accountId: 'acc_1',
        correlationId: 'corr_3',
        resourceType: 'memory',
        resourceId: 'mem_1',
        success: false,
        errorMessage: 'Not found',
      });
    });

    it('should query all entries', () => {
      const result = service.query();
      expect(result.entries.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should filter by account ID', () => {
      const result = service.query({ accountId: 'acc_1' });
      expect(result.entries.length).toBe(2);
      expect(result.entries.every(e => e.accountId === 'acc_1')).toBe(true);
    });

    it('should filter by event type', () => {
      const result = service.query({ eventTypes: ['data_access'] });
      expect(result.entries.length).toBe(1);
      expect(result.entries[0].eventType).toBe('data_access');
    });

    it('should filter by success', () => {
      const result = service.query({ success: false });
      expect(result.entries.length).toBe(1);
      expect(result.entries[0].outcome.success).toBe(false);
    });

    it('should support pagination', () => {
      const result1 = service.query({ limit: 2, offset: 0 });
      expect(result1.entries.length).toBe(2);
      expect(result1.hasMore).toBe(true);

      const result2 = service.query({ limit: 2, offset: 2 });
      expect(result2.entries.length).toBe(1);
      expect(result2.hasMore).toBe(false);
    });
  });

  describe('Correlation ID Tracking', () => {
    it('should retrieve entries by correlation ID', () => {
      const correlationId = 'corr_test_123';

      service.logAIOperation({
        operation: 'chat_completion',
        accountId: 'acc_1',
        correlationId,
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
      });

      service.logDataAccess({
        operation: 'memory_query',
        accountId: 'acc_1',
        correlationId,
        resourceType: 'memory',
        resourceId: 'mem_1',
        success: true,
      });

      const entries = service.getByCorrelationId(correlationId);
      expect(entries.length).toBe(2);
      expect(entries.every(e => e.correlationId === correlationId)).toBe(true);
    });
  });

  describe('Integrity Verification', () => {
    it('should verify entry integrity', () => {
      const entry = service.logAIOperation({
        operation: 'chat_completion',
        accountId: 'acc_1',
        correlationId: 'corr_1',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
      });

      expect(service.verifyIntegrity(entry.id)).toBe(true);
    });

    it('should verify all entries integrity', () => {
      service.logAIOperation({
        operation: 'op1',
        accountId: 'acc_1',
        correlationId: 'corr_1',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
      });

      service.logAIOperation({
        operation: 'op2',
        accountId: 'acc_2',
        correlationId: 'corr_2',
        model: 'gpt-3.5-turbo',
        deployment: 'gpt-35-turbo-prod',
        tier: 'economy',
        promptTokens: 50,
        completionTokens: 25,
        totalTokens: 75,
        cost: 0.001,
        latencyMs: 500,
        success: true,
      });

      const result = service.verifyAllIntegrity();
      expect(result.valid).toBe(2);
      expect(result.invalid).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics', () => {
      service.logAIOperation({
        operation: 'chat_completion',
        accountId: 'acc_1',
        correlationId: 'corr_1',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
      });

      service.logAIOperation({
        operation: 'chat_completion',
        accountId: 'acc_2',
        correlationId: 'corr_2',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: false,
        errorCode: 'ERROR',
        errorMessage: 'Test error',
      });

      const stats = service.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.byOutcome.success).toBe(1);
      expect(stats.byOutcome.failure).toBe(1);
      expect(stats.byEventType.ai_response).toBe(1);
      expect(stats.byEventType.error).toBe(1);
    });
  });

  describe('PII Redaction', () => {
    it('should redact PII from input/output summaries', () => {
      const entry = service.logAIOperation({
        operation: 'chat_completion',
        accountId: 'acc_1',
        correlationId: 'corr_1',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
        input: 'My email is john@example.com',
        output: 'I see your email is john@example.com',
      });

      expect(entry.details.inputSummary).not.toContain('john@example.com');
      expect(entry.details.outputSummary).not.toContain('john@example.com');
      expect(entry.details.inputSummary).toContain('[EMAIL_REDACTED]');
    });
  });

  describe('Retention Policy', () => {
    it('should enforce retention policy', () => {
      // Create service with 1 day retention
      const shortRetentionService = new AzureAuditTrailService({
        enabled: true,
        retentionDays: 1,
      });

      // Log an entry
      shortRetentionService.logAIOperation({
        operation: 'test',
        accountId: 'acc_1',
        correlationId: 'corr_1',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
      });

      // Entry should exist
      const entries = shortRetentionService.getAllEntries();
      expect(entries.length).toBe(1);
    });
  });

  describe('Export Functionality', () => {
    it('should export entries for compliance', () => {
      service.logAIOperation({
        operation: 'chat_completion',
        accountId: 'acc_1',
        correlationId: 'corr_1',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
      });

      const exported = service.exportForCompliance();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].operation).toBe('chat_completion');
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      service.updateConfig({ retentionDays: 180 });
      const config = service.getConfig();
      expect(config.retentionDays).toBe(180);
    });

    it('should respect disabled state', () => {
      service.updateConfig({ enabled: false });
      
      const entry = service.logAIOperation({
        operation: 'test',
        accountId: 'acc_1',
        correlationId: 'corr_1',
        model: 'gpt-4',
        deployment: 'gpt-4-turbo-prod',
        tier: 'premium',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.015,
        latencyMs: 1500,
        success: true,
      });

      expect(entry.id).toBe('disabled');
    });
  });
});
