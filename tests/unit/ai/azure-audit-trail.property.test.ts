/**
 * Property-Based Tests for Azure Audit Trail Service
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 37.1: Write property test for audit trail
 * **Property 33: Audit trail completeness**
 * **Validates: Requirements 9.5**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzureAuditTrailService,
  AuditLogEntry,
  AuditEventType,
} from '../../../lib/ai/azure/azure-audit-trail.service';

describe('AzureAuditTrailService - Property Tests', () => {
  let service: AzureAuditTrailService;

  beforeEach(() => {
    AzureAuditTrailService.resetInstance();
    service = new AzureAuditTrailService({ enabled: true, redactPII: false });
  });

  /**
   * **Feature: huntaze-ai-azure-migration, Property 33: Audit trail completeness**
   * **Validates: Requirements 9.5**
   * 
   * Property: For any AI operation, the audit log entry should contain
   * all required fields with correct values
   */
  describe('Property 33: Audit trail completeness', () => {
    it('should create complete audit entries for all AI operations', () => {
      const operationArb = fc.constantFrom(
        'chat_completion',
        'embedding',
        'image_analysis',
        'content_moderation'
      );
      const accountIdArb = fc.stringMatching(/^[a-z0-9]{5,15}$/).map(s => `acc_${s}`);
      const correlationIdArb = fc.stringMatching(/^[a-z0-9]{5,15}$/).map(s => `corr_${s}`);
      const modelArb = fc.constantFrom('gpt-4', 'gpt-3.5-turbo', 'text-embedding-ada-002');
      const deploymentArb = fc.constantFrom('gpt-4-turbo-prod', 'gpt-35-turbo-prod', 'embedding-prod');
      const tierArb = fc.constantFrom('premium', 'standard', 'economy');
      const tokensArb = fc.integer({ min: 1, max: 10000 });
      const costArb = fc.float({ min: 0, max: 10, noNaN: true });
      const latencyArb = fc.integer({ min: 50, max: 30000 });
      const successArb = fc.boolean();

      fc.assert(
        fc.property(
          operationArb,
          accountIdArb,
          correlationIdArb,
          modelArb,
          deploymentArb,
          tierArb,
          tokensArb,
          tokensArb,
          costArb,
          latencyArb,
          successArb,
          (operation, accountId, correlationId, model, deployment, tier, promptTokens, completionTokens, cost, latencyMs, success) => {
            const entry = service.logAIOperation({
              operation,
              accountId,
              correlationId,
              model,
              deployment,
              tier,
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
              cost,
              latencyMs,
              success,
            });

            // Verify all required fields are present
            expect(entry.id).toBeDefined();
            expect(entry.id.length).toBeGreaterThan(0);
            expect(entry.timestamp).toBeInstanceOf(Date);
            expect(entry.eventType).toBeDefined();
            expect(entry.operation).toBe(operation);
            expect(entry.accountId).toBe(accountId);
            expect(entry.correlationId).toBe(correlationId);
            expect(entry.resource.type).toBe('azure_openai');
            expect(entry.resource.id).toBe(deployment);
            expect(entry.details.model).toBe(model);
            expect(entry.details.deployment).toBe(deployment);
            expect(entry.details.tier).toBe(tier);
            expect(entry.details.promptTokens).toBe(promptTokens);
            expect(entry.details.completionTokens).toBe(completionTokens);
            expect(entry.details.totalTokens).toBe(promptTokens + completionTokens);
            expect(entry.details.cost).toBe(cost);
            expect(entry.details.latencyMs).toBe(latencyMs);
            expect(entry.outcome.success).toBe(success);
            expect(entry.checksum).toBeDefined();
            expect(entry.checksum.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all logged entries', () => {
      const countArb = fc.integer({ min: 1, max: 20 });

      fc.assert(
        fc.property(countArb, (count) => {
          service.clearEntries();

          const loggedIds: string[] = [];
          for (let i = 0; i < count; i++) {
            const entry = service.logAIOperation({
              operation: `op_${i}`,
              accountId: `acc_${i}`,
              correlationId: `corr_${i}`,
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
            loggedIds.push(entry.id);
          }

          // All entries should be retrievable
          const allEntries = service.getAllEntries();
          expect(allEntries.length).toBe(count);

          // Each logged ID should be findable
          for (const id of loggedIds) {
            const found = service.getEntry(id);
            expect(found).toBeDefined();
            expect(found!.id).toBe(id);
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property: Checksum should be unique and verifiable
   */
  describe('Checksum Integrity Property', () => {
    it('should generate verifiable checksums for all entries', () => {
      const operationArb = fc.string({ minLength: 1, maxLength: 50 });
      const accountIdArb = fc.string({ minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(operationArb, accountIdArb, (operation, accountId) => {
          const entry = service.logAIOperation({
            operation,
            accountId,
            correlationId: 'corr_test',
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

          // Checksum should be verifiable
          expect(service.verifyIntegrity(entry.id)).toBe(true);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Query should return correct filtered results
   */
  describe('Query Correctness Property', () => {
    it('should return only entries matching account filter', () => {
      service.clearEntries();

      const accountsArb = fc.array(
        fc.stringMatching(/^[a-z0-9]{3,10}$/),
        { minLength: 2, maxLength: 5 }
      );

      fc.assert(
        fc.property(accountsArb, (accounts) => {
          service.clearEntries();

          // Create entries for each account
          for (const account of accounts) {
            service.logAIOperation({
              operation: 'test',
              accountId: account,
              correlationId: `corr_${account}`,
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
          }

          // Query for first account
          const targetAccount = accounts[0];
          const result = service.query({ accountId: targetAccount });

          // All results should have the target account
          expect(result.entries.every(e => e.accountId === targetAccount)).toBe(true);
        }),
        { numRuns: 20 }
      );
    });

    it('should return only entries matching success filter', () => {
      service.clearEntries();

      const entriesArb = fc.array(fc.boolean(), { minLength: 5, maxLength: 20 });

      fc.assert(
        fc.property(entriesArb, (successValues) => {
          service.clearEntries();

          // Create entries with varying success values
          for (let i = 0; i < successValues.length; i++) {
            service.logAIOperation({
              operation: `op_${i}`,
              accountId: 'acc_test',
              correlationId: `corr_${i}`,
              model: 'gpt-4',
              deployment: 'gpt-4-turbo-prod',
              tier: 'premium',
              promptTokens: 100,
              completionTokens: 50,
              totalTokens: 150,
              cost: 0.015,
              latencyMs: 1500,
              success: successValues[i],
            });
          }

          // Query for successful entries
          const successResult = service.query({ success: true });
          const expectedSuccessCount = successValues.filter(s => s).length;
          expect(successResult.entries.length).toBe(expectedSuccessCount);
          expect(successResult.entries.every(e => e.outcome.success === true)).toBe(true);

          // Query for failed entries
          const failResult = service.query({ success: false });
          const expectedFailCount = successValues.filter(s => !s).length;
          expect(failResult.entries.length).toBe(expectedFailCount);
          expect(failResult.entries.every(e => e.outcome.success === false)).toBe(true);
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property: Correlation ID grouping should be correct
   */
  describe('Correlation ID Grouping Property', () => {
    it('should group all entries with same correlation ID', () => {
      service.clearEntries();

      const correlationIdArb = fc.stringMatching(/^[a-z0-9]{5,15}$/);
      const countArb = fc.integer({ min: 1, max: 10 });

      fc.assert(
        fc.property(correlationIdArb, countArb, (correlationId, count) => {
          service.clearEntries();

          // Create multiple entries with same correlation ID
          for (let i = 0; i < count; i++) {
            service.logAIOperation({
              operation: `op_${i}`,
              accountId: 'acc_test',
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
          }

          // Add some entries with different correlation ID
          service.logAIOperation({
            operation: 'other',
            accountId: 'acc_test',
            correlationId: 'different_corr',
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

          // Get by correlation ID
          const entries = service.getByCorrelationId(correlationId);
          expect(entries.length).toBe(count);
          expect(entries.every(e => e.correlationId === correlationId)).toBe(true);
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property: Statistics should be accurate
   */
  describe('Statistics Accuracy Property', () => {
    it('should accurately count entries by outcome', () => {
      service.clearEntries();

      const successCountArb = fc.integer({ min: 0, max: 20 });
      const failCountArb = fc.integer({ min: 0, max: 20 });

      fc.assert(
        fc.property(successCountArb, failCountArb, (successCount, failCount) => {
          service.clearEntries();

          // Create successful entries
          for (let i = 0; i < successCount; i++) {
            service.logAIOperation({
              operation: `success_${i}`,
              accountId: 'acc_test',
              correlationId: `corr_s_${i}`,
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
          }

          // Create failed entries
          for (let i = 0; i < failCount; i++) {
            service.logAIOperation({
              operation: `fail_${i}`,
              accountId: 'acc_test',
              correlationId: `corr_f_${i}`,
              model: 'gpt-4',
              deployment: 'gpt-4-turbo-prod',
              tier: 'premium',
              promptTokens: 100,
              completionTokens: 0,
              totalTokens: 100,
              cost: 0,
              latencyMs: 500,
              success: false,
              errorCode: 'ERROR',
              errorMessage: 'Test error',
            });
          }

          const stats = service.getStats();
          expect(stats.totalEntries).toBe(successCount + failCount);
          expect(stats.byOutcome.success).toBe(successCount);
          expect(stats.byOutcome.failure).toBe(failCount);
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property: Timestamps should be monotonically increasing
   */
  describe('Timestamp Ordering Property', () => {
    it('should have monotonically increasing timestamps', () => {
      service.clearEntries();

      const countArb = fc.integer({ min: 2, max: 20 });

      fc.assert(
        fc.property(countArb, (count) => {
          service.clearEntries();

          for (let i = 0; i < count; i++) {
            service.logAIOperation({
              operation: `op_${i}`,
              accountId: 'acc_test',
              correlationId: `corr_${i}`,
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
          }

          const entries = service.getAllEntries();
          
          // Timestamps should be non-decreasing
          for (let i = 1; i < entries.length; i++) {
            expect(entries[i].timestamp.getTime()).toBeGreaterThanOrEqual(
              entries[i - 1].timestamp.getTime()
            );
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property: Export should include all queried entries
   */
  describe('Export Completeness Property', () => {
    it('should export all entries matching query', () => {
      service.clearEntries();

      const countArb = fc.integer({ min: 1, max: 10 });

      fc.assert(
        fc.property(countArb, (count) => {
          service.clearEntries();

          for (let i = 0; i < count; i++) {
            service.logAIOperation({
              operation: `op_${i}`,
              accountId: 'acc_export_test',
              correlationId: `corr_${i}`,
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
          }

          const exported = service.exportForCompliance({ accountId: 'acc_export_test' });
          const parsed = JSON.parse(exported);

          expect(parsed.length).toBe(count);
        }),
        { numRuns: 20 }
      );
    });
  });
});
