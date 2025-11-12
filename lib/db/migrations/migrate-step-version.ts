/**
 * Step Version Migration
 * 
 * Migrates onboarding steps to a new version while preserving user progress.
 * This allows updating step definitions without losing user data.
 * 
 * Process:
 * 1. Create new version in onboarding_step_definitions
 * 2. Copy completed user progress to new version
 * 3. Reset in-progress steps to 'todo'
 * 4. Recalculate user progress percentages
 * 5. Mark old version as inactive
 */

// Database client interface
interface DbClient {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
}

// Initialize with a function to get the db client
function getDbClient(): DbClient {
  // In production, this would import from the actual connection
  // For now, we'll use a placeholder that throws an error
  return {
    query: async () => {
      throw new Error('Database client not initialized');
    }
  };
}

const dbClient = getDbClient();

export interface StepVersionMigrationOptions {
  stepId: string;
  fromVersion: number;
  toVersion: number;
  newStepData?: Partial<StepDefinition>;
  dryRun?: boolean;
}

export interface StepDefinition {
  id: string;
  version: number;
  title: string;
  description: string;
  market: string;
  role: string;
  weight: number;
  required: boolean;
  active_from: Date;
  active_to?: Date;
}

export interface MigrationResult {
  success: boolean;
  stepId: string;
  fromVersion: number;
  toVersion: number;
  usersAffected: number;
  progressCopied: number;
  progressReset: number;
  errors: string[];
  dryRun: boolean;
}

/**
 * Migrate a step to a new version
 */
export async function migrateStepVersion(
  options: StepVersionMigrationOptions
): Promise<MigrationResult> {
  const { stepId, fromVersion, toVersion, newStepData, dryRun = false } = options;

  const result: MigrationResult = {
    success: false,
    stepId,
    fromVersion,
    toVersion,
    usersAffected: 0,
    progressCopied: 0,
    progressReset: 0,
    errors: [],
    dryRun
  };

  try {
    // Start transaction
    await dbClient.query('BEGIN');

    // Step 1: Verify old version exists
    const oldVersionCheck = await dbClient.query(
      `SELECT * FROM onboarding_step_definitions 
       WHERE id = $1 AND version = $2 AND active_to IS NULL`,
      [stepId, fromVersion]
    );

    if (oldVersionCheck.rows.length === 0) {
      throw new Error(`Step ${stepId} version ${fromVersion} not found or already inactive`);
    }

    const oldStep = oldVersionCheck.rows[0];

    // Step 2: Check if new version already exists
    const newVersionCheck = await db.query(
      `SELECT * FROM onboarding_step_definitions 
       WHERE id = $1 AND version = $2`,
      [stepId, toVersion]
    );

    if (newVersionCheck.rows.length > 0) {
      throw new Error(`Step ${stepId} version ${toVersion} already exists`);
    }

    // Step 3: Create new version in step_definitions
    const newStep = {
      ...oldStep,
      ...newStepData,
      version: toVersion,
      active_from: new Date(),
      active_to: null
    };

    if (!dryRun) {
      await db.query(
        `INSERT INTO onboarding_step_definitions 
         (id, version, title, description, market, role, weight, required, active_from, active_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newStep.id,
          newStep.version,
          newStep.title,
          newStep.description,
          newStep.market,
          newStep.role,
          newStep.weight,
          newStep.required,
          newStep.active_from,
          newStep.active_to
        ]
      );
    }

    // Step 4: Get all users with progress on this step
    const usersWithProgress = await db.query(
      `SELECT user_id, status, completed_at, row_version
       FROM user_onboarding
       WHERE step_id = $1 AND step_version = $2`,
      [stepId, fromVersion]
    );

    result.usersAffected = usersWithProgress.rows.length;

    // Step 5: Copy completed progress to new version
    for (const userProgress of usersWithProgress.rows) {
      if (userProgress.status === 'done' || userProgress.status === 'skipped') {
        // Copy completed/skipped progress to new version
        if (!dryRun) {
          await db.query(
            `INSERT INTO user_onboarding 
             (user_id, step_id, step_version, status, completed_at, row_version)
             VALUES ($1, $2, $3, $4, $5, 1)
             ON CONFLICT (user_id, step_id, step_version) DO NOTHING`,
            [
              userProgress.user_id,
              stepId,
              toVersion,
              userProgress.status,
              userProgress.completed_at
            ]
          );
        }
        result.progressCopied++;
      } else {
        // Reset in-progress steps to 'todo'
        if (!dryRun) {
          await db.query(
            `INSERT INTO user_onboarding 
             (user_id, step_id, step_version, status, row_version)
             VALUES ($1, $2, $3, 'todo', 1)
             ON CONFLICT (user_id, step_id, step_version) DO NOTHING`,
            [userProgress.user_id, stepId, toVersion]
          );
        }
        result.progressReset++;
      }
    }

    // Step 6: Recalculate progress for all affected users
    if (!dryRun) {
      const affectedUsers = usersWithProgress.rows.map(row => row.user_id);
      
      for (const userId of affectedUsers) {
        await db.query(
          `SELECT calculate_onboarding_progress($1, $2)`,
          [userId, oldStep.market]
        );
      }
    }

    // Step 7: Mark old version as inactive
    if (!dryRun) {
      await db.query(
        `UPDATE onboarding_step_definitions
         SET active_to = NOW()
         WHERE id = $1 AND version = $2`,
        [stepId, fromVersion]
      );
    }

    // Commit transaction
    if (!dryRun) {
      await db.query('COMMIT');
    } else {
      await db.query('ROLLBACK');
    }

    result.success = true;

  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Migrate multiple steps to new versions
 */
export async function migrateBatchStepVersions(
  migrations: StepVersionMigrationOptions[]
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const migration of migrations) {
    const result = await migrateStepVersion(migration);
    results.push(result);

    // Stop on first error
    if (!result.success) {
      break;
    }
  }

  return results;
}

/**
 * Get version migration history for a step
 */
export async function getStepVersionHistory(stepId: string): Promise<StepDefinition[]> {
  const result = await db.query(
    `SELECT * FROM onboarding_step_definitions
     WHERE id = $1
     ORDER BY version DESC`,
    [stepId]
  );

  return result.rows;
}

/**
 * Get active version for a step
 */
export async function getActiveStepVersion(stepId: string): Promise<StepDefinition | null> {
  const result = await db.query(
    `SELECT * FROM onboarding_step_definitions
     WHERE id = $1 AND active_to IS NULL
     ORDER BY version DESC
     LIMIT 1`,
    [stepId]
  );

  return result.rows[0] || null;
}

/**
 * Validate migration before executing
 */
export async function validateMigration(
  options: StepVersionMigrationOptions
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check old version exists
  const oldVersion = await db.query(
    `SELECT * FROM onboarding_step_definitions 
     WHERE id = $1 AND version = $2`,
    [options.stepId, options.fromVersion]
  );

  if (oldVersion.rows.length === 0) {
    errors.push(`Source version ${options.fromVersion} does not exist`);
  }

  // Check new version doesn't exist
  const newVersion = await db.query(
    `SELECT * FROM onboarding_step_definitions 
     WHERE id = $1 AND version = $2`,
    [options.stepId, options.toVersion]
  );

  if (newVersion.rows.length > 0) {
    errors.push(`Target version ${options.toVersion} already exists`);
  }

  // Check version numbers are valid
  if (options.toVersion <= options.fromVersion) {
    errors.push('Target version must be greater than source version');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
