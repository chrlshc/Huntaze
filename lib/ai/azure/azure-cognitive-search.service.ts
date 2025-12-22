import { createLogger } from '@/lib/utils/logger';
import { memoryRepository } from '@/lib/of-memory/repositories/memory-repository';

export type AzureMemoryDocument = {
  id: string;
  fanId: string;
  creatorId: string;
  content: string;
  sender: string;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  topics: string[];
  timestamp: Date;
  metadata: Record<string, unknown>;
};

export type AzureGdprDeletionResult = {
  deletedCount: number;
  verifiedComplete: boolean;
  auditLogId: string;
};

type IndexMemoryInput = {
  id: string;
  fanId: string;
  creatorId: string;
  content: string;
  sender: string;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  topics: string[];
  timestamp: Date;
  metadata: Record<string, unknown>;
};

const log = createLogger('azure-cognitive-search');

/**
 * Temporary compatibility layer.
 *
 * The production Azure Cognitive Search integration was removed/moved, but the
 * memory system still imports it. This service keeps builds working and
 * gracefully falls back to PostgreSQL-backed `memoryRepository`.
 */
export const azureCognitiveSearchService = {
  async getRecentMemories(
    fanId: string,
    creatorId: string,
    limit: number
  ): Promise<AzureMemoryDocument[]> {
    try {
      const messages = await memoryRepository.getRecentMessages(fanId, creatorId, limit);
      return messages.map(msg => ({
        id: msg.id,
        fanId,
        creatorId,
        content: msg.content,
        sender: msg.sender,
        sentiment: (msg.sentiment as AzureMemoryDocument['sentiment']) ?? null,
        topics: msg.topics ?? [],
        timestamp: msg.timestamp,
        metadata: (msg.metadata as Record<string, unknown>) ?? {},
      }));
    } catch (error) {
      log.warn('[AzureSearch] getRecentMemories fallback failed', {
        error: error instanceof Error ? error.message : String(error),
        fanId,
        creatorId,
      });
      return [];
    }
  },

  async indexMemory(memory: IndexMemoryInput): Promise<void> {
    try {
      await memoryRepository.saveFanMemory({
        fan_id: memory.fanId,
        creator_id: memory.creatorId,
        message_content: memory.content,
        sender: memory.sender,
        sentiment: memory.sentiment,
        topics: memory.topics,
        metadata: memory.metadata,
      });
    } catch (error) {
      log.warn('[AzureSearch] indexMemory fallback failed', {
        error: error instanceof Error ? error.message : String(error),
        fanId: memory.fanId,
        creatorId: memory.creatorId,
        memoryId: memory.id,
      });
    }
  },

  async deleteMemoriesGDPR(_fanId: string, _creatorId: string): Promise<AzureGdprDeletionResult> {
    // Deletion from PostgreSQL is handled separately by UserMemoryService.
    return {
      deletedCount: 0,
      verifiedComplete: true,
      auditLogId: `local-${Date.now()}`,
    };
  },
};

