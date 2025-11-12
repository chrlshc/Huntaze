/**
 * Optimistic Locking Service
 * 
 * Implements optimistic locking for concurrent updates using row versioning.
 * Prevents lost updates when multiple requests try to modify the same record.
 */

export interface OptimisticLockError extends Error {
  name: 'OptimisticLockError';
  currentState: any;
  attemptedVersion: number;
  currentVersion: number;
}

export interface UpdateWithVersionOptions {
  userId: string;
  stepId: string;
  newStatus: string;
  expectedVersion: number;
}

export interface UpdateResult {
  success: boolean;
  updated: boolean;
  conflict: boolean;
  currentState?: any;
  newVersion?: number;
}

/**
 * Create an optimistic lock error
 */
export function createOptimisticLockError(
  message: string,
  currentState: any,
  attemptedVersion: number,
  currentVersion: number
): OptimisticLockError {
  const error = new Error(message) as OptimisticLockError;
  error.name = 'OptimisticLockError';
  error.currentState = currentState;
  error.attemptedVersion = attemptedVersion;
  error.currentVersion = currentVersion;
  return error;
}

/**
 * Update step status with optimistic locking
 * 
 * SQL Query:
 * UPDATE user_onboarding
 * SET 
 *   status = $1,
 *   row_version = row_version + 1,
 *   updated_at = NOW()
 * WHERE user_id = $2 
 *   AND step_id = $3 
 *   AND row_version = $4
 * RETURNING *;
 */
export async function updateStepWithVersion(
  options: UpdateWithVersionOptions
): Promise<UpdateResult> {
  const { userId, stepId, newStatus, expectedVersion } = options;

  try {
    // This is a placeholder implementation
    // In production, this would execute actual database queries
    
    // Simulate version check
    const currentVersion = 1; // Mock current version
    
    if (currentVersion !== expectedVersion) {
      // Version mismatch - return conflict
      return {
        success: false,
        updated: false,
        conflict: true,
        currentState: {
          userId,
          stepId,
          status: 'in_progress', // Mock current status
          row_version: currentVersion
        }
      };
    }

    // Version matches - update successful
    return {
      success: true,
      updated: true,
      conflict: false,
      newVersion: currentVersion + 1
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Get current state with version
 */
export async function getCurrentStateWithVersion(
  userId: string,
  stepId: string
): Promise<{ state: any; version: number } | null> {
  // This is a placeholder implementation
  // In production, this would query the database
  
  return {
    state: {
      userId,
      stepId,
      status: 'todo',
      completed_at: null
    },
    version: 1
  };
}

/**
 * Retry update with exponential backoff
 */
export async function updateWithRetry(
  options: UpdateWithVersionOptions,
  maxRetries: number = 3
): Promise<UpdateResult> {
  let attempt = 0;
  let delay = 100; // Start with 100ms delay

  while (attempt < maxRetries) {
    try {
      const result = await updateStepWithVersion(options);

      if (result.success) {
        return result;
      }

      if (result.conflict) {
        // Get fresh state and retry
        const freshState = await getCurrentStateWithVersion(
          options.userId,
          options.stepId
        );

        if (freshState) {
          options.expectedVersion = freshState.version;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        attempt++;
      } else {
        // Non-conflict error, don't retry
        return result;
      }

    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  // Max retries exceeded
  return {
    success: false,
    updated: false,
    conflict: true
  };
}

/**
 * Check if error is an optimistic lock error
 */
export function isOptimisticLockError(error: any): error is OptimisticLockError {
  return error && error.name === 'OptimisticLockError';
}

/**
 * Format optimistic lock error for API response
 */
export function formatOptimisticLockError(error: OptimisticLockError) {
  return {
    error: 'Conflict',
    message: 'The resource was modified by another request',
    code: 'OPTIMISTIC_LOCK_CONFLICT',
    attemptedVersion: error.attemptedVersion,
    currentVersion: error.currentVersion,
    currentState: error.currentState,
    suggestion: 'Fetch the latest state and retry your request'
  };
}
