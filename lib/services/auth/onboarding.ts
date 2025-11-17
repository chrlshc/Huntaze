/**
 * Auth Service - Onboarding Service
 * 
 * Handles user onboarding status with:
 * - Status checking
 * - Completion tracking
 * - Error handling with retry logic
 * - Structured logging
 */

import { query } from '@/lib/db';
import { authLogger } from './logger';
import { createAuthError, mapDatabaseError, isRetryable } from './errors';
import { AuthErrorType } from './types';

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100, // ms
  maxDelay: 2000, // ms
  backoffFactor: 2,
};

/**
 * Onboarding Service
 */
export class OnboardingService {
  /**
   * Check if user has completed onboarding
   * 
   * @param userId - User ID
   * @returns Promise<boolean> - True if onboarding completed
   * 
   * @example
   * ```typescript
   * const completed = await onboardingService.isOnboardingCompleted('user_123');
   * if (!completed) {
   *   // Redirect to onboarding
   * }
   * ```
   */
  async isOnboardingCompleted(userId: string): Promise<boolean> {
    const correlationId = authLogger.generateCorrelationId();
    
    authLogger.debug('Checking onboarding status', {
      correlationId,
      userId,
    });

    try {
      const result = await this.retryOperation(
        async () => {
          return await query(
            'SELECT onboarding_completed FROM users WHERE id = $1',
            [userId]
          );
        },
        'Check onboarding status',
        correlationId
      );
      
      if (result.rows.length === 0) {
        throw createAuthError(
          AuthErrorType.USER_NOT_FOUND,
          'User not found',
          correlationId,
          false,
          404
        );
      }
      
      const completed = result.rows[0].onboarding_completed || false;
      
      authLogger.debug('Onboarding status retrieved', {
        correlationId,
        userId,
        completed,
      });
      
      return completed;
    } catch (error: any) {
      authLogger.error('Check onboarding status failed', error, {
        correlationId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Mark onboarding as completed
   * 
   * @param userId - User ID
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * await onboardingService.completeOnboarding('user_123');
   * ```
   */
  async completeOnboarding(userId: string): Promise<void> {
    const correlationId = authLogger.generateCorrelationId();
    const startTime = Date.now();
    
    authLogger.info('Completing onboarding', {
      correlationId,
      userId,
    });

    try {
      const result = await this.retryOperation(
        async () => {
          return await query(
            `UPDATE users 
             SET onboarding_completed = true, updated_at = NOW() 
             WHERE id = $1 
             RETURNING id, onboarding_completed`,
            [userId]
          );
        },
        'Complete onboarding',
        correlationId
      );
      
      if (result.rows.length === 0) {
        throw createAuthError(
          AuthErrorType.USER_NOT_FOUND,
          'User not found',
          correlationId,
          false,
          404
        );
      }
      
      const duration = Date.now() - startTime;
      authLogger.info('Onboarding completed successfully', {
        correlationId,
        userId,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      authLogger.error('Complete onboarding failed', error, {
        correlationId,
        userId,
        duration,
      });
      throw error;
    }
  }

  /**
   * Reset onboarding status (admin only)
   * 
   * @param userId - User ID
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * // Admin only
   * await onboardingService.resetOnboarding('user_123');
   * ```
   */
  async resetOnboarding(userId: string): Promise<void> {
    const correlationId = authLogger.generateCorrelationId();
    
    authLogger.info('Resetting onboarding', {
      correlationId,
      userId,
    });

    try {
      await this.retryOperation(
        async () => {
          return await query(
            `UPDATE users 
             SET onboarding_completed = false, updated_at = NOW() 
             WHERE id = $1`,
            [userId]
          );
        },
        'Reset onboarding',
        correlationId
      );
      
      authLogger.info('Onboarding reset successfully', {
        correlationId,
        userId,
      });
    } catch (error: any) {
      authLogger.error('Reset onboarding failed', error, {
        correlationId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get onboarding statistics (admin only)
   * 
   * @returns Promise<OnboardingStats>
   * 
   * @example
   * ```typescript
   * const stats = await onboardingService.getOnboardingStats();
   * console.log(`Completion rate: ${stats.completionRate}%`);
   * ```
   */
  async getOnboardingStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  }> {
    const correlationId = authLogger.generateCorrelationId();
    
    authLogger.debug('Getting onboarding stats', { correlationId });

    try {
      const result = await this.retryOperation(
        async () => {
          return await query(`
            SELECT 
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE onboarding_completed = true) as completed,
              COUNT(*) FILTER (WHERE onboarding_completed = false) as pending
            FROM users
          `);
        },
        'Get onboarding stats',
        correlationId
      );
      
      const row = result.rows[0];
      const total = parseInt(row.total);
      const completed = parseInt(row.completed);
      const pending = parseInt(row.pending);
      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      
      authLogger.debug('Onboarding stats retrieved', {
        correlationId,
        total,
        completed,
        pending,
        completionRate: completionRate.toFixed(2),
      });
      
      return {
        total,
        completed,
        pending,
        completionRate: Math.round(completionRate * 100) / 100,
      };
    } catch (error: any) {
      authLogger.error('Get onboarding stats failed', error, {
        correlationId,
      });
      throw error;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    correlationId: string
  ): Promise<T> {
    let lastError: Error;
    let delay = RETRY_CONFIG.initialDelay;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Check if retryable
        const errorType = mapDatabaseError(error);
        if (!isRetryable(errorType) || attempt === RETRY_CONFIG.maxAttempts) {
          throw error;
        }

        // Log retry
        authLogger.warn(
          `${operationName} attempt ${attempt} failed, retrying in ${delay}ms`,
          {
            correlationId,
            attempt,
            delay,
            error: error.message,
          }
        );

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Exponential backoff
        delay = Math.min(delay * RETRY_CONFIG.backoffFactor, RETRY_CONFIG.maxDelay);
      }
    }

    throw lastError!;
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService();
