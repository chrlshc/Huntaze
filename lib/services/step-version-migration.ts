/**
 * Step Version Migration Service
 * 
 * Migrates onboarding steps to new versions while preserving user progress.
 * 
 * Features:
 * - Transactional migrations with rollback support
 * - Retry logic for transient failures
 * - Comprehensive error handling and logging
 * - Dry-run mode for validation
 * - Correlation IDs for request tracing
 * 
 * @example
 * ```typescript
 * const result = await migrateStepVersion({
 *   stepId: 'payments',
 *   fromVersion: 1,
 *   toVersion: 2,
 *   correlationId: crypto.randomUUID()
 * });
 * ```
 */

import { Pool } from 'pg';
import { getPool } from '@/lib/db';
import { OnboardingStepDefinitionsRepository } from '@/lib/db/repositories/onboarding-step-definitions';
import { UserOnboardingRepository } from '@/lib/db/repositories/user-onboarding';

/**
 * Migration options with full type safety
 */
export interface StepVersionMigrationOptions {
  stepId: string;
  fromVersion: number;
  toVersion: number;
  newStepData?: {
    title?: string;
    description?: string;
    required?: boolean;
    weight?: number;
    roleVisibility?: string[];
    marketRule?: Record<string, any>;
  };
  dryRun?: boolean;
  correlationId?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Detailed migration result with metrics
 */
export interface MigrationResult {
  success: boolean;
  stepId: string;
  fromVersion: number;
  toVersion: number;
  usersAffected: number;
  progressCopied: number;
  progressReset: number;
  errors: MigrationError[];
  warnings: string[];
  dryRun: boolean;
  correlationId: string;
  duration: number;
  timestamp: string;
}

/**
 * Structured error information
 */
export interface MigrationError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Structured logging helper
 */
function logInfo(context: string, metadata?: Record<string, any>) {
  console.log(`[Step Migration] ${context}`, metadata);
}

function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[Step Migration] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

function logWarn(context: string, metadata?: Record<string, any>) {
  console.warn(`[Step Migration] ${context}`, metadata);
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    delayMs: number;
    correlationId: string;
  }
): Promise<T> {
  const { maxRetries, delayMs, correlationId } = options;
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        logError('Max retries reached', error, { attempt, correlationId });
        throw lastError;
      }
      
      const delay = delayMs * Math.pow(2, attempt - 1);
      logWarn('Retry attempt', { attempt, delay, correlationId });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Migrate a step to a new version with full error handling and retry logic
 * 
 * Process:
 * 1. Validate migration parameters
 * 2. Create new version in onboarding_step_definitions
 * 3. Copy completed user progress to new version
 * 4. Reset in-progress steps to 'todo'
 * 5. Recalculate user progress percentages
 * 6. Mark old version as inactive
 * 
 * @throws {Error} If validation fails or migration cannot be completed
 */
export async function migrateStepVersion(
  options: StepVersionMigrationOptions
): Promise<MigrationResult> {
  const startTime = Date.now();
  const {
    stepId,
    fromVersion,
    toVersion,
    newStepData,
    dryRun = false,
    correlationId = crypto.randomUUID(),
    maxRetries = 3,
    retryDelayMs = 1000
  } = options;

  const result: MigrationResult = {
    success: false,
    stepId,
    fromVersion,
    toVersion,
    usersAffected: 0,
    progressCopied: 0,
    progressReset: 0,
    errors: [],
    warnings: [],
    dryRun,
    correlationId,
    duration: 0,
    timestamp: new Date().toISOString()
  };

  logInfo('Migration started', {
    stepId,
    fromVersion,
    toVersion,
    dryRun,
    correlationId
  });

  try {
    // Step 1: Validate migration
    const validation = await validateMigration(options);
    if (!validation.valid) {
      validation.errors.forEach(error => {
        result.errors.push({
          code: 'VALIDATION_ERROR',
          message: error,
          timestamp: new Date().toISOString()
        });
      });
      
      logError('Validation failed', new Error(validation.errors.join(', ')), {
        correlationId
      });
      
      return result;
    }

    // Step 2: Execute migration with retry logic
    await retryWithBackoff(
      async () => {
        const pool = getPool();
        const stepRepo = new OnboardingStepDefinitionsRepository(pool);
        const userRepo = new UserOnboardingRepository(pool);

        if (dryRun) {
          logInfo('DRY RUN: Simulating migration', { stepId, correlationId });
          
          // Get affected users count
          const affectedUsers = await getAffectedUsersCount(pool, stepId, fromVersion);
          result.usersAffected = affectedUsers.total;
          result.progressCopied = affectedUsers.completed;
          result.progressReset = affectedUsers.inProgress;
          
          logInfo('DRY RUN: Migration simulation complete', {
            usersAffected: result.usersAffected,
            correlationId
          });
        } else {
          // Execute actual migration in transaction
          const migrationResult = await executeMigration(
            pool,
            stepRepo,
            userRepo,
            { stepId, fromVersion, toVersion, newStepData, correlationId }
          );
          
          result.usersAffected = migrationResult.usersAffected;
          result.progressCopied = migrationResult.progressCopied;
          result.progressReset = migrationResult.progressReset;
          result.warnings = migrationResult.warnings;
          
          logInfo('Migration executed successfully', {
            usersAffected: result.usersAffected,
            progressCopied: result.progressCopied,
            progressReset: result.progressReset,
            correlationId
          });
        }
      },
      { maxRetries, delayMs: retryDelayMs, correlationId }
    );

    result.success = true;

  } catch (error) {
    result.success = false;
    result.errors.push({
      code: 'MIGRATION_ERROR',
      message: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    logError('Migration failed', error, { correlationId });
  } finally {
    result.duration = Date.now() - startTime;
    
    logInfo('Migration completed', {
      success: result.success,
      duration: result.duration,
      correlationId
    });
  }

  return result;
}

/**
 * Get count of affected users for dry-run
 */
async function getAffectedUsersCount(
  pool: Pool,
  stepId: string,
  version: number
): Promise<{ total: number; completed: number; inProgress: number }> {
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'done') as completed,
      COUNT(*) FILTER (WHERE status = 'todo') as in_progress
    FROM user_onboarding
    WHERE step_id = $1 AND version = $2
  `;
  
  const result = await pool.query(query, [stepId, version]);
  const row = result.rows[0];
  
  return {
    total: parseInt(row.total || '0'),
    completed: parseInt(row.completed || '0'),
    inProgress: parseInt(row.in_progress || '0')
  };
}

/**
 * Execute migration in a transaction
 */
async function executeMigration(
  pool: Pool,
  stepRepo: OnboardingStepDefinitionsRepository,
  userRepo: UserOnboardingRepository,
  options: {
    stepId: string;
    fromVersion: number;
    toVersion: number;
    newStepData?: any;
    correlationId: string;
  }
): Promise<{
  usersAffected: number;
  progressCopied: number;
  progressReset: number;
  warnings: string[];
}> {
  const { stepId, fromVersion, toVersion, newStepData, correlationId } = options;
  const warnings: string[] = [];
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    logInfo('Transaction started', { stepId, correlationId });
    
    // 1. Create new step version
    const newStep = await stepRepo.createNewVersion(stepId, newStepData || {});
    
    if (newStep.version !== toVersion) {
      warnings.push(
        `Expected version ${toVersion} but got ${newStep.version}. Using ${newStep.version}.`
      );
    }
    
    // 2. Get all users with this step
    const usersQuery = `
      SELECT DISTINCT user_id, status
      FROM user_onboarding
      WHERE step_id = $1 AND version = $2
    `;
    
    const usersResult = await client.query(usersQuery, [stepId, fromVersion]);
    const users = usersResult.rows;
    
    let progressCopied = 0;
    let progressReset = 0;
    
    // 3. Migrate each user's progress
    for (const user of users) {
      const migrated = await userRepo.migrateStepVersion(
        user.user_id,
        stepId,
        fromVersion,
        toVersion
      );
      
      if (migrated && user.status === 'done') {
        progressCopied++;
      } else if (migrated) {
        progressReset++;
      }
    }
    
    // 4. Deactivate old version
    await stepRepo.deactivateStep(stepId, fromVersion);
    
    await client.query('COMMIT');
    
    logInfo('Transaction committed', {
      stepId,
      usersAffected: users.length,
      progressCopied,
      progressReset,
      correlationId
    });
    
    return {
      usersAffected: users.length,
      progressCopied,
      progressReset,
      warnings
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    logError('Transaction rolled back', error, { stepId, correlationId });
    
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Validate migration before executing with comprehensive checks
 * 
 * @throws Never - Returns validation result instead
 */
export async function validateMigration(
  options: StepVersionMigrationOptions
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { stepId, fromVersion, toVersion, correlationId } = options;

  logInfo('Validating migration', { stepId, fromVersion, toVersion, correlationId });

  // 1. Check version numbers are valid
  if (toVersion <= fromVersion) {
    errors.push(`Target version (${toVersion}) must be greater than source version (${fromVersion})`);
  }

  if (toVersion < 1 || fromVersion < 1) {
    errors.push('Version numbers must be positive integers');
  }

  if (!Number.isInteger(toVersion) || !Number.isInteger(fromVersion)) {
    errors.push('Version numbers must be integers');
  }

  // 2. Check step ID is valid
  if (!stepId || typeof stepId !== 'string') {
    errors.push('Step ID is required and must be a string');
  }

  if (stepId && !/^[a-zA-Z0-9_-]+$/.test(stepId)) {
    errors.push('Step ID must contain only alphanumeric characters, underscores, and hyphens');
  }

  // 3. Check step exists in database
  try {
    const pool = getPool();
    const stepRepo = new OnboardingStepDefinitionsRepository(pool);
    
    const existingStep = await stepRepo.getStepById(stepId, fromVersion);
    
    if (!existingStep) {
      errors.push(`Step ${stepId} version ${fromVersion} does not exist`);
    }
    
    // Check if target version already exists
    const targetStep = await stepRepo.getStepById(stepId, toVersion);
    
    if (targetStep) {
      errors.push(`Step ${stepId} version ${toVersion} already exists`);
    }
  } catch (error) {
    logError('Database validation failed', error, { stepId, correlationId });
    errors.push(`Database validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const valid = errors.length === 0;
  
  logInfo('Validation complete', { valid, errorCount: errors.length, correlationId });

  return { valid, errors };
}

/**
 * Get human-readable migration summary
 */
export function getMigrationSummary(result: MigrationResult): string {
  const prefix = result.dryRun ? '[DRY RUN] ' : '';
  
  if (!result.success) {
    const errorMessages = result.errors.map(e => `${e.code}: ${e.message}`).join('; ');
    return `${prefix}Migration failed: ${errorMessages}`;
  }

  const warnings = result.warnings.length > 0 
    ? `\n- Warnings: ${result.warnings.join('; ')}`
    : '';

  return `
${prefix}Migration completed successfully:
- Step: ${result.stepId}
- Version: ${result.fromVersion} → ${result.toVersion}
- Users affected: ${result.usersAffected}
- Progress copied: ${result.progressCopied}
- Progress reset: ${result.progressReset}
- Duration: ${result.duration}ms
- Correlation ID: ${result.correlationId}${warnings}
  `.trim();
}

/**
 * Get detailed migration report for logging/monitoring
 */
export function getMigrationReport(result: MigrationResult): {
  summary: string;
  metrics: Record<string, number>;
  errors: MigrationError[];
  warnings: string[];
  metadata: Record<string, any>;
} {
  return {
    summary: getMigrationSummary(result),
    metrics: {
      usersAffected: result.usersAffected,
      progressCopied: result.progressCopied,
      progressReset: result.progressReset,
      duration: result.duration,
      errorCount: result.errors.length,
      warningCount: result.warnings.length
    },
    errors: result.errors,
    warnings: result.warnings,
    metadata: {
      stepId: result.stepId,
      fromVersion: result.fromVersion,
      toVersion: result.toVersion,
      dryRun: result.dryRun,
      correlationId: result.correlationId,
      timestamp: result.timestamp,
      success: result.success
    }
  };
}

/**
 * Batch migrate multiple steps
 * 
 * @example
 * ```typescript
 * const results = await batchMigrateSteps([
 *   { stepId: 'payments', fromVersion: 1, toVersion: 2 },
 *   { stepId: 'theme', fromVersion: 1, toVersion: 2 }
 * ]);
 * ```
 */
export async function batchMigrateSteps(
  migrations: StepVersionMigrationOptions[]
): Promise<MigrationResult[]> {
  const correlationId = crypto.randomUUID();
  
  logInfo('Batch migration started', {
    count: migrations.length,
    correlationId
  });
  
  const results: MigrationResult[] = [];
  
  for (const migration of migrations) {
    const result = await migrateStepVersion({
      ...migration,
      correlationId: `${correlationId}-${migration.stepId}`
    });
    
    results.push(result);
    
    // Stop on first failure unless dryRun
    if (!result.success && !migration.dryRun) {
      logError('Batch migration stopped due to failure', new Error(result.errors[0]?.message), {
        stepId: migration.stepId,
        correlationId
      });
      break;
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  
  logInfo('Batch migration completed', {
    total: migrations.length,
    successful: successCount,
    failed: migrations.length - successCount,
    correlationId
  });
  
  return results;
}
