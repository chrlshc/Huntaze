/**
 * Onboarding Profile Repository
 * 
 * Handles database operations for user onboarding profiles including:
 * - Creator level management
 * - Progress tracking
 * - Custom onboarding paths
 */

import { Pool } from 'pg';
import pool from '../index';

export type CreatorLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface OnboardingProfile {
  id: string;
  userId: string;
  creatorLevel: CreatorLevel;
  primaryGoals: string[];
  completedSteps: string[];
  skippedSteps: string[];
  currentStep: string | null;
  progressPercentage: number;
  customPath: OnboardingStep[];
  startedAt: Date;
  completedAt: Date | null;
  estimatedTimeRemaining: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'required' | 'recommended' | 'optional';
  category: string;
  estimatedMinutes: number;
  dependencies: string[];
  unlocks: string[];
}

export interface CreateOnboardingProfileInput {
  userId: string;
  creatorLevel: CreatorLevel;
  primaryGoals: string[];
  customPath: OnboardingStep[];
}

export interface UpdateProgressInput {
  completedSteps?: string[];
  skippedSteps?: string[];
  currentStep?: string | null;
  progressPercentage?: number;
  estimatedTimeRemaining?: number;
  completedAt?: Date | null;
}

class OnboardingProfileRepository {
  /**
   * Create a new onboarding profile for a user
   */
  async create(input: CreateOnboardingProfileInput): Promise<OnboardingProfile> {
    const query = `
      INSERT INTO onboarding_profiles (
        user_id,
        creator_level,
        primary_goals,
        custom_path
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      input.userId,
      input.creatorLevel,
      input.primaryGoals,
      JSON.stringify(input.customPath)
    ];
    
    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  /**
   * Find onboarding profile by user ID
   */
  async findByUserId(userId: string): Promise<OnboardingProfile | null> {
    const query = `
      SELECT * FROM onboarding_profiles
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRow(result.rows[0]);
  }

  /**
   * Update onboarding profile
   */
  async update(userId: string, updates: Partial<OnboardingProfile>): Promise<OnboardingProfile> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.creatorLevel !== undefined) {
      setClauses.push(`creator_level = $${paramIndex++}`);
      values.push(updates.creatorLevel);
    }

    if (updates.primaryGoals !== undefined) {
      setClauses.push(`primary_goals = $${paramIndex++}`);
      values.push(updates.primaryGoals);
    }

    if (updates.completedSteps !== undefined) {
      setClauses.push(`completed_steps = $${paramIndex++}`);
      values.push(updates.completedSteps);
    }

    if (updates.skippedSteps !== undefined) {
      setClauses.push(`skipped_steps = $${paramIndex++}`);
      values.push(updates.skippedSteps);
    }

    if (updates.currentStep !== undefined) {
      setClauses.push(`current_step = $${paramIndex++}`);
      values.push(updates.currentStep);
    }

    if (updates.progressPercentage !== undefined) {
      setClauses.push(`progress_percentage = $${paramIndex++}`);
      values.push(updates.progressPercentage);
    }

    if (updates.customPath !== undefined) {
      setClauses.push(`custom_path = $${paramIndex++}`);
      values.push(JSON.stringify(updates.customPath));
    }

    if (updates.estimatedTimeRemaining !== undefined) {
      setClauses.push(`estimated_time_remaining = $${paramIndex++}`);
      values.push(updates.estimatedTimeRemaining);
    }

    if (updates.completedAt !== undefined) {
      setClauses.push(`completed_at = $${paramIndex++}`);
      values.push(updates.completedAt);
    }

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);

    const query = `
      UPDATE onboarding_profiles
      SET ${setClauses.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Onboarding profile not found');
    }

    return this.mapRow(result.rows[0]);
  }

  /**
   * Update progress tracking fields
   */
  async updateProgress(userId: string, progress: UpdateProgressInput): Promise<OnboardingProfile> {
    return this.update(userId, progress);
  }

  /**
   * Update creator level
   */
  async updateCreatorLevel(userId: string, level: CreatorLevel): Promise<OnboardingProfile> {
    return this.update(userId, { creatorLevel: level });
  }

  /**
   * Mark step as completed
   */
  async completeStep(userId: string, stepId: string): Promise<OnboardingProfile> {
    const profile = await this.findByUserId(userId);
    
    if (!profile) {
      throw new Error('Onboarding profile not found');
    }

    const completedSteps = [...profile.completedSteps];
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }

    // Calculate new progress
    const totalSteps = profile.customPath.length;
    const progressPercentage = totalSteps > 0 
      ? Math.min(Math.round((completedSteps.length / totalSteps) * 100), 100)
      : 0;

    // Find next step
    const currentStepIndex = profile.customPath.findIndex(s => s.id === stepId);
    const nextStep = currentStepIndex >= 0 && currentStepIndex < profile.customPath.length - 1
      ? profile.customPath[currentStepIndex + 1].id
      : null;

    // Calculate estimated time remaining
    const remainingSteps = profile.customPath.filter(
      step => !completedSteps.includes(step.id) && !profile.skippedSteps.includes(step.id)
    );
    const estimatedTimeRemaining = remainingSteps.reduce((sum, step) => sum + step.estimatedMinutes, 0);

    // Check if onboarding is complete
    const completedAt = progressPercentage === 100 ? new Date() : null;

    return this.update(userId, {
      completedSteps,
      currentStep: nextStep,
      progressPercentage,
      estimatedTimeRemaining,
      completedAt
    });
  }

  /**
   * Mark step as skipped
   */
  async skipStep(userId: string, stepId: string): Promise<OnboardingProfile> {
    const profile = await this.findByUserId(userId);
    
    if (!profile) {
      throw new Error('Onboarding profile not found');
    }

    const skippedSteps = [...profile.skippedSteps];
    if (!skippedSteps.includes(stepId)) {
      skippedSteps.push(stepId);
    }

    // Find next step
    const currentStepIndex = profile.customPath.findIndex(s => s.id === stepId);
    const nextStep = currentStepIndex >= 0 && currentStepIndex < profile.customPath.length - 1
      ? profile.customPath[currentStepIndex + 1].id
      : null;

    // Recalculate estimated time
    const remainingSteps = profile.customPath.filter(
      step => !profile.completedSteps.includes(step.id) && !skippedSteps.includes(step.id)
    );
    const estimatedTimeRemaining = remainingSteps.reduce((sum, step) => sum + step.estimatedMinutes, 0);

    return this.update(userId, {
      skippedSteps,
      currentStep: nextStep,
      estimatedTimeRemaining
    });
  }

  /**
   * Get all profiles by creator level (for analytics)
   */
  async findByCreatorLevel(level: CreatorLevel): Promise<OnboardingProfile[]> {
    const query = `
      SELECT * FROM onboarding_profiles
      WHERE creator_level = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [level]);
    return result.rows.map(row => this.mapRow(row));
  }

  /**
   * Get completion statistics
   */
  async getCompletionStats(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    averageProgress: number;
    averageCompletionTime: number; // in minutes
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(completed_at) as completed,
        COUNT(*) FILTER (WHERE completed_at IS NULL) as in_progress,
        AVG(progress_percentage) as average_progress,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) FILTER (WHERE completed_at IS NOT NULL) as avg_completion_time
      FROM onboarding_profiles
    `;
    
    const result = await pool.query(query);
    const row = result.rows[0];
    
    return {
      total: parseInt(row.total),
      completed: parseInt(row.completed),
      inProgress: parseInt(row.in_progress),
      averageProgress: parseFloat(row.average_progress) || 0,
      averageCompletionTime: parseFloat(row.avg_completion_time) || 0
    };
  }

  /**
   * Delete onboarding profile (for testing/cleanup)
   */
  async delete(userId: string): Promise<void> {
    const query = `
      DELETE FROM onboarding_profiles
      WHERE user_id = $1
    `;
    
    await pool.query(query, [userId]);
  }

  /**
   * Map database row to OnboardingProfile object
   */
  private mapRow(row: any): OnboardingProfile {
    return {
      id: row.id,
      userId: row.user_id,
      creatorLevel: row.creator_level,
      primaryGoals: row.primary_goals || [],
      completedSteps: row.completed_steps || [],
      skippedSteps: row.skipped_steps || [],
      currentStep: row.current_step,
      progressPercentage: row.progress_percentage,
      customPath: typeof row.custom_path === 'string' 
        ? JSON.parse(row.custom_path) 
        : row.custom_path || [],
      startedAt: row.started_at,
      completedAt: row.completed_at,
      estimatedTimeRemaining: row.estimated_time_remaining,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default new OnboardingProfileRepository();
