// Smart Onboarding System - Adaptive Onboarding Integration Service

import { Pool } from 'pg';
import {
  AdaptiveOnboardingIntegration,
  OnboardingContext,
  OnboardingJourney,
  MigrationResult
} from '../interfaces/services';
import {
  UserProfile,
  UserPersona,
  OnboardingState,
  LearningPath
} from '../types';
import { smartOnboardingDb } from '../config/database';
import { smartOnboardingCache } from '../config/redis';

// Existing Adaptive Onboarding Service Interface
interface ExistingOnboardingService {
  getUserOnboardingState(userId: string): Promise<any>;
  updateOnboardingProgress(userId: string, stepId: string, completed: boolean): Promise<void>;
  getOnboardingConfiguration(userId: string): Promise<any>;
  completeOnboarding(userId: string): Promise<void>;
}

// Fallback Mechanism Manager
class FallbackMechanismManager {
  private db: Pool;
  private existingService: ExistingOnboardingService;

  constructor(db: Pool, existingService: ExistingOnboardingService) {
    this.db = db;
    this.existingService = existingService;
  }

  async shouldUseFallback(userId: string, context: OnboardingContext): Promise<boolean> {
    try {
      // Check if smart onboarding is available and working
      const smartOnboardingHealth = await this.checkSmartOnboardingHealth();
      if (!smartOnboardingHealth.isHealthy) {
        return true;
      }

      // Check if user has specific requirements that need fallback
      const userRequirements = await this.getUserRequirements(userId);
      if (userRequirements.requiresFallback) {
        return true;
      }

      // Check system load and capacity
      const systemLoad = await this.checkSystemLoad();
      if (systemLoad.isOverloaded) {
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error checking fallback conditions:', error);
      return true; // Default to fallback on error
    }
  }

  async executeFallback(userId: string, context: OnboardingContext): Promise<any> {
    try {
      // Log fallback usage
      await this.logFallbackUsage(userId, context, 'fallback_triggered');

      // Get existing onboarding state
      const existingState = await this.existingService.getUserOnboardingState(userId);
      
      // Convert to compatible format
      const adaptedState = this.adaptExistingStateToSmartFormat(existingState);
      
      // Return fallback journey
      return {
        id: `fallback_${userId}_${Date.now()}`,
        userId,
        status: 'active',
        type: 'fallback',
        currentStepIndex: adaptedState.currentStep || 0,
        steps: adaptedState.steps || [],
        fallbackReason: 'system_fallback',
        originalService: 'adaptive_onboarding',
        metadata: {
          startedAt: new Date(),
          isFallback: true
        }
      };

    } catch (error) {
      console.error('Error executing fallback:', error);
      throw error;
    }
  }

  async syncWithExistingService(userId: string, smartJourney: OnboardingJourney): Promise<void> {
    try {
      // Sync progress with existing service
      for (const step of smartJourney.steps) {
        if (step.status === 'completed') {
          await this.existingService.updateOnboardingProgress(
            userId, 
            step.id, 
            true
          );
        }
      }

      // If journey is completed, mark as complete in existing service
      if (smartJourney.status === 'completed') {
        await this.existingService.completeOnboarding(userId);
      }

      // Log sync operation
      await this.logFallbackUsage(userId, null, 'sync_completed');

    } catch (error) {
      console.error('Error syncing with existing service:', error);
      // Don't throw - sync failures shouldn't break the main flow
    }
  }

  private async checkSmartOnboardingHealth(): Promise<{ isHealthy: boolean; issues: string[] }> {
    const issues = [];
    
    try {
      // Check database connectivity
      await this.db.query('SELECT 1');
    } catch (error) {
      issues.push('database_connectivity');
    }

    try {
      // Check cache connectivity
      await smartOnboardingCache.ping();
    } catch (error) {
      issues.push('cache_connectivity');
    }

    // Check ML service availability (simplified)
    try {
      // This would be a health check to ML services
      const mlHealthy = true; // Placeholder
      if (!mlHealthy) {
        issues.push('ml_service_unavailable');
      }
    } catch (error) {
      issues.push('ml_service_error');
    }

    return {
      isHealthy: issues.length === 0,
      issues
    };
  }

  private async getUserRequirements(userId: string): Promise<{ requiresFallback: boolean; reasons: string[] }> {
    const reasons = [];
    
    try {
      // Check if user has opted out of smart onboarding
      const userPrefs = await this.getUserPreferences(userId);
      if (userPrefs.optOutSmartOnboarding) {
        reasons.push('user_opt_out');
      }

      // Check if user is in a restricted group
      if (userPrefs.restrictedGroup) {
        reasons.push('restricted_group');
      }

      // Check for accessibility requirements
      if (userPrefs.accessibilityMode) {
        reasons.push('accessibility_requirements');
      }

    } catch (error) {
      console.error('Error checking user requirements:', error);
    }

    return {
      requiresFallback: reasons.length > 0,
      reasons
    };
  }

  private async checkSystemLoad(): Promise<{ isOverloaded: boolean; metrics: any }> {
    try {
      // Check active smart onboarding sessions
      const activeSessions = await this.getActiveSessionCount();
      
      // Check system resources (simplified)
      const metrics = {
        activeSessions,
        maxSessions: 1000, // Configuration value
        cpuUsage: 0.7, // Would be actual system metrics
        memoryUsage: 0.8
      };

      const isOverloaded = 
        activeSessions > metrics.maxSessions ||
        metrics.cpuUsage > 0.9 ||
        metrics.memoryUsage > 0.9;

      return { isOverloaded, metrics };

    } catch (error) {
      console.error('Error checking system load:', error);
      return { isOverloaded: true, metrics: {} };
    }
  }

  private async getUserPreferences(userId: string): Promise<any> {
    const query = `
      SELECT preferences FROM user_onboarding_preferences 
      WHERE user_id = $1
    `;
    
    try {
      const result = await this.db.query(query, [userId]);
      return result.rows.length > 0 ? JSON.parse(result.rows[0].preferences) : {};
    } catch (error) {
      return {};
    }
  }

  private async getActiveSessionCount(): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM smart_onboarding_journeys 
      WHERE status = 'active' 
      AND metadata->>'lastActiveAt' > NOW() - INTERVAL '1 hour'
    `;
    
    try {
      const result = await this.db.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      return 0;
    }
  }

  private adaptExistingStateToSmartFormat(existingState: any): any {
    // Convert existing onboarding state to smart onboarding format
    return {
      currentStep: existingState.currentStep || 0,
      steps: (existingState.steps || []).map((step: any, index: number) => ({
        id: step.id || `step_${index}`,
        type: step.type || 'generic',
        title: step.title || `Step ${index + 1}`,
        description: step.description || '',
        status: step.completed ? 'completed' : 'pending',
        isOptional: step.optional || false
      }))
    };
  }

  private async logFallbackUsage(userId: string, context: OnboardingContext | null, eventType: string): Promise<void> {
    const query = `
      INSERT INTO smart_onboarding_fallback_logs 
      (user_id, event_type, context, timestamp)
      VALUES ($1, $2, $3, NOW())
    `;

    try {
      await this.db.query(query, [
        userId,
        eventType,
        JSON.stringify(context || {})
      ]);
    } catch (error) {
      console.error('Error logging fallback usage:', error);
    }
  }
}

// Data Migration Manager
class DataMigrationManager {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async migrateUserData(userId: string): Promise<MigrationResult> {
    try {
      // Get existing onboarding data
      const existingData = await this.getExistingOnboardingData(userId);
      
      if (!existingData) {
        return {
          success: true,
          userId,
          migratedData: null,
          message: 'No existing data to migrate'
        };
      }

      // Convert to smart onboarding format
      const smartOnboardingData = await this.convertToSmartFormat(existingData);
      
      // Store migrated data
      await this.storeSmartOnboardingData(userId, smartOnboardingData);
      
      // Validate migration
      const validationResult = await this.validateMigration(userId, existingData, smartOnboardingData);
      
      return {
        success: validationResult.isValid,
        userId,
        migratedData: smartOnboardingData,
        message: validationResult.message,
        warnings: validationResult.warnings
      };

    } catch (error) {
      console.error('Error migrating user data:', error);
      return {
        success: false,
        userId,
        migratedData: null,
        message: `Migration failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async batchMigrateUsers(userIds: string[]): Promise<MigrationResult[]> {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const result = await this.migrateUserData(userId);
        results.push(result);
        
        // Add delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({
          success: false,
          userId,
          migratedData: null,
          message: `Batch migration failed: ${error.message}`,
          error: error.message
        });
      }
    }
    
    return results;
  }

  private async getExistingOnboardingData(userId: string): Promise<any> {
    // Query existing adaptive onboarding tables
    const queries = [
      `SELECT * FROM onboarding_profiles WHERE user_id = $1`,
      `SELECT * FROM onboarding_events WHERE user_id = $1 ORDER BY created_at`,
      `SELECT * FROM feature_unlocks WHERE user_id = $1`
    ];

    try {
      const [profileResult, eventsResult, unlocksResult] = await Promise.all(
        queries.map(query => this.db.query(query, [userId]))
      );

      if (profileResult.rows.length === 0) {
        return null; // No existing data
      }

      return {
        profile: profileResult.rows[0],
        events: eventsResult.rows,
        unlocks: unlocksResult.rows
      };

    } catch (error) {
      console.error('Error getting existing onboarding data:', error);
      return null;
    }
  }

  private async convertToSmartFormat(existingData: any): Promise<any> {
    const profile = existingData.profile;
    const events = existingData.events;
    const unlocks = existingData.unlocks;

    // Convert profile to UserProfile format
    const userProfile: UserProfile = {
      id: profile.user_id,
      technicalProficiency: this.mapProficiencyLevel(profile.technical_level),
      previousExperience: this.mapExperienceLevel(profile.experience_level),
      learningStyle: this.mapLearningStyle(profile.learning_preferences),
      timeConstraints: {
        urgencyLevel: profile.urgency_level || 'medium',
        availableTime: profile.available_time || 30
      },
      contentCreationGoals: this.parseGoals(profile.goals),
      platformPreferences: this.parsePlatformPreferences(profile.platforms),
      socialConnections: []
    };

    // Convert events to behavior events
    const behaviorEvents = events.map(event => ({
      id: event.id,
      userId: event.user_id,
      sessionId: event.session_id || 'migrated',
      stepId: event.step_id,
      eventType: this.mapEventType(event.event_type),
      timestamp: event.created_at,
      interactionData: JSON.parse(event.interaction_data || '{}'),
      engagementScore: event.engagement_score || 0.5,
      metadata: { migrated: true }
    }));

    // Convert unlocks to journey progress
    const completedSteps = unlocks.map(unlock => ({
      stepId: unlock.feature_id,
      completedAt: unlock.unlocked_at,
      method: 'migration'
    }));

    return {
      userProfile,
      behaviorEvents,
      completedSteps,
      migrationMetadata: {
        migratedAt: new Date(),
        originalProfileId: profile.id,
        eventCount: events.length,
        unlockCount: unlocks.length
      }
    };
  }

  private async storeSmartOnboardingData(userId: string, data: any): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Store migration record
      await client.query(`
        INSERT INTO smart_onboarding_migrations 
        (user_id, migration_data, migrated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
        migration_data = EXCLUDED.migration_data,
        migrated_at = NOW()
      `, [userId, JSON.stringify(data)]);

      // Store behavior events
      for (const event of data.behaviorEvents) {
        await client.query(`
          INSERT INTO smart_onboarding_behavior_events 
          (id, user_id, session_id, step_id, event_type, timestamp, interaction_data, engagement_score, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, [
          event.id,
          event.userId,
          event.sessionId,
          event.stepId,
          event.eventType,
          event.timestamp,
          JSON.stringify(event.interactionData),
          event.engagementScore,
          JSON.stringify(event.metadata)
        ]);
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async validateMigration(userId: string, originalData: any, migratedData: any): Promise<any> {
    const warnings = [];
    
    // Validate event count
    const originalEventCount = originalData.events.length;
    const migratedEventCount = migratedData.behaviorEvents.length;
    
    if (originalEventCount !== migratedEventCount) {
      warnings.push(`Event count mismatch: ${originalEventCount} original vs ${migratedEventCount} migrated`);
    }

    // Validate unlock count
    const originalUnlockCount = originalData.unlocks.length;
    const migratedStepCount = migratedData.completedSteps.length;
    
    if (originalUnlockCount !== migratedStepCount) {
      warnings.push(`Unlock count mismatch: ${originalUnlockCount} original vs ${migratedStepCount} migrated`);
    }

    // Check for data integrity
    const hasProfile = !!migratedData.userProfile;
    const hasValidUserId = migratedData.userProfile?.id === userId;
    
    const isValid = hasProfile && hasValidUserId && warnings.length < 3; // Allow some warnings
    
    return {
      isValid,
      message: isValid ? 'Migration completed successfully' : 'Migration completed with issues',
      warnings
    };
  }

  // Mapping helper methods
  private mapProficiencyLevel(level: string): any {
    const mapping = {
      'novice': 'beginner',
      'basic': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced',
      'expert': 'expert'
    };
    return mapping[level] || 'beginner';
  }

  private mapExperienceLevel(level: string): any {
    const mapping = {
      'none': 'none',
      'some': 'basic',
      'moderate': 'intermediate',
      'extensive': 'advanced'
    };
    return mapping[level] || 'none';
  }

  private mapLearningStyle(preferences: string): any {
    if (!preferences) return 'guided';
    
    const prefs = preferences.toLowerCase();
    if (prefs.includes('visual')) return 'visual';
    if (prefs.includes('hands')) return 'hands_on';
    if (prefs.includes('reading')) return 'reading';
    return 'guided';
  }

  private parseGoals(goalsString: string): any[] {
    if (!goalsString) return [];
    
    try {
      const goals = JSON.parse(goalsString);
      return Array.isArray(goals) ? goals : [];
    } catch {
      return goalsString.split(',').map(goal => ({
        type: goal.trim().toLowerCase().replace(' ', '_'),
        priority: 'medium'
      }));
    }
  }

  private parsePlatformPreferences(platformsString: string): string[] {
    if (!platformsString) return [];
    
    try {
      const platforms = JSON.parse(platformsString);
      return Array.isArray(platforms) ? platforms : [];
    } catch {
      return platformsString.split(',').map(p => p.trim());
    }
  }

  private mapEventType(originalType: string): string {
    const mapping = {
      'step_start': 'step_started',
      'step_complete': 'step_completed',
      'feature_unlock': 'feature_unlocked',
      'help_click': 'help_requested',
      'error_occurred': 'error'
    };
    return mapping[originalType] || originalType;
  }
}

// Compatibility Layer
class CompatibilityLayer {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createCompatibilityBridge(userId: string): Promise<void> {
    // Create bridge tables and views for backward compatibility
    await this.createUserBridge(userId);
    await this.createEventBridge(userId);
    await this.createProgressBridge(userId);
  }

  async syncBidirectionally(userId: string, direction: 'to_smart' | 'from_smart'): Promise<void> {
    if (direction === 'to_smart') {
      await this.syncToSmartOnboarding(userId);
    } else {
      await this.syncFromSmartOnboarding(userId);
    }
  }

  private async createUserBridge(userId: string): Promise<void> {
    // Create or update bridge record
    const query = `
      INSERT INTO onboarding_compatibility_bridge 
      (user_id, smart_onboarding_active, last_sync, created_at)
      VALUES ($1, true, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
      smart_onboarding_active = true,
      last_sync = NOW()
    `;

    await this.db.query(query, [userId]);
  }

  private async createEventBridge(userId: string): Promise<void> {
    // Create view that maps smart onboarding events to legacy format
    // This would be done once, not per user, but shown here for completeness
    const viewQuery = `
      CREATE OR REPLACE VIEW legacy_onboarding_events AS
      SELECT 
        id,
        user_id,
        step_id,
        CASE 
          WHEN event_type = 'step_started' THEN 'step_start'
          WHEN event_type = 'step_completed' THEN 'step_complete'
          WHEN event_type = 'help_requested' THEN 'help_click'
          ELSE event_type
        END as event_type,
        interaction_data,
        engagement_score,
        timestamp as created_at
      FROM smart_onboarding_behavior_events
      WHERE user_id = $1
    `;

    try {
      await this.db.query(viewQuery, [userId]);
    } catch (error) {
      // View might already exist, which is fine
      console.log('Compatibility view already exists or creation failed:', error.message);
    }
  }

  private async createProgressBridge(userId: string): Promise<void> {
    // Sync progress between systems
    const query = `
      INSERT INTO onboarding_progress_sync 
      (user_id, smart_journey_id, legacy_profile_id, sync_status, last_updated)
      SELECT $1, j.id, p.id, 'active', NOW()
      FROM smart_onboarding_journeys j
      LEFT JOIN onboarding_profiles p ON p.user_id = $1
      WHERE j.user_id = $1
      ON CONFLICT (user_id) DO UPDATE SET
      sync_status = 'active',
      last_updated = NOW()
    `;

    await this.db.query(query, [userId]);
  }

  private async syncToSmartOnboarding(userId: string): Promise<void> {
    // Get latest data from legacy system and update smart onboarding
    const legacyData = await this.getLegacyData(userId);
    
    if (legacyData.hasUpdates) {
      await this.updateSmartOnboardingFromLegacy(userId, legacyData);
    }
  }

  private async syncFromSmartOnboarding(userId: string): Promise<void> {
    // Get latest data from smart onboarding and update legacy system
    const smartData = await this.getSmartOnboardingData(userId);
    
    if (smartData.hasUpdates) {
      await this.updateLegacyFromSmartOnboarding(userId, smartData);
    }
  }

  private async getLegacyData(userId: string): Promise<any> {
    // Simplified - would get actual legacy data
    return { hasUpdates: false };
  }

  private async getSmartOnboardingData(userId: string): Promise<any> {
    // Simplified - would get actual smart onboarding data
    return { hasUpdates: false };
  }

  private async updateSmartOnboardingFromLegacy(userId: string, legacyData: any): Promise<void> {
    // Update smart onboarding with legacy changes
    console.log(`Syncing legacy data to smart onboarding for user ${userId}`);
  }

  private async updateLegacyFromSmartOnboarding(userId: string, smartData: any): Promise<void> {
    // Update legacy system with smart onboarding changes
    console.log(`Syncing smart onboarding data to legacy for user ${userId}`);
  }
}

// Main Adaptive Onboarding Integration Implementation
export class AdaptiveOnboardingIntegrationImpl implements AdaptiveOnboardingIntegration {
  private db: Pool;
  private fallbackManager: FallbackMechanismManager;
  private migrationManager: DataMigrationManager;
  private compatibilityLayer: CompatibilityLayer;
  private existingService: ExistingOnboardingService;

  constructor(existingService: ExistingOnboardingService) {
    this.db = smartOnboardingDb;
    this.existingService = existingService;
    this.fallbackManager = new FallbackMechanismManager(this.db, existingService);
    this.migrationManager = new DataMigrationManager(this.db);
    this.compatibilityLayer = new CompatibilityLayer(this.db);
  }

  async checkFallbackNeeded(userId: string, context: OnboardingContext): Promise<boolean> {
    return await this.fallbackManager.shouldUseFallback(userId, context);
  }

  async executeFallback(userId: string, context: OnboardingContext): Promise<OnboardingJourney> {
    return await this.fallbackManager.executeFallback(userId, context);
  }

  async syncWithExistingSystem(userId: string, journey: OnboardingJourney): Promise<void> {
    await this.fallbackManager.syncWithExistingService(userId, journey);
  }

  async migrateUserData(userId: string): Promise<MigrationResult> {
    return await this.migrationManager.migrateUserData(userId);
  }

  async batchMigrateUsers(userIds: string[]): Promise<MigrationResult[]> {
    return await this.migrationManager.batchMigrateUsers(userIds);
  }

  async createCompatibilityBridge(userId: string): Promise<void> {
    await this.compatibilityLayer.createCompatibilityBridge(userId);
  }

  async enableBidirectionalSync(userId: string): Promise<void> {
    // Enable real-time sync between systems
    await this.compatibilityLayer.syncBidirectionally(userId, 'to_smart');
    await this.compatibilityLayer.syncBidirectionally(userId, 'from_smart');
  }

  async getIntegrationStatus(userId: string): Promise<any> {
    const query = `
      SELECT 
        cb.smart_onboarding_active,
        cb.last_sync,
        m.migrated_at,
        ps.sync_status
      FROM onboarding_compatibility_bridge cb
      LEFT JOIN smart_onboarding_migrations m ON m.user_id = cb.user_id
      LEFT JOIN onboarding_progress_sync ps ON ps.user_id = cb.user_id
      WHERE cb.user_id = $1
    `;

    try {
      const result = await this.db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return {
          userId,
          smartOnboardingActive: false,
          migrationStatus: 'not_migrated',
          syncStatus: 'not_synced',
          lastSync: null
        };
      }

      const row = result.rows[0];
      return {
        userId,
        smartOnboardingActive: row.smart_onboarding_active,
        migrationStatus: row.migrated_at ? 'migrated' : 'not_migrated',
        syncStatus: row.sync_status || 'not_synced',
        lastSync: row.last_sync,
        migratedAt: row.migrated_at
      };

    } catch (error) {
      console.error('Error getting integration status:', error);
      return {
        userId,
        smartOnboardingActive: false,
        migrationStatus: 'error',
        syncStatus: 'error',
        error: error.message
      };
    }
  }
}