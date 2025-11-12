/**
 * User Onboarding Repository
 * 
 * Handles user progress through onboarding steps with status tracking,
 * snooze functionality, and progress calculation.
 */

import { Pool } from 'pg';

export type StepStatus = 'todo' | 'done' | 'skipped';

export interface UserOnboardingStep {
  userId: string;
  stepId: string;
  version: number;
  status: StepStatus;
  snoozeUntil?: Date;
  snoozeCount: number;
  completedBy?: string;
  completedAt?: Date;
  updatedAt: Date;
}

export interface UpdateStepStatusInput {
  status: StepStatus;
  completedBy?: string;
  snoozeUntil?: Date;
}

export interface UserProgress {
  userId: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  skippedSteps: number;
  remainingSteps: number;
}

export class UserOnboardingRepository {
  constructor(private pool: Pool) {}

  /**
   * Get user's status for a specific step
   */
  async getUserStep(
    userId: string,
    stepId: string,
    version?: number
  ): Promise<UserOnboardingStep | null> {
    let query = `
      SELECT 
        user_id as "userId",
        step_id as "stepId",
        version,
        status,
        snooze_until as "snoozeUntil",
        snooze_count as "snoozeCount",
        completed_by as "completedBy",
        completed_at as "completedAt",
        updated_at as "updatedAt"
      FROM user_onboarding
      WHERE user_id = $1 AND step_id = $2
    `;
    
    const params: any[] = [userId, stepId];
    
    if (version !== undefined) {
      query += ` AND version = $3`;
      params.push(version);
    } else {
      query += ` ORDER BY version DESC LIMIT 1`;
    }
    
    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Get all user's onboarding steps
   */
  async getUserSteps(userId: string): Promise<UserOnboardingStep[]> {
    const query = `
      SELECT 
        user_id as "userId",
        step_id as "stepId",
        version,
        status,
        snooze_until as "snoozeUntil",
        snooze_count as "snoozeCount",
        completed_by as "completedBy",
        completed_at as "completedAt",
        updated_at as "updatedAt"
      FROM user_onboarding
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Update or create user step status
   */
  async updateStepStatus(
    userId: string,
    stepId: string,
    version: number,
    input: UpdateStepStatusInput
  ): Promise<UserOnboardingStep> {
    const { status, completedBy, snoozeUntil } = input;
    
    // Check if step exists
    const existing = await this.getUserStep(userId, stepId, version);
    
    // Validate status transition
    if (existing) {
      const canTransition = await this.canTransitionTo(
        existing.status,
        status,
        stepId,
        version
      );
      
      if (!canTransition) {
        throw new Error(
          `Invalid status transition from ${existing.status} to ${status} for step ${stepId}`
        );
      }
    }
    
    const query = `
      INSERT INTO user_onboarding (
        user_id,
        step_id,
        version,
        status,
        snooze_until,
        snooze_count,
        completed_by,
        completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, step_id, version)
      DO UPDATE SET
        status = EXCLUDED.status,
        snooze_until = EXCLUDED.snooze_until,
        snooze_count = CASE 
          WHEN EXCLUDED.snooze_until IS NOT NULL AND EXCLUDED.snooze_until > user_onboarding.snooze_until
          THEN user_onboarding.snooze_count + 1
          ELSE user_onboarding.snooze_count
        END,
        completed_by = EXCLUDED.completed_by,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW()
      RETURNING 
        user_id as "userId",
        step_id as "stepId",
        version,
        status,
        snooze_until as "snoozeUntil",
        snooze_count as "snoozeCount",
        completed_by as "completedBy",
        completed_at as "completedAt",
        updated_at as "updatedAt"
    `;
    
    const completedAt = status === 'done' ? new Date() : null;
    const snoozeCount = existing?.snoozeCount || 0;
    
    const result = await this.pool.query(query, [
      userId,
      stepId,
      version,
      status,
      snoozeUntil,
      snoozeCount,
      completedBy,
      completedAt
    ]);
    
    return result.rows[0];
  }

  /**
   * Check if user has completed a step
   */
  async hasStepDone(userId: string, stepId: string): Promise<boolean> {
    const query = `SELECT has_step_done($1, $2) as done`;
    const result = await this.pool.query(query, [userId, stepId]);
    return result.rows[0]?.done || false;
  }

  /**
   * Calculate user's onboarding progress
   */
  async calculateProgress(userId: string, market?: string): Promise<number> {
    const query = `SELECT calculate_onboarding_progress($1, $2) as progress`;
    const result = await this.pool.query(query, [userId, market || null]);
    return result.rows[0]?.progress || 0;
  }

  /**
   * Get detailed user progress
   */
  async getUserProgress(userId: string, market?: string): Promise<UserProgress> {
    // Get all active steps for the user's market
    const stepsQuery = `
      SELECT COUNT(*) as total
      FROM onboarding_step_definitions
      WHERE (active_from IS NULL OR active_from <= NOW())
        AND (active_to IS NULL OR active_to >= NOW())
        AND ($2::text IS NULL OR market_rule IS NULL OR market_rule @> jsonb_build_object('markets', jsonb_build_array($2)))
    `;
    
    const stepsResult = await this.pool.query(stepsQuery, [userId, market || null]);
    const totalSteps = parseInt(stepsResult.rows[0]?.total || '0');
    
    // Get user's completed and skipped steps
    const userStepsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'done') as completed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped
      FROM user_onboarding
      WHERE user_id = $1
    `;
    
    const userStepsResult = await this.pool.query(userStepsQuery, [userId]);
    const completedSteps = parseInt(userStepsResult.rows[0]?.completed || '0');
    const skippedSteps = parseInt(userStepsResult.rows[0]?.skipped || '0');
    
    // Calculate progress percentage
    const progress = await this.calculateProgress(userId, market);
    
    return {
      userId,
      progress,
      totalSteps,
      completedSteps,
      skippedSteps,
      remainingSteps: totalSteps - completedSteps - skippedSteps
    };
  }

  /**
   * Snooze onboarding nudges for a user
   */
  async snoozeNudges(
    userId: string,
    days: number = 7,
    maxSnoozes: number = 3
  ): Promise<boolean> {
    // Check current snooze count
    const checkQuery = `
      SELECT MAX(snooze_count) as max_snooze
      FROM user_onboarding
      WHERE user_id = $1
    `;
    
    const checkResult = await this.pool.query(checkQuery, [userId]);
    const currentSnoozeCount = parseInt(checkResult.rows[0]?.max_snooze || '0');
    
    if (currentSnoozeCount >= maxSnoozes) {
      throw new Error(`Maximum snooze limit (${maxSnoozes}) reached`);
    }
    
    // Update snooze for all incomplete steps
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);
    
    const updateQuery = `
      UPDATE user_onboarding
      SET 
        snooze_until = $2,
        snooze_count = snooze_count + 1,
        updated_at = NOW()
      WHERE user_id = $1
        AND status != 'done'
    `;
    
    await this.pool.query(updateQuery, [userId, snoozeUntil]);
    return true;
  }

  /**
   * Check if nudges are currently snoozed
   */
  async isNudgeSnoozed(userId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM user_onboarding
        WHERE user_id = $1
          AND snooze_until IS NOT NULL
          AND snooze_until > NOW()
      ) as snoozed
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows[0]?.snoozed || false;
  }

  /**
   * Migrate user progress to new step version
   */
  async migrateStepVersion(
    userId: string,
    stepId: string,
    oldVersion: number,
    newVersion: number
  ): Promise<UserOnboardingStep | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get old step status
      const oldStep = await this.getUserStep(userId, stepId, oldVersion);
      
      if (!oldStep) {
        await client.query('COMMIT');
        return null;
      }
      
      // Create new version with same status if done, otherwise reset to todo
      const newStatus: StepStatus = oldStep.status === 'done' ? 'done' : 'todo';
      
      const query = `
        INSERT INTO user_onboarding (
          user_id,
          step_id,
          version,
          status,
          completed_by,
          completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, step_id, version) DO NOTHING
        RETURNING 
          user_id as "userId",
          step_id as "stepId",
          version,
          status,
          snooze_until as "snoozeUntil",
          snooze_count as "snoozeCount",
          completed_by as "completedBy",
          completed_at as "completedAt",
          updated_at as "updatedAt"
      `;
      
      const result = await client.query(query, [
        userId,
        stepId,
        newVersion,
        newStatus,
        oldStep.completedBy,
        oldStep.completedAt
      ]);
      
      await client.query('COMMIT');
      return result.rows[0] || null;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if status transition is allowed
   */
  private async canTransitionTo(
    currentStatus: StepStatus,
    newStatus: StepStatus,
    stepId: string,
    version: number
  ): Promise<boolean> {
    // Get step definition to check if required
    const stepQuery = `
      SELECT required
      FROM onboarding_step_definitions
      WHERE id = $1 AND version = $2
    `;
    
    const result = await this.pool.query(stepQuery, [stepId, version]);
    const isRequired = result.rows[0]?.required || false;
    
    // Use database function for validation
    const validationQuery = `SELECT can_transition_to($1, $2, $3) as can_transition`;
    const validationResult = await this.pool.query(validationQuery, [
      currentStatus,
      newStatus,
      isRequired
    ]);
    
    return validationResult.rows[0]?.can_transition || false;
  }

  /**
   * Reset user's onboarding progress (soft reset)
   */
  async resetProgress(userId: string): Promise<void> {
    const query = `
      UPDATE user_onboarding
      SET 
        status = 'todo',
        snooze_until = NULL,
        snooze_count = 0,
        completed_by = NULL,
        completed_at = NULL,
        updated_at = NOW()
      WHERE user_id = $1
        AND status != 'done'
    `;
    
    await this.pool.query(query, [userId]);
  }

  /**
   * Get steps that need user attention (not done, not snoozed)
   */
  async getStepsNeedingAttention(userId: string): Promise<UserOnboardingStep[]> {
    const query = `
      SELECT 
        user_id as "userId",
        step_id as "stepId",
        version,
        status,
        snooze_until as "snoozeUntil",
        snooze_count as "snoozeCount",
        completed_by as "completedBy",
        completed_at as "completedAt",
        updated_at as "updatedAt"
      FROM user_onboarding
      WHERE user_id = $1
        AND status != 'done'
        AND (snooze_until IS NULL OR snooze_until <= NOW())
      ORDER BY updated_at ASC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }
}
