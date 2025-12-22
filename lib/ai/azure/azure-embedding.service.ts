import { createLogger } from '@/lib/utils/logger';

const log = createLogger('azure-embedding');
let warnedMissingImpl = false;

/**
 * Minimal embedding service shim.
 *
 * Keeps server builds working while Azure embeddings integration is finalized.
 * If called without a real provider configured, returns an empty vector.
 */
export const azureEmbeddingService = {
  async embedText(_text: string): Promise<number[]> {
    if (!warnedMissingImpl) {
      warnedMissingImpl = true;
      log.warn('[AzureEmbedding] No provider configured; returning empty embeddings', {
        hint: 'Implement Azure OpenAI embeddings or disable USE_AZURE_COGNITIVE_SEARCH',
      });
    }
    return [];
  },
};

