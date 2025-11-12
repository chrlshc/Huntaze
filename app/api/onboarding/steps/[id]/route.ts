import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getPool } from '@/lib/db';
import { OnboardingStepDefinitionsRepository } from '@/lib/db/repositories/onboarding-step-definitions';
import { UserOnboardingRepository, StepStatus } from '@/lib/db/repositories/user-onboarding';
import { invalidateUserOnboardingCache } from '../../route';
import { trackStepCompleted, trackStepSkipped } from '@/lib/services/onboarding-analytics';

export const runtime = 'nodejs';

/**
 * TypeScript types for API requests/responses
 */
export interface UpdateStepRequest {
  status: 'done' | 'skipped';
  snoozeUntil?: string;
}

export interface UpdateStepResponse {
  success: boolean;
  step: {
    id: string;
    status: StepStatus;
    updatedAt: string;
  };
  progress: number;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  correlationId?: string;
}

/**
 * Structured logging helper
 */
function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[Onboarding Steps API] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

function logInfo(context: string, metadata?: Record<string, any>) {
  console.log(`[Onboarding Steps API] ${context}`, metadata);
}

/**
 * PATCH /api/onboarding/steps/:id
 * 
 * Updates the status of a specific onboarding step.
 * 
 * Request Body:
 * {
 *   status: "done" | "skipped",
 *   snoozeUntil?: "2025-11-17T00:00:00Z"
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   step: {
 *     id: "theme",
 *     status: "skipped",
 *     updatedAt: "2025-11-11T10:15:00Z"
 *   },
 *   progress: 60
 * }
 * 
 * Error Responses:
 * - 400 Bad Request: Invalid status or attempting to skip a required step
 * - 404 Not Found: Step ID doesn't exist
 * - 403 Forbidden: User doesn't have permission
 */
async function patchHandler(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<UpdateStepResponse | ErrorResponse>> {
  const correlationId = crypto.randomUUID();
  
  try {
    const user = await requireUser();
    const stepId = params.id;
    
    // Parse and validate request body
    let body: UpdateStepRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      logError('Invalid JSON in request body', parseError, { userId: user.id, stepId, correlationId });
      return NextResponse.json(
        { error: 'Invalid JSON in request body', correlationId },
        { status: 400 }
      );
    }
    
    const { status, snoozeUntil } = body;
    
    // Validate required fields
    if (!status || !['done', 'skipped'].includes(status)) {
      logInfo('Invalid status parameter', { userId: user.id, stepId, status, correlationId });
      return NextResponse.json(
        { error: 'status must be either "done" or "skipped"', correlationId },
        { status: 400 }
      );
    }
    
    // Validate step ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(stepId)) {
      logInfo('Invalid step ID format', { userId: user.id, stepId, correlationId });
      return NextResponse.json(
        { error: 'Invalid step ID format', correlationId },
        { status: 400 }
      );
    }
    
    logInfo('PATCH request', { userId: user.id, stepId, status, correlationId });
    
    const pool = getPool();
    const stepDefinitionsRepo = new OnboardingStepDefinitionsRepository(pool);
    const userOnboardingRepo = new UserOnboardingRepository(pool);
    
    // Check if step exists and is active
    const stepDefinition = await stepDefinitionsRepo.getStepById(stepId);
    
    if (!stepDefinition) {
      logInfo('Step not found', { userId: user.id, stepId, correlationId });
      return NextResponse.json(
        { error: 'Step not found', correlationId },
        { status: 404 }
      );
    }
    
    // Check if step is currently active
    const now = new Date();
    const isActive = 
      (!stepDefinition.activeFrom || stepDefinition.activeFrom <= now) &&
      (!stepDefinition.activeTo || stepDefinition.activeTo >= now);
    
    if (!isActive) {
      logInfo('Step is not active', { userId: user.id, stepId, correlationId });
      return NextResponse.json(
        { error: 'Step is not currently active', correlationId },
        { status: 400 }
      );
    }
    
    // Check if user has permission (role-based)
    const userRole = 'owner'; // Default to owner for now
    const hasPermission = stepDefinition.roleVisibility.includes(userRole);
    
    if (!hasPermission) {
      logInfo('User lacks permission', { userId: user.id, stepId, userRole, correlationId });
      return NextResponse.json(
        { 
          error: 'You do not have permission to update this step',
          details: `This step requires ${stepDefinition.roleVisibility[0]} role`,
          correlationId 
        },
        { status: 403 }
      );
    }
    
    // Prevent skipping required steps
    if (status === 'skipped' && stepDefinition.required) {
      logInfo('Attempted to skip required step', { userId: user.id, stepId, correlationId });
      return NextResponse.json(
        { 
          error: 'Cannot skip required steps',
          details: 'This step must be completed before proceeding',
          correlationId 
        },
        { status: 400 }
      );
    }
    
    // Parse snoozeUntil if provided
    let snoozeUntilDate: Date | undefined;
    if (snoozeUntil) {
      try {
        snoozeUntilDate = new Date(snoozeUntil);
        if (isNaN(snoozeUntilDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (dateError) {
        logInfo('Invalid snoozeUntil date', { userId: user.id, stepId, snoozeUntil, correlationId });
        return NextResponse.json(
          { error: 'Invalid snoozeUntil date format', correlationId },
          { status: 400 }
        );
      }
    }
    
    // Update step status
    const updatedStep = await userOnboardingRepo.updateStepStatus(
      user.id,
      stepId,
      stepDefinition.version,
      {
        status,
        completedBy: user.id,
        snoozeUntil: snoozeUntilDate
      }
    );
    
    // Track analytics event
    if (status === 'done') {
      await trackStepCompleted(
        user.id,
        stepId,
        0, // Duration not tracked here
        {
          correlationId,
          version: stepDefinition.version,
          previousStatus: updatedStep.status
        }
      );
    } else if (status === 'skipped') {
      await trackStepSkipped(
        user.id,
        stepId,
        undefined, // Reason not provided
        {
          correlationId,
          version: stepDefinition.version,
          previousStatus: updatedStep.status
        }
      );
    }
    
    // Recalculate progress
    const progress = await userOnboardingRepo.calculateProgress(user.id);
    
    // Invalidate cache
    try {
      await invalidateUserOnboardingCache(user.id);
      logInfo('Cache invalidated after update', { userId: user.id, correlationId });
    } catch (cacheError) {
      // Log but don't fail the request
      logError('Cache invalidation error', cacheError, { userId: user.id, correlationId });
    }
    
    logInfo('PATCH request completed', { 
      userId: user.id, 
      stepId, 
      status,
      progress,
      correlationId 
    });
    
    return NextResponse.json({
      success: true,
      step: {
        id: stepId,
        status: updatedStep.status,
        updatedAt: updatedStep.updatedAt.toISOString()
      },
      progress
    });
    
  } catch (error) {
    logError('PATCH request failed', error, { correlationId });
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized', correlationId },
          { status: 401 }
        );
      }
      
      if (error.message.includes('Invalid status transition')) {
        return NextResponse.json(
          { error: error.message, correlationId },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update step status',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId 
      },
      { status: 500 }
    );
  }
}

export const PATCH = patchHandler as any;
