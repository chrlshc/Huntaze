/**
 * Backward Compatibility Wrapper for OnlyFans AI Assistant
 * Allows gradual migration from old to new memory-enhanced system
 */

import { logger } from '../utils/logger';
import {
  MessageContext,
  MessageSuggestion,
  onlyFansAISuggestions
} from './onlyfans-ai-suggestions.service';
import {
  EnhancedMessageContext,
  onlyFansAIAssistantEnhanced
} from './onlyfans-ai-assistant-enhanced';

export interface AIAssistantConfig {
  useMemory: boolean;
  fallbackToBasic: boolean;
}

class OnlyFansAIAssistantWrapper {
  private config: AIAssistantConfig;

  constructor(config: AIAssistantConfig = { useMemory: true, fallbackToBasic: true }) {
    this.config = config;
  }

  /**
   * Generate suggestions with automatic fallback
   * This method maintains backward compatibility while adding memory features
   */
  async generateSuggestions(
    context: MessageContext & { creatorId?: string; fanId?: string }
  ): Promise<MessageSuggestion[]> {
    // Check if we have the required IDs for memory-enhanced mode
    const hasMemoryIds = context.creatorId && context.fanId;

    if (this.config.useMemory && hasMemoryIds) {
      try {
        logger.info('Using memory-enhanced AI assistant', {
          fanId: context.fanId,
          creatorId: context.creatorId
        });

        const enhancedContext: EnhancedMessageContext = {
          ...context,
          creatorId: context.creatorId!,
          fanId: context.fanId!
        };

        return await onlyFansAIAssistantEnhanced.generateResponse(enhancedContext);

      } catch (error) {
        logger.error('Memory-enhanced AI failed, falling back to basic', { error });

        if (this.config.fallbackToBasic) {
          return await onlyFansAISuggestions.generateSuggestions(context);
        }

        throw error;
      }
    }

    // Use basic AI without memory
    logger.info('Using basic AI assistant (no memory)', {
      reason: hasMemoryIds ? 'memory disabled' : 'missing IDs'
    });

    return await onlyFansAISuggestions.generateSuggestions(context);
  }

  /**
   * Get engagement score (only available with memory)
   */
  async getEngagementScore(fanId: string, creatorId: string): Promise<number | null> {
    if (!this.config.useMemory) {
      return null;
    }

    try {
      return await onlyFansAIAssistantEnhanced.getEngagementScore(fanId, creatorId);
    } catch (error) {
      logger.error('Failed to get engagement score', { error });
      return null;
    }
  }

  /**
   * Clear fan memory (GDPR compliance)
   */
  async clearFanMemory(fanId: string, creatorId: string): Promise<void> {
    if (!this.config.useMemory) {
      logger.warn('Memory not enabled, nothing to clear');
      return;
    }

    await onlyFansAIAssistantEnhanced.clearFanMemory(fanId, creatorId);
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(creatorId: string) {
    if (!this.config.useMemory) {
      return null;
    }

    return await onlyFansAIAssistantEnhanced.getMemoryStats(creatorId);
  }

  /**
   * Enable or disable memory features
   */
  setMemoryEnabled(enabled: boolean): void {
    this.config.useMemory = enabled;
    logger.info('Memory features ' + (enabled ? 'enabled' : 'disabled'));
  }

  /**
   * Check if memory is enabled
   */
  isMemoryEnabled(): boolean {
    return this.config.useMemory;
  }
}

// Export singleton with memory enabled by default
export const onlyFansAIAssistant = new OnlyFansAIAssistantWrapper({
  useMemory: process.env.ONLYFANS_AI_MEMORY_ENABLED !== 'false',
  fallbackToBasic: true
});

// Export for testing with custom config
export { OnlyFansAIAssistantWrapper };
