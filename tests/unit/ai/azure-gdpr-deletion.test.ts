/**
 * Unit Tests for Azure Cognitive Search GDPR Deletion
 * 
 * Tests specific scenarios and edge cases for GDPR-compliant data deletion.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AzureCognitiveSearchService } from '../../../lib/ai/azure/azure-cognitive-search.service';

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

describe('Azure Cognitive Search - GDPR Deletion Unit Tests', () => {
  let service: AzureCognitiveSearchService;
  let mockSearchClient: any;
  let mockIndexClient: any;

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

  describe('deleteMemoriesGDPR', () => {
    it('should successfully delete memories and return complete result', async () => {
      const fanId = 'fan-123';
      const creatorId = 'creator-456';

      // Mock search to return 3 memories
      mockSearchClient.search.mockImplementation((query: string, options: any) => {
        if (options.select?.includes('id')) {
          return {
            results: (async function* () {
              yield { document: { id: 'memory-1' } };
              yield { document: { id: 'memory-2' } };
              yield { document: { id: 'memory-3' } };
            })()
          };
        }
        return {
          count: 0,
          results: (async function* () {})()
        };
      });

      const result = await service.deleteMemoriesGDPR(fanId, creatorId);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);
      expect(result.verifiedComplete).toBe(true);
      expect(result.fanId).toBe(fanId);
      expect(result.creatorId).toBe(creatorId);
      expect(result.auditLogId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle no memories to delete', async () => {
      const fanId = 'fan-empty';
      const creatorId = 'creator-empty';

      // Mock search to return no memories
      mockSearchClient.search.mockImplementation(() => ({
        results: (async function* () {})(),
        count: 0
      }));

      const result = await service.deleteMemoriesGDPR(fanId, creatorId);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
      expect(result.verifiedComplete).toBe(true);
      expect(mockSearchClient.deleteDocuments).not.toHaveBeenCalled();
    });

    it('should batch delete when memory count exceeds 100', async () => {
      const fanId = 'fan-large';
      const creatorId = 'creator-large';

      // Mock search to return 250 memories
      mockSearchClient.search.mockImplementation((query: string, options: any) => {
        if (options.select?.includes('id')) {
          return {
            results: (async function* () {
              for (let i = 0; i < 250; i++) {
                yield { document: { id: `memory-${i}` } };
              }
            })()
          };
        }
        return {
          count: 0,
          results: (async function* () {})()
        };
      });

      const result = await service.deleteMemoriesGDPR(fanId, creatorId);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(250);

      // Should have called deleteDocuments 3 times (100 + 100 + 50)
      expect(mockSearchClient.deleteDocuments).toHaveBeenCalledTimes(3);
    });

    it('should create audit logs for deletion lifecycle', async () => {
      const fanId = 'fan-audit';
      const creatorId = 'creator-audit';
      const consoleSpy = vi.spyOn(console, 'log');

      // Mock search to return 1 memory
      mockSearchClient.search.mockImplementation((query: string, options: any) => {
        if (options.select?.includes('id')) {
          return {
            results: (async function* () {
              yield { document: { id: 'memory-1' } };
            })()
          };
        }
        return {
          count: 0,
          results: (async function* () {})()
        };
      });

      await service.deleteMemoriesGDPR(fanId, creatorId);

      // Find audit logs
      const auditLogs = consoleSpy.mock.calls.filter(call => 
        call[0] === '[AzureCognitiveSearch] AUDIT LOG'
      );

      // Should have 3 audit logs:
      // 1. GDPR_DELETION_INITIATED
      // 2. GDPR_DELETION_DOCUMENTS_FOUND
      // 3. GDPR_DELETION_COMPLETED
      expect(auditLogs.length).toBe(3);

      const events = auditLogs.map(log => log[1].event);
      expect(events).toContain('GDPR_DELETION_INITIATED');
      expect(events).toContain('GDPR_DELETION_DOCUMENTS_FOUND');
      expect(events).toContain('GDPR_DELETION_COMPLETED');

      consoleSpy.mockRestore();
    });

    it('should verify deletion completeness', async () => {
      const fanId = 'fan-verify';
      const creatorId = 'creator-verify';

      // Mock search to return memories initially, then 0 for verification
      let callCount = 0;
      mockSearchClient.search.mockImplementation((query: string, options: any) => {
        callCount++;
        if (options.select?.includes('id')) {
          return {
            results: (async function* () {
              yield { document: { id: 'memory-1' } };
            })()
          };
        } else if (options.includeTotalCount) {
          // Verification call
          return {
            count: 0,
            results: (async function* () {})()
          };
        }
        return {
          results: (async function* () {})()
        };
      });

      const result = await service.deleteMemoriesGDPR(fanId, creatorId);

      expect(result.verifiedComplete).toBe(true);

      // Verify that search was called for verification
      const verificationCall = mockSearchClient.search.mock.calls.find((call: any) => 
        call[1]?.includeTotalCount === true
      );
      expect(verificationCall).toBeDefined();
    });

    it('should handle deletion errors gracefully', async () => {
      const fanId = 'fan-error';
      const creatorId = 'creator-error';
      const consoleSpy = vi.spyOn(console, 'error');

      // Mock search to return memories
      mockSearchClient.search.mockImplementation((query: string, options: any) => {
        if (options.select?.includes('id')) {
          return {
            results: (async function* () {
              yield { document: { id: 'memory-1' } };
            })()
          };
        }
        return {
          count: 0,
          results: (async function* () {})()
        };
      });

      // Mock deleteDocuments to fail
      mockSearchClient.deleteDocuments.mockRejectedValue(new Error('Azure service unavailable'));

      await expect(service.deleteMemoriesGDPR(fanId, creatorId)).rejects.toThrow('Azure service unavailable');

      // Verify error was logged
      const errorLogs = consoleSpy.mock.calls.filter(call => 
        call[0] === '[AzureCognitiveSearch] GDPR deletion failed'
      );
      expect(errorLogs.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });

    it('should log audit event even when deletion fails', async () => {
      const fanId = 'fan-audit-fail';
      const creatorId = 'creator-audit-fail';
      const consoleSpy = vi.spyOn(console, 'log');

      // Mock search to return memories
      mockSearchClient.search.mockImplementation((query: string, options: any) => {
        if (options.select?.includes('id')) {
          return {
            results: (async function* () {
              yield { document: { id: 'memory-1' } };
            })()
          };
        }
        return {
          count: 0,
          results: (async function* () {})()
        };
      });

      // Mock deleteDocuments to fail
      mockSearchClient.deleteDocuments.mockRejectedValue(new Error('Deletion failed'));

      try {
        await service.deleteMemoriesGDPR(fanId, creatorId);
      } catch (error) {
        // Expected to fail
      }

      // Find audit logs
      const auditLogs = consoleSpy.mock.calls.filter(call => 
        call[0] === '[AzureCognitiveSearch] AUDIT LOG'
      );

      // Should have GDPR_DELETION_FAILED audit log
      const failedLog = auditLogs.find(log => log[1].event === 'GDPR_DELETION_FAILED');
      expect(failedLog).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should include metadata in audit logs', async () => {
      const fanId = 'fan-metadata';
      const creatorId = 'creator-metadata';
      const consoleSpy = vi.spyOn(console, 'log');

      // Mock search to return 5 memories
      mockSearchClient.search.mockImplementation((query: string, options: any) => {
        if (options.select?.includes('id')) {
          return {
            results: (async function* () {
              for (let i = 0; i < 5; i++) {
                yield { document: { id: `memory-${i}` } };
              }
            })()
          };
        }
        return {
          count: 0,
          results: (async function* () {})()
        };
      });

      await service.deleteMemoriesGDPR(fanId, creatorId);

      // Find audit logs
      const auditLogs = consoleSpy.mock.calls.filter(call => 
        call[0] === '[AzureCognitiveSearch] AUDIT LOG'
      );

      // Verify metadata in DOCUMENTS_FOUND log
      const documentsFoundLog = auditLogs.find(log => 
        log[1].event === 'GDPR_DELETION_DOCUMENTS_FOUND'
      );
      expect(documentsFoundLog).toBeDefined();
      expect(documentsFoundLog![1].metadata.documentsFound).toBe(5);

      // Verify metadata in COMPLETED log
      const completedLog = auditLogs.find(log => 
        log[1].event === 'GDPR_DELETION_COMPLETED'
      );
      expect(completedLog).toBeDefined();
      expect(completedLog![1].metadata.deletedCount).toBe(5);
      expect(completedLog![1].metadata.verifiedComplete).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('deleteMemories (legacy)', () => {
    it('should call deleteMemoriesGDPR internally', async () => {
      const fanId = 'fan-legacy';
      const creatorId = 'creator-legacy';

      // Mock search to return no memories
      mockSearchClient.search.mockImplementation(() => ({
        results: (async function* () {})(),
        count: 0
      }));

      // Should not throw
      await expect(service.deleteMemories(fanId, creatorId)).resolves.not.toThrow();
    });

    it('should throw if deletion fails', async () => {
      const fanId = 'fan-legacy-fail';
      const creatorId = 'creator-legacy-fail';

      // Mock search to return memories
      mockSearchClient.search.mockImplementation((query: string, options: any) => {
        if (options.select?.includes('id')) {
          return {
            results: (async function* () {
              yield { document: { id: 'memory-1' } };
            })()
          };
        }
        return {
          count: 0,
          results: (async function* () {})()
        };
      });

      // Mock deleteDocuments to fail
      mockSearchClient.deleteDocuments.mockRejectedValue(new Error('Service error'));

      await expect(service.deleteMemories(fanId, creatorId)).rejects.toThrow();
    });
  });
});
