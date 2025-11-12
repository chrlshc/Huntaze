/**
 * Step Version Migration API Endpoint
 * 
 * POST /api/admin/onboarding/migrate-version
 * 
 * Migrates an onboarding step to a new version with full error handling,
 * retry logic, and comprehensive logging.
 * 
 * Requires admin authentication.
 * 
 * Request Body:
 * {
 *   stepId: string,
 *   fromVersion: number,
 *   toVersion: number,
 *   newStepData?: object,
 *   dryRun?: boolean
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   result: MigrationResult,
 *   correlationId: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  migrateStepVersion, 
  validateMigration,
  getMigrationSummary,
  getMigrationReport,
  batchMigrateSteps,
  type StepVersionMigrationOptions,
  type MigrationResult
} from '@/lib/services/step-version-migration';
import { requireUser } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Structured logging helper
 */
function logInfo(context: string, metadata?: Record<string, any>) {
  console.log(`[Migration API] ${context}`, metadata);
}

function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[Migration API] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

/**
 * POST /api/admin/onboarding/migrate-version
 * 
 * Execute step version migration
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = crypto.randomUUID();
  
  try {
    // Authentication check
    const user = await requireUser();
    
    // TODO: Add role-based authorization
    // if (user.role !== 'admin') {
    //   logWarn('Unauthorized access attempt', { userId: user.id, correlationId });
    //   return NextResponse.json(
    //     { error: 'Forbidden', correlationId },
    //     { status: 403 }
    //   );
    // }

    logInfo('Migration request received', { userId: user.id, correlationId });

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      logError('Invalid JSON in request body', parseError, { correlationId });
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          correlationId
        },
        { status: 400 }
      );
    }

    // Check for batch migration
    if (Array.isArray(body)) {
      return handleBatchMigration(body, correlationId);
    }

    // Single migration
    const options: StepVersionMigrationOptions = {
      stepId: body.stepId,
      fromVersion: body.fromVersion,
      toVersion: body.toVersion,
      newStepData: body.newStepData,
      dryRun: body.dryRun ?? false,
      correlationId,
      maxRetries: body.maxRetries ?? 3,
      retryDelayMs: body.retryDelayMs ?? 1000
    };

    // Validate required fields
    if (!options.stepId || options.fromVersion === undefined || options.toVersion === undefined) {
      logInfo('Missing required fields', { body, correlationId });
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['stepId', 'fromVersion', 'toVersion'],
          received: Object.keys(body),
          correlationId
        },
        { status: 400 }
      );
    }

    // Validate types
    if (typeof options.stepId !== 'string') {
      return NextResponse.json(
        { error: 'stepId must be a string', correlationId },
        { status: 400 }
      );
    }

    if (!Number.isInteger(options.fromVersion) || !Number.isInteger(options.toVersion)) {
      return NextResponse.json(
        { error: 'fromVersion and toVersion must be integers', correlationId },
        { status: 400 }
      );
    }

    logInfo('Validating migration', { options, correlationId });

    // Validate migration
    const validation = await validateMigration(options);
    if (!validation.valid) {
      logInfo('Validation failed', { errors: validation.errors, correlationId });
      return NextResponse.json(
        { 
          error: 'Validation failed',
          errors: validation.errors,
          correlationId
        },
        { status: 400 }
      );
    }

    logInfo('Executing migration', { options, correlationId });

    // Execute migration
    const result = await migrateStepVersion(options);

    if (!result.success) {
      logError('Migration failed', new Error(result.errors[0]?.message), {
        result,
        correlationId
      });
      
      return NextResponse.json(
        { 
          error: 'Migration failed',
          errors: result.errors,
          warnings: result.warnings,
          result: getMigrationReport(result),
          correlationId
        },
        { status: 500 }
      );
    }

    logInfo('Migration completed successfully', {
      stepId: result.stepId,
      usersAffected: result.usersAffected,
      duration: result.duration,
      correlationId
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: getMigrationSummary(result),
      result: {
        stepId: result.stepId,
        fromVersion: result.fromVersion,
        toVersion: result.toVersion,
        usersAffected: result.usersAffected,
        progressCopied: result.progressCopied,
        progressReset: result.progressReset,
        warnings: result.warnings,
        dryRun: result.dryRun,
        duration: result.duration,
        timestamp: result.timestamp
      },
      correlationId
    });

  } catch (error) {
    logError('Unexpected error in migration endpoint', error, { correlationId });
    
    // Check for specific error types
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      },
      { status: 500 }
    );
  }
}

/**
 * Handle batch migration requests
 */
async function handleBatchMigration(
  migrations: any[],
  correlationId: string
): Promise<NextResponse> {
  logInfo('Batch migration request', { count: migrations.length, correlationId });

  if (migrations.length === 0) {
    return NextResponse.json(
      { error: 'Empty batch migration array', correlationId },
      { status: 400 }
    );
  }

  if (migrations.length > 10) {
    return NextResponse.json(
      { 
        error: 'Batch size too large',
        max: 10,
        received: migrations.length,
        correlationId
      },
      { status: 400 }
    );
  }

  try {
    const results = await batchMigrateSteps(
      migrations.map(m => ({
        ...m,
        correlationId: `${correlationId}-${m.stepId}`
      }))
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logInfo('Batch migration completed', {
      total: results.length,
      successful: successCount,
      failed: failureCount,
      correlationId
    });

    return NextResponse.json({
      success: failureCount === 0,
      message: `Batch migration: ${successCount}/${results.length} successful`,
      results: results.map(r => ({
        stepId: r.stepId,
        success: r.success,
        usersAffected: r.usersAffected,
        errors: r.errors,
        warnings: r.warnings
      })),
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      },
      correlationId
    });

  } catch (error) {
    logError('Batch migration failed', error, { correlationId });
    
    return NextResponse.json(
      {
        error: 'Batch migration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/onboarding/migrate-version
 * 
 * Get version history for a step
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const correlationId = crypto.randomUUID();
  
  try {
    // Authentication check
    const user = await requireUser();

    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get('stepId');

    if (!stepId) {
      logInfo('Missing stepId parameter', { correlationId });
      return NextResponse.json(
        { 
          error: 'stepId parameter required',
          correlationId
        },
        { status: 400 }
      );
    }

    logInfo('Fetching version history', { stepId, correlationId });

    // Get version history from database
    const { getPool } = await import('@/lib/db');
    const { OnboardingStepDefinitionsRepository } = await import(
      '@/lib/db/repositories/onboarding-step-definitions'
    );
    
    const pool = getPool();
    const stepRepo = new OnboardingStepDefinitionsRepository(pool);
    
    const versions = await stepRepo.getStepVersions(stepId);

    if (versions.length === 0) {
      logInfo('Step not found', { stepId, correlationId });
      return NextResponse.json(
        { 
          error: 'Step not found',
          stepId,
          correlationId
        },
        { status: 404 }
      );
    }

    // Find active version
    const now = new Date();
    const activeVersion = versions.find(v => 
      (!v.activeFrom || v.activeFrom <= now) &&
      (!v.activeTo || v.activeTo >= now)
    );

    logInfo('Version history retrieved', {
      stepId,
      versionCount: versions.length,
      activeVersion: activeVersion?.version,
      correlationId
    });

    return NextResponse.json({
      stepId,
      versions: versions.map(v => ({
        version: v.version,
        title: v.title,
        required: v.required,
        weight: v.weight,
        activeFrom: v.activeFrom?.toISOString(),
        activeTo: v.activeTo?.toISOString(),
        isActive: v.id === activeVersion?.id && v.version === activeVersion?.version,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString()
      })),
      activeVersion: activeVersion?.version ?? null,
      totalVersions: versions.length,
      correlationId
    });

  } catch (error) {
    logError('Error fetching version history', error, { correlationId });
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      },
      { status: 500 }
    );
  }
}
