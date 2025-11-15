/**
 * OnlyFans AI Memory System - Memory Repository
 * 
 * Repository implementing CRUD operations for fan memories with
 * cache-first strategy and transaction support.
 */

import { memoryDb } from '../db/connection';
import { memoryCache } from '../cache/redis-cache';
import type { IMemoryRepository } from '../interfaces';
import type {
  FanMemoryRecord,
  FanPreferencesRecord,
  PersonalityProfileRecord,
  EngagementMetricsRecord,
  EmotionalStateRecord,
  ConversationMessage,
  MemoryError,
  MemoryErrorType
} from '../types';

/**
 * Memory repository implementation
 */
export class MemoryRepository implements IMemoryRepository {
  /**
   * Save a fan memory (message)
   */
  async saveFanMemory(
    memory: Omit<FanMemoryRecord, 'id' | 'created_at'>
  ): Promise<FanMemoryRecord> {
    try {
      const result = await memoryDb.query<FanMemoryRecord>(
        `INSERT INTO fan_memories (
          fan_id, creator_id, message_content, sender, 
          sentiment, topics, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          memory.fan_id,
          memory.creator_id,
          memory.message_content,
          memory.sender,
          memory.sentiment,
          memory.topics,
          memory.metadata
        ]
      );

      const savedMemory = result.rows[0];

      // Invalidate messages cache
      await memoryCache.invalidate(
        memoryCache.generateKey(memory.fan_id, memory.creator_id, 'messages')
      );

      return savedMemory;
    } catch (error) {
      throw this.handleError(error, 'saveFanMemory');
    }
  }

  /**
   * Get all memories for a fan
   */
  async getFanMemory(
    fanId: string,
    creatorId: string
  ): Promise<FanMemoryRecord[]> {
    try {
      const result = await memoryDb.query<FanMemoryRecord>(
        `SELECT * FROM fan_memories
         WHERE fan_id = $1 AND creator_id = $2
         ORDER BY created_at DESC`,
        [fanId, creatorId]
      );

      return result.rows;
    } catch (error) {
      throw this.handleError(error, 'getFanMemory');
    }
  }

  /**
   * Get recent messages with cache-first strategy
   */
  async getRecentMessages(
    fanId: string,
    creatorId: string,
    limit: number = 50
  ): Promise<ConversationMessage[]> {
    try {
      // Try cache first
      const cached = await memoryCache.getMessages(fanId, creatorId);
      if (cached && cached.length > 0) {
        return cached.slice(0, limit);
      }

      // Fetch from database
      const result = await memoryDb.query<FanMemoryRecord>(
        `SELECT * FROM fan_memories
         WHERE fan_id = $1 AND creator_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [fanId, creatorId, limit]
      );

      // Transform to ConversationMessage format
      const messages: ConversationMessage[] = result.rows.map(row => ({
        id: row.id,
        content: row.message_content,
        sender: row.sender,
        timestamp: new Date(row.created_at),
        sentiment: row.sentiment || 'neutral',
        topics: row.topics || [],
        metadata: row.metadata || {}
      }));

      // Cache the results
      if (messages.length > 0) {
        await memoryCache.setMessages(
          fanId,
          creatorId,
          messages,
          3600 // 1 hour TTL
        );
      }

      return messages;
    } catch (error) {
      throw this.handleError(error, 'getRecentMessages');
    }
  }

  /**
   * Save or update fan preferences
   */
  async savePreferences(
    preferences: Omit<FanPreferencesRecord, 'id'>
  ): Promise<FanPreferencesRecord> {
    try {
      const result = await memoryDb.query<FanPreferencesRecord>(
        `INSERT INTO fan_preferences (
          fan_id, creator_id, content_preferences, topic_interests,
          purchase_patterns, communication_preferences, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (fan_id, creator_id) 
        DO UPDATE SET
          content_preferences = EXCLUDED.content_preferences,
          topic_interests = EXCLUDED.topic_interests,
          purchase_patterns = EXCLUDED.purchase_patterns,
          communication_preferences = EXCLUDED.communication_preferences,
          last_updated = EXCLUDED.last_updated
        RETURNING *`,
        [
          preferences.fan_id,
          preferences.creator_id,
          preferences.content_preferences,
          preferences.topic_interests,
          preferences.purchase_patterns,
          preferences.communication_preferences,
          preferences.last_updated
        ]
      );

      const savedPreferences = result.rows[0];

      // Invalidate cache
      await memoryCache.invalidate(
        memoryCache.generateKey(preferences.fan_id, preferences.creator_id, 'preferences')
      );

      return savedPreferences;
    } catch (error) {
      throw this.handleError(error, 'savePreferences');
    }
  }

  /**
   * Get fan preferences with cache-first strategy
   */
  async getPreferences(
    fanId: string,
    creatorId: string
  ): Promise<FanPreferencesRecord | null> {
    try {
      // Try cache first
      const cached = await memoryCache.getPreferences(fanId, creatorId);
      if (cached) {
        // Convert back to database format
        return {
          id: '', // Will be filled from DB if needed
          fan_id: fanId,
          creator_id: creatorId,
          content_preferences: cached.contentPreferences,
          topic_interests: cached.topicInterests,
          purchase_patterns: cached.purchasePatterns,
          communication_preferences: cached.communicationPreferences,
          last_updated: cached.lastUpdated
        };
      }

      // Fetch from database
      const result = await memoryDb.query<FanPreferencesRecord>(
        `SELECT * FROM fan_preferences
         WHERE fan_id = $1 AND creator_id = $2`,
        [fanId, creatorId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const preferences = result.rows[0];

      // Cache the result
      await memoryCache.setPreferences(
        fanId,
        creatorId,
        {
          fanId,
          contentPreferences: preferences.content_preferences,
          topicInterests: preferences.topic_interests,
          purchasePatterns: preferences.purchase_patterns,
          communicationPreferences: preferences.communication_preferences as any,
          lastUpdated: new Date(preferences.last_updated)
        },
        7200 // 2 hours TTL
      );

      return preferences;
    } catch (error) {
      throw this.handleError(error, 'getPreferences');
    }
  }

  /**
   * Save or update personality profile
   */
  async savePersonalityProfile(
    profile: Omit<PersonalityProfileRecord, 'id'>
  ): Promise<PersonalityProfileRecord> {
    try {
      const result = await memoryDb.query<PersonalityProfileRecord>(
        `INSERT INTO personality_profiles (
          fan_id, creator_id, tone, emoji_frequency, message_length_preference,
          punctuation_style, preferred_emojis, response_speed, confidence_score,
          interaction_count, last_calibrated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (fan_id, creator_id)
        DO UPDATE SET
          tone = EXCLUDED.tone,
          emoji_frequency = EXCLUDED.emoji_frequency,
          message_length_preference = EXCLUDED.message_length_preference,
          punctuation_style = EXCLUDED.punctuation_style,
          preferred_emojis = EXCLUDED.preferred_emojis,
          response_speed = EXCLUDED.response_speed,
          confidence_score = EXCLUDED.confidence_score,
          interaction_count = EXCLUDED.interaction_count,
          last_calibrated = EXCLUDED.last_calibrated
        RETURNING *`,
        [
          profile.fan_id,
          profile.creator_id,
          profile.tone,
          profile.emoji_frequency,
          profile.message_length_preference,
          profile.punctuation_style,
          profile.preferred_emojis,
          profile.response_speed,
          profile.confidence_score,
          profile.interaction_count,
          profile.last_calibrated
        ]
      );

      const savedProfile = result.rows[0];

      // Invalidate cache
      await memoryCache.invalidate(
        memoryCache.generateKey(profile.fan_id, profile.creator_id, 'personality')
      );

      return savedProfile;
    } catch (error) {
      throw this.handleError(error, 'savePersonalityProfile');
    }
  }

  /**
   * Get personality profile with cache-first strategy
   */
  async getPersonalityProfile(
    fanId: string,
    creatorId: string
  ): Promise<PersonalityProfileRecord | null> {
    try {
      // Try cache first
      const cached = await memoryCache.getPersonalityProfile(fanId, creatorId);
      if (cached) {
        return {
          id: '',
          fan_id: fanId,
          creator_id: creatorId,
          tone: cached.tone,
          emoji_frequency: cached.emojiFrequency,
          message_length_preference: cached.messageLengthPreference,
          punctuation_style: cached.punctuationStyle,
          preferred_emojis: cached.preferredEmojis,
          response_speed: cached.responseSpeed,
          confidence_score: cached.confidenceScore,
          interaction_count: cached.interactionCount,
          last_calibrated: cached.lastCalibrated
        };
      }

      // Fetch from database
      const result = await memoryDb.query<PersonalityProfileRecord>(
        `SELECT * FROM personality_profiles
         WHERE fan_id = $1 AND creator_id = $2`,
        [fanId, creatorId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const profile = result.rows[0];

      // Cache the result
      await memoryCache.setPersonalityProfile(
        fanId,
        creatorId,
        {
          fanId,
          tone: profile.tone as any,
          emojiFrequency: Number(profile.emoji_frequency),
          messageLengthPreference: profile.message_length_preference as any,
          punctuationStyle: profile.punctuation_style as any,
          preferredEmojis: profile.preferred_emojis,
          responseSpeed: profile.response_speed as any,
          confidenceScore: Number(profile.confidence_score),
          lastCalibrated: new Date(profile.last_calibrated),
          interactionCount: profile.interaction_count
        },
        7200 // 2 hours TTL
      );

      return profile;
    } catch (error) {
      throw this.handleError(error, 'getPersonalityProfile');
    }
  }

  /**
   * Save or update engagement metrics
   */
  async saveEngagementMetrics(
    metrics: Omit<EngagementMetricsRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<EngagementMetricsRecord> {
    try {
      const result = await memoryDb.query<EngagementMetricsRecord>(
        `INSERT INTO engagement_metrics (
          fan_id, creator_id, engagement_score, total_messages,
          total_purchases, total_revenue, avg_response_time_seconds,
          last_interaction
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (fan_id, creator_id)
        DO UPDATE SET
          engagement_score = EXCLUDED.engagement_score,
          total_messages = EXCLUDED.total_messages,
          total_purchases = EXCLUDED.total_purchases,
          total_revenue = EXCLUDED.total_revenue,
          avg_response_time_seconds = EXCLUDED.avg_response_time_seconds,
          last_interaction = EXCLUDED.last_interaction,
          updated_at = NOW()
        RETURNING *`,
        [
          metrics.fan_id,
          metrics.creator_id,
          metrics.engagement_score,
          metrics.total_messages,
          metrics.total_purchases,
          metrics.total_revenue,
          metrics.avg_response_time_seconds,
          metrics.last_interaction
        ]
      );

      const savedMetrics = result.rows[0];

      // Invalidate cache
      await memoryCache.invalidate(
        memoryCache.generateKey(metrics.fan_id, metrics.creator_id, 'engagement')
      );

      return savedMetrics;
    } catch (error) {
      throw this.handleError(error, 'saveEngagementMetrics');
    }
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(
    fanId: string,
    creatorId: string
  ): Promise<EngagementMetricsRecord | null> {
    try {
      const result = await memoryDb.query<EngagementMetricsRecord>(
        `SELECT * FROM engagement_metrics
         WHERE fan_id = $1 AND creator_id = $2`,
        [fanId, creatorId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw this.handleError(error, 'getEngagementMetrics');
    }
  }

  /**
   * Update engagement metrics
   */
  async updateEngagementMetrics(
    fanId: string,
    creatorId: string,
    updates: Partial<EngagementMetricsRecord>
  ): Promise<EngagementMetricsRecord> {
    try {
      // Build dynamic UPDATE query
      const setClause: string[] = [];
      const values: any[] = [fanId, creatorId];
      let paramIndex = 3;

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'fan_id' && key !== 'creator_id' && key !== 'created_at') {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      const result = await memoryDb.query<EngagementMetricsRecord>(
        `UPDATE engagement_metrics
         SET ${setClause.join(', ')}, updated_at = NOW()
         WHERE fan_id = $1 AND creator_id = $2
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Engagement metrics not found');
      }

      // Invalidate cache
      await memoryCache.invalidate(
        memoryCache.generateKey(fanId, creatorId, 'engagement')
      );

      return result.rows[0];
    } catch (error) {
      throw this.handleError(error, 'updateEngagementMetrics');
    }
  }

  /**
   * Save or update emotional state
   */
  async saveEmotionalState(
    state: Omit<EmotionalStateRecord, 'id' | 'updated_at'>
  ): Promise<EmotionalStateRecord> {
    try {
      const result = await memoryDb.query<EmotionalStateRecord>(
        `INSERT INTO emotional_states (
          fan_id, creator_id, current_sentiment, sentiment_history,
          dominant_emotions, engagement_level, last_positive_interaction,
          last_negative_interaction
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (fan_id, creator_id)
        DO UPDATE SET
          current_sentiment = EXCLUDED.current_sentiment,
          sentiment_history = EXCLUDED.sentiment_history,
          dominant_emotions = EXCLUDED.dominant_emotions,
          engagement_level = EXCLUDED.engagement_level,
          last_positive_interaction = EXCLUDED.last_positive_interaction,
          last_negative_interaction = EXCLUDED.last_negative_interaction,
          updated_at = NOW()
        RETURNING *`,
        [
          state.fan_id,
          state.creator_id,
          state.current_sentiment,
          state.sentiment_history,
          state.dominant_emotions,
          state.engagement_level,
          state.last_positive_interaction,
          state.last_negative_interaction
        ]
      );

      const savedState = result.rows[0];

      // Invalidate cache
      await memoryCache.invalidate(
        memoryCache.generateKey(state.fan_id, state.creator_id, 'emotion')
      );

      return savedState;
    } catch (error) {
      throw this.handleError(error, 'saveEmotionalState');
    }
  }

  /**
   * Get emotional state
   */
  async getEmotionalState(
    fanId: string,
    creatorId: string
  ): Promise<EmotionalStateRecord | null> {
    try {
      const result = await memoryDb.query<EmotionalStateRecord>(
        `SELECT * FROM emotional_states
         WHERE fan_id = $1 AND creator_id = $2`,
        [fanId, creatorId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw this.handleError(error, 'getEmotionalState');
    }
  }

  /**
   * Bulk get memories for multiple fans
   */
  async bulkGetMemories(
    fanIds: string[],
    creatorId: string
  ): Promise<Map<string, FanMemoryRecord[]>> {
    try {
      if (fanIds.length === 0) {
        return new Map();
      }

      const result = await memoryDb.query<FanMemoryRecord>(
        `SELECT * FROM fan_memories
         WHERE fan_id = ANY($1) AND creator_id = $2
         ORDER BY created_at DESC`,
        [fanIds, creatorId]
      );

      // Group by fan_id
      const memoriesMap = new Map<string, FanMemoryRecord[]>();
      result.rows.forEach(row => {
        const existing = memoriesMap.get(row.fan_id) || [];
        existing.push(row);
        memoriesMap.set(row.fan_id, existing);
      });

      return memoriesMap;
    } catch (error) {
      throw this.handleError(error, 'bulkGetMemories');
    }
  }

  /**
   * Delete all memory for a fan (GDPR compliance)
   */
  async deleteMemory(fanId: string, creatorId: string): Promise<void> {
    try {
      await memoryDb.transaction(async (client) => {
        // Delete from all tables
        await client.query(
          'DELETE FROM fan_memories WHERE fan_id = $1 AND creator_id = $2',
          [fanId, creatorId]
        );
        await client.query(
          'DELETE FROM fan_preferences WHERE fan_id = $1 AND creator_id = $2',
          [fanId, creatorId]
        );
        await client.query(
          'DELETE FROM personality_profiles WHERE fan_id = $1 AND creator_id = $2',
          [fanId, creatorId]
        );
        await client.query(
          'DELETE FROM engagement_metrics WHERE fan_id = $1 AND creator_id = $2',
          [fanId, creatorId]
        );
        await client.query(
          'DELETE FROM emotional_states WHERE fan_id = $1 AND creator_id = $2',
          [fanId, creatorId]
        );
      });

      // Invalidate all cache
      await memoryCache.invalidateFanCache(fanId, creatorId);

      console.log(`[MemoryRepository] Deleted all memory for fan ${fanId}`);
    } catch (error) {
      throw this.handleError(error, 'deleteMemory');
    }
  }

  /**
   * Cleanup old memories (GDPR - 24 month retention)
   */
  async cleanupOldMemories(olderThan: Date): Promise<number> {
    try {
      const result = await memoryDb.query(
        `DELETE FROM fan_memories 
         WHERE created_at < $1
         RETURNING id`,
        [olderThan]
      );

      const deletedCount = result.rows.length;
      console.log(`[MemoryRepository] Cleaned up ${deletedCount} old memories`);

      return deletedCount;
    } catch (error) {
      throw this.handleError(error, 'cleanupOldMemories');
    }
  }

  /**
   * Export all fan data (GDPR compliance)
   */
  async exportFanData(fanId: string, creatorId: string): Promise<{
    memories: FanMemoryRecord[];
    preferences: FanPreferencesRecord | null;
    personality: PersonalityProfileRecord | null;
    metrics: EngagementMetricsRecord | null;
    emotional: EmotionalStateRecord | null;
  }> {
    try {
      const [memories, preferences, personality, metrics, emotional] = await Promise.all([
        this.getFanMemory(fanId, creatorId),
        this.getPreferences(fanId, creatorId),
        this.getPersonalityProfile(fanId, creatorId),
        this.getEngagementMetrics(fanId, creatorId),
        this.getEmotionalState(fanId, creatorId)
      ]);

      return {
        memories,
        preferences,
        personality,
        metrics,
        emotional
      };
    } catch (error) {
      throw this.handleError(error, 'exportFanData');
    }
  }

  /**
   * Handle errors and convert to MemoryError
   */
  private handleError(error: any, operation: string): never {
    console.error(`[MemoryRepository] Error in ${operation}:`, error);
    
    const memoryError: any = {
      type: 'DATABASE_ERROR' as const,
      message: `Database operation failed in ${operation}: ${error.message}`,
      recoverable: true,
      context: { operation, originalError: error.message }
    };

    throw memoryError;
  }
}

// Create singleton instance
let repositoryInstance: MemoryRepository | null = null;

/**
 * Get or create the memory repository instance
 */
export function getMemoryRepository(): MemoryRepository {
  if (!repositoryInstance) {
    repositoryInstance = new MemoryRepository();
  }
  return repositoryInstance;
}

// Export default instance
export const memoryRepository = getMemoryRepository();
