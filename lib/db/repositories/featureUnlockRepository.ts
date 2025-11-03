import { query } from '../index';

export interface FeatureUnlockState {
  user_id: string;
  unlocked_features: string[];
  locked_features: string[];
  last_unlock_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UnlockFeatureParams {
  userId: string;
  featureId: string;
}

export interface FeatureUnlockStats {
  totalUnlocked: number;
  totalLocked: number;
  recentUnlocks: Array<{
    featureId: string;
    unlockedAt: Date;
  }>;
}

export const featureUnlockRepository = {
  /**
   * Find feature unlock state by user ID
   */
  async findByUserId(userId: string): Promise<FeatureUnlockState | null> {
    const result = await query(
      `SELECT * FROM feature_unlock_states WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  /**
   * Create initial feature unlock state for a user
   */
  async create(userId: string, initialLockedFeatures: string[]): Promise<FeatureUnlockState> {
    const result = await query(
      `INSERT INTO feature_unlock_states (user_id, unlocked_features, locked_features)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, JSON.stringify([]), JSON.stringify(initialLockedFeatures)]
    );
    return result.rows[0];
  },

  /**
   * Unlock a feature for a user
   */
  async unlockFeature({ userId, featureId }: UnlockFeatureParams): Promise<FeatureUnlockState> {
    const result = await query(
      `UPDATE feature_unlock_states
       SET 
         unlocked_features = unlocked_features || $2::jsonb,
         locked_features = locked_features - $3,
         last_unlock_at = NOW(),
         updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, JSON.stringify([featureId]), featureId]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Feature unlock state not found for user ${userId}`);
    }
    
    return result.rows[0];
  },

  /**
   * Get all locked features for a user
   */
  async getLockedFeatures(userId: string): Promise<string[]> {
    const result = await query(
      `SELECT locked_features FROM feature_unlock_states WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return [];
    }
    
    return result.rows[0].locked_features || [];
  },

  /**
   * Get all unlocked features for a user
   */
  async getUnlockedFeatures(userId: string): Promise<string[]> {
    const result = await query(
      `SELECT unlocked_features FROM feature_unlock_states WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return [];
    }
    
    return result.rows[0].unlocked_features || [];
  },

  /**
   * Check if a specific feature is unlocked
   */
  async isFeatureUnlocked(userId: string, featureId: string): Promise<boolean> {
    const result = await query(
      `SELECT unlocked_features @> $2::jsonb as is_unlocked
       FROM feature_unlock_states
       WHERE user_id = $1`,
      [userId, JSON.stringify([featureId])]
    );
    
    return result.rows[0]?.is_unlocked || false;
  },

  /**
   * Update the entire unlock state (useful for bulk operations)
   */
  async updateUnlockState(
    userId: string,
    unlockedFeatures: string[],
    lockedFeatures: string[]
  ): Promise<FeatureUnlockState> {
    const result = await query(
      `UPDATE feature_unlock_states
       SET 
         unlocked_features = $2,
         locked_features = $3,
         last_unlock_at = NOW(),
         updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, JSON.stringify(unlockedFeatures), JSON.stringify(lockedFeatures)]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Feature unlock state not found for user ${userId}`);
    }
    
    return result.rows[0];
  },

  /**
   * Get feature unlock statistics for a user
   */
  async getStats(userId: string): Promise<FeatureUnlockStats> {
    const state = await this.findByUserId(userId);
    
    if (!state) {
      return {
        totalUnlocked: 0,
        totalLocked: 0,
        recentUnlocks: []
      };
    }

    // Get recent unlock events from onboarding_events table
    const recentUnlocksResult = await query(
      `SELECT 
         metadata->>'featureId' as feature_id,
         timestamp as unlocked_at
       FROM onboarding_events
       WHERE user_id = $1 
         AND event_type = 'feature_unlocked'
       ORDER BY timestamp DESC
       LIMIT 5`,
      [userId]
    );

    return {
      totalUnlocked: state.unlocked_features?.length || 0,
      totalLocked: state.locked_features?.length || 0,
      recentUnlocks: recentUnlocksResult.rows.map(row => ({
        featureId: row.feature_id,
        unlockedAt: row.unlocked_at
      }))
    };
  },

  /**
   * Unlock multiple features at once
   */
  async unlockMultipleFeatures(userId: string, featureIds: string[]): Promise<FeatureUnlockState> {
    const result = await query(
      `UPDATE feature_unlock_states
       SET 
         unlocked_features = unlocked_features || $2::jsonb,
         locked_features = locked_features - $3::text[],
         last_unlock_at = NOW(),
         updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, JSON.stringify(featureIds), featureIds]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Feature unlock state not found for user ${userId}`);
    }
    
    return result.rows[0];
  },

  /**
   * Delete feature unlock state (for testing or user deletion)
   */
  async delete(userId: string): Promise<void> {
    await query(
      `DELETE FROM feature_unlock_states WHERE user_id = $1`,
      [userId]
    );
  }
};
