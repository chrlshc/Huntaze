/**
 * Property-Based Tests for Azure Cognitive Search GDPR Deletion
 * 
 * **Feature: huntaze-ai-azure-migration, Property 9: GDPR data deletion completeness**
 * **Validates: Requirements 3.5, 9.5**
 * 
 * These tests verify that GDPR-compliant data deletion works correctly
 * across all possible inputs and scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { AzureCognitiveSearchService, MemoryDocument, GDPRDeletionResult } from '../../../lib/ai/azure/azure-cognitive-search.service';

// Mock Azure SDK
vi.mock('@azure/search-documents', () => ({
  SearchClient: vi.fn(),
  SearchIndexClient: vi.fn(),
  AzureKeyCredential: vi.fn()
}));

vi.mock('@azure/identity', () => ({
  DefaultAzureCredential: vi.fn()
}));

// Mock embedding service
vi.mock('../../../lib/ai/azure/azure-embedding.service', () => ({
  AzureEmbeddingService: class {
    async generateEmbedding(text: string): Promise<number[]> {
      return new Array(1536).fill(0.1);
    }
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
      return texts.map(() => new Array(1536).fill(0.1));
    }
  }
}));

describe('Azure Cognitive Search - GDPR Deletion Property Tests', () => {
  let service: AzureCognitiveSearchService;
  let mockSearchClient: any;
  let mockIndexClient: any;

  // Increase timeout for property-based tests (they run 100 iterations with 2s delays)
  const PROPERTY_TEST_TIMEOUT = 300000; // 5 minutes

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock search client
    mockSearchClient = {
      uploadDocuments: vi.fn().mockResolvedValue({
        results: [{ succeeded: true }]
      }),
      deleteDocuments: vi.fn().mockResolvedValue({
        results: [{ succeeded: true }]
      }),
      search: vi.fn()
    };

    // Create mock index client
    mockIndexClient = {};

    // Create service instance
    service = new AzureCognitiveSearchService();
    
    // Replace the internal clients with mocks
    (service as any).searchClient = mockSearchClient;
    (service as any).indexClient = mockIndexClient;
  });

  /**
   * Property 9: GDPR data deletion completeness
   * 
   * For any fan with stored memories, deleting their data should:
   * 1. Remove all documents from the index
   * 2. Verify complete deletion
   * 3. Create audit logs
   * 4. Return confirmation with details
   */
  describe('Property 9: GDPR data deletion completeness', () => {
    it('should delete all memories and verify completeness for any fan', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // fanId
          fc.uuid(), // creatorId
          fc.integer({ min: 1, max: 50 }), // number of memories
          async (fanId, creatorId, memoryCount) => {
            // Setup: Create mock memories
            const mockMemories = Array.from({ length: memoryCount }, (_, i) => ({
              id: `memory-${i}`,
              fanId,
              creatorId,
              content: `Test memory ${i}`,
              sender: 'fan' as const,
              sentiment: 'positive',
              topics: ['test'],
              timestamp: new Date(),
              metadata: {}
            }));

            // Mock search to return all memories initially
            mockSearchClient.search.mockImplementation((query: string, options: any) => {
              if (options.select?.includes('id')) {
                // Finding documents to delete
                return {
                  results: (async function* () {
                    for (const memory of mockMemories) {
                      yield { document: { id: memory.id } };
                    }
                  })()
                };
              } else if (options.includeTotalCount) {
                // Verification check - should return 0 after deletion
                return {
                  count: 0,
                  results: (async function* () {})()
                };
              }
              return {
                results: (async function* () {})()
              };
            });

            // Execute deletion
            const result = await service.deleteMemoriesGDPR(fanId, creatorId);

            // Verify result structure
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.deletedCount).toBe(memoryCount);
            expect(result.verifiedComplete).toBe(true);
            expect(result.auditLogId).toBeDefined();
            expect(result.timestamp).toBeInstanceOf(Date);
            expect(result.fanId).toBe(fanId);
            expect(result.creatorId).toBe(creatorId);

            // Verify deleteDocuments was called
            expect(mockSearchClient.deleteDocuments).toHaveBeenCalled();

            // Verify search was called for verification
            const searchCalls = mockSearchClient.search.mock.calls;
            const verificationCall = searchCalls.find((call: any) => 
              call[1]?.includeTotalCount === true
            );
            expect(verificationCall).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty memory sets gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // fanId
          fc.uuid(), // creatorId
          async (fanId, creatorId) => {
            // Mock search to return no memories
            mockSearchClient.search.mockImplementation(() => ({
              results: (async function* () {})(),
              count: 0
            }));

            // Execute deletion
            const result = await service.deleteMemoriesGDPR(fanId, creatorId);

            // Verify result
            expect(result.success).toBe(true);
            expect(result.deletedCount).toBe(0);
            expect(result.verifiedComplete).toBe(true);
            expect(result.auditLogId).toBeDefined();

            // Verify deleteDocuments was NOT called (no documents to delete)
            expect(mockSearchClient.deleteDocuments).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create audit logs for all deletion operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // fanId
          fc.uuid(), // creatorId
          fc.integer({ min: 0, max: 20 }), // number of memories
          async (fanId, creatorId, memoryCount) => {
            // Spy on console.log to capture audit logs
            const consoleSpy = vi.spyOn(console, 'log');

            // Setup mock memories
            const mockMemories = Array.from({ length: memoryCount }, (_, i) => ({
              id: `memory-${i}`
            }));

            mockSearchClient.search.mockImplementation((query: string, options: any) => {
              if (options.select?.includes('id')) {
                return {
                  results: (async function* () {
                    for (const memory of mockMemories) {
                      yield { document: memory };
                    }
                  })()
                };
              }
              return {
                count: 0,
                results: (async function* () {})()
              };
            });

            // Execute deletion
            await service.deleteMemoriesGDPR(fanId, creatorId);

            // Verify audit logs were created
            const auditLogs = consoleSpy.mock.calls.filter(call => 
              call[0] === '[AzureCognitiveSearch] AUDIT LOG'
            );

            // Should have at least 2 audit logs:
            // 1. GDPR_DELETION_INITIATED
            // 2. GDPR_DELETION_NO_DATA or GDPR_DELETION_DOCUMENTS_FOUND
            // 3. GDPR_DELETION_COMPLETED (if documents found)
            expect(auditLogs.length).toBeGreaterThanOrEqual(2);

            // Verify audit log structure
            auditLogs.forEach(log => {
              const logData = log[1];
              expect(logData.auditLogId).toBeDefined();
              expect(logData.event).toBeDefined();
              expect(logData.fanId).toBe(fanId);
              expect(logData.creatorId).toBe(creatorId);
              expect(logData.immutable).toBe(true);
              expect(logData.retentionDays).toBe(90);
            });

            consoleSpy.mockRestore();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should batch delete large numbers of memories efficiently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // fanId
          fc.uuid(), // creatorId
          fc.integer({ min: 100, max: 500 }), // large number of memories
          async (fanId, creatorId, memoryCount) => {
            // Reset mocks for each property test run
            mockSearchClient.deleteDocuments.mockClear();
            
            // Setup mock memories
            const mockMemories = Array.from({ length: memoryCount }, (_, i) => ({
              id: `memory-${i}`
            }));

            mockSearchClient.search.mockImplementation((query: string, options: any) => {
              if (options.select?.includes('id')) {
                return {
                  results: (async function* () {
                    for (const memory of mockMemories) {
                      yield { document: memory };
                    }
                  })()
                };
              }
              return {
                count: 0,
                results: (async function* () {})()
              };
            });

            // Execute deletion
            const result = await service.deleteMemoriesGDPR(fanId, creatorId);

            // Verify result
            expect(result.success).toBe(true);
            expect(result.deletedCount).toBe(memoryCount);

            // Verify batching (Azure limit is 100 per batch)
            const deleteCallCount = mockSearchClient.deleteDocuments.mock.calls.length;
            const expectedBatches = Math.ceil(memoryCount / 100);
            expect(deleteCallCount).toBe(expectedBatches);

            // Verify each batch has at most 100 documents
            mockSearchClient.deleteDocuments.mock.calls.forEach((call: any) => {
              const batch = call[1];
              expect(batch.length).toBeLessThanOrEqual(100);
            });
          }
        ),
        { numRuns: 50 } // Fewer runs for large data tests
      );
    });

    it('should verify deletion completeness after operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // fanId
          fc.uuid(), // creatorId
          fc.integer({ min: 1, max: 30 }), // number of memories
          async (fanId, creatorId, memoryCount) => {
            let deletionExecuted = false;

            // Setup mock memories
            const mockMemories = Array.from({ length: memoryCount }, (_, i) => ({
              id: `memory-${i}`
            }));

            mockSearchClient.search.mockImplementation((query: string, options: any) => {
              if (options.select?.includes('id')) {
                // Finding documents to delete
                return {
                  results: (async function* () {
                    for (const memory of mockMemories) {
                      yield { document: memory };
                    }
                  })()
                };
              } else if (options.includeTotalCount) {
                // Verification check
                // Return 0 if deletion was executed, otherwise return count
                return {
                  count: deletionExecuted ? 0 : memoryCount,
                  results: (async function* () {})()
                };
              }
              return {
                results: (async function* () {})()
              };
            });

            mockSearchClient.deleteDocuments.mockImplementation(() => {
              deletionExecuted = true;
              return Promise.resolve({ results: [{ succeeded: true }] });
            });

            // Execute deletion
            const result = await service.deleteMemoriesGDPR(fanId, creatorId);

            // Verify deletion was verified
            expect(result.verifiedComplete).toBe(true);

            // Verify search was called for verification
            const searchCalls = mockSearchClient.search.mock.calls;
            const verificationCall = searchCalls.find((call: any) => 
              call[1]?.includeTotalCount === true
            );
            expect(verificationCall).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all required fields in deletion result', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // fanId
          fc.uuid(), // creatorId
          async (fanId, creatorId) => {
            // Mock empty result
            mockSearchClient.search.mockImplementation(() => ({
              results: (async function* () {})(),
              count: 0
            }));

            // Execute deletion
            const result = await service.deleteMemoriesGDPR(fanId, creatorId);

            // Verify all required fields are present
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('deletedCount');
            expect(result).toHaveProperty('verifiedComplete');
            expect(result).toHaveProperty('auditLogId');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('fanId');
            expect(result).toHaveProperty('creatorId');

            // Verify field types
            expect(typeof result.success).toBe('boolean');
            expect(typeof result.deletedCount).toBe('number');
            expect(typeof result.verifiedComplete).toBe('boolean');
            expect(typeof result.auditLogId).toBe('string');
            expect(result.timestamp).toBeInstanceOf(Date);
            expect(typeof result.fanId).toBe('string');
            expect(typeof result.creatorId).toBe('string');

            // Verify field values
            expect(result.fanId).toBe(fanId);
            expect(result.creatorId).toBe(creatorId);
            expect(result.auditLogId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle concurrent deletion requests safely', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // fanId
          fc.uuid(), // creatorId
          fc.integer({ min: 2, max: 5 }), // number of concurrent requests
          async (fanId, creatorId, concurrentRequests) => {
            // Setup mock memories
            const mockMemories = Array.from({ length: 10 }, (_, i) => ({
              id: `memory-${i}`
            }));

            mockSearchClient.search.mockImplementation((query: string, options: any) => {
              if (options.select?.includes('id')) {
                return {
                  results: (async function* () {
                    for (const memory of mockMemories) {
                      yield { document: memory };
                    }
                  })()
                };
              }
              return {
                count: 0,
                results: (async function* () {})()
              };
            });

            // Execute concurrent deletions
            const deletionPromises = Array.from(
              { length: concurrentRequests },
              () => service.deleteMemoriesGDPR(fanId, creatorId)
            );

            const results = await Promise.all(deletionPromises);

            // Verify all requests completed successfully
            results.forEach(result => {
              expect(result.success).toBe(true);
              expect(result.fanId).toBe(fanId);
              expect(result.creatorId).toBe(creatorId);
            });

            // Verify each request has unique audit log ID
            const auditLogIds = results.map(r => r.auditLogId);
            const uniqueAuditLogIds = new Set(auditLogIds);
            expect(uniqueAuditLogIds.size).toBe(concurrentRequests);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
