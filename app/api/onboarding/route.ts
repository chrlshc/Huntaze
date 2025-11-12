import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { saveOnboarding } from '@/lib/db/onboarding';
import { getPool } from '@/lib/db';
import { OnboardingStepDefinitionsRepository } from '@/lib/db/repositories/onboarding-step-definitions';
import { UserOnboardingRepository } from '@/lib/db/repositories/user-onboarding';
import { createRedisClient } from '@/lib/smart-onboarding/config/redis';

export const runtime = 'nodejs';

// Cache TTL: 5 minutes
const CACHE_TTL = 300;

// Redis client for caching
let redis: ReturnType<typeof createRedisClient> | null = null;

function getRedisClient() {
  if (!redis) {
    redis = createRedisClient();
  }
  return redis;
}

/**
 * TypeScript types for API responses
 */
export interface OnboardingStep {
  id: string;
  version: number;
  title: string;
  description?: string;
  required: boolean;
  weight: number;
  status: 'todo' | 'done' | 'skipped';
  completedAt?: string;
  roleRestricted?: string;
}

export interface OnboardingResponse {
  progress: number;
  steps: OnboardingStep[];
}

export interface OnboardingErrorResponse {
  error: string;
  details?: string;
  correlationId?: string;
}

/**
 * Invalidate user's onboarding cache
 */
export async function invalidateUserOnboardingCache(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const pattern = `onboarding:user:${userId}:market:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn('[Onboarding API] Cache invalidation error:', error);
  }
}

/**
 * Structured logging helper
 */
function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[Onboarding API] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

function logInfo(context: string, metadata?: Record<string, any>) {
  console.log(`[Onboarding API] ${context}`, metadata);
}

/**
 * GET /api/onboarding
 * 
 * Retrieves all onboarding steps with user progress, filtered by market and role.
 * 
 * Query Parameters:
 * - market (optional): ISO country code (e.g., 'FR', 'DE', 'US')
 * 
 * Response:
 * {
 *   progress: number,
 *   steps: Array<{
 *     id: string,
 *     version: number,
 *     title: string,
 *     description?: string,
 *     required: boolean,
 *     weight: number,
 *     status: 'todo' | 'done' | 'skipped',
 *     completedAt?: string,
 *     roleRestricted?: string
 *   }>
 * }
 */
async function getHandler(req: Request): Promise<NextResponse<OnboardingResponse | OnboardingErrorResponse>> {
  const correlationId = crypto.randomUUID();
  
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const market = searchParams.get('market') || undefined;
    
    // Validate market parameter if provided
    if (market && !/^[A-Z]{2}$/.test(market)) {
      logInfo('Invalid market parameter', { userId: user.id, market, correlationId });
      return NextResponse.json(
        { 
          error: 'Invalid market parameter. Must be a 2-letter ISO country code (e.g., FR, DE, US)',
          correlationId 
        },
        { status: 400 }
      );
    }
    
    logInfo('GET request', { userId: user.id, market, correlationId });
    
    // Try to get from cache first
    const cacheKey = `onboarding:user:${user.id}:market:${market || 'default'}`;
    
    try {
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        logInfo('Cache hit', { userId: user.id, cacheKey, correlationId });
        return NextResponse.json(JSON.parse(cached));
      }
      
      logInfo('Cache miss', { userId: user.id, cacheKey, correlationId });
    } catch (cacheError) {
      // Log cache error but continue with database query
      logError('Cache read error', cacheError, { userId: user.id, correlationId });
    }
    
    const pool = getPool();
    const stepDefinitionsRepo = new OnboardingStepDefinitionsRepository(pool);
    const userOnboardingRepo = new UserOnboardingRepository(pool);
    
    // Default to 'owner' role for now (can be extended later with user roles)
    const userRole = 'owner';
    
    // Get active steps filtered by market and user role
    const activeSteps = await stepDefinitionsRepo.getActiveSteps({
      market,
      role: userRole
    });
    
    logInfo('Fetched active steps', { 
      userId: user.id, 
      stepCount: activeSteps.length, 
      correlationId 
    });
    
    // Get user's progress for each step
    const userSteps = await userOnboardingRepo.getUserSteps(user.id);
    const userStepsMap = new Map(
      userSteps.map(step => [`${step.stepId}-${step.version}`, step])
    );
    
    // Calculate overall progress
    const progress = await userOnboardingRepo.calculateProgress(user.id, market);
    
    // Combine step definitions with user progress
    const steps: OnboardingStep[] = activeSteps.map(step => {
      const userStep = userStepsMap.get(`${step.id}-${step.version}`);
      
      // Check if step is role-restricted for this user
      const isRoleRestricted = step.roleVisibility.length > 0 && 
        !step.roleVisibility.includes(userRole);
      
      return {
        id: step.id,
        version: step.version,
        title: step.title,
        description: step.description,
        required: step.required,
        weight: step.weight,
        status: userStep?.status || 'todo',
        completedAt: userStep?.completedAt?.toISOString(),
        roleRestricted: isRoleRestricted ? step.roleVisibility[0] : undefined
      };
    });
    
    const response: OnboardingResponse = {
      progress,
      steps
    };
    
    // Cache the response
    try {
      const redis = getRedisClient();
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
      logInfo('Cached response', { userId: user.id, cacheKey, ttl: CACHE_TTL, correlationId });
    } catch (cacheError) {
      // Log cache error but don't fail the request
      logError('Cache write error', cacheError, { userId: user.id, correlationId });
    }
    
    logInfo('GET request completed', { 
      userId: user.id, 
      progress, 
      stepCount: steps.length,
      correlationId 
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    logError('GET request failed', error, { correlationId });
    
    // Check for specific error types
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch onboarding status',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding
 * 
 * Updates onboarding step data for the current user.
 * 
 * Request Body:
 * {
 *   step: string,      // Step identifier (required)
 *   data: object       // Step-specific data (optional)
 * }
 * 
 * Response:
 * {
 *   ok: boolean
 * }
 */
async function postHandler(req: Request): Promise<NextResponse<{ ok: boolean } | OnboardingErrorResponse>> {
  const correlationId = crypto.randomUUID();
  
  try {
    const user = await requireUser();
    
    // Parse and validate request body
    let body: { step?: string; data?: any };
    try {
      body = await req.json();
    } catch (parseError) {
      logError('Invalid JSON in request body', parseError, { userId: user.id, correlationId });
      return NextResponse.json(
        { error: 'Invalid JSON in request body', correlationId },
        { status: 400 }
      );
    }
    
    const { step, data } = body;
    
    // Validate required fields
    if (!step || typeof step !== 'string') {
      logInfo('Missing or invalid step parameter', { userId: user.id, step, correlationId });
      return NextResponse.json(
        { error: 'step parameter is required and must be a string', correlationId },
        { status: 400 }
      );
    }
    
    // Validate step format (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(step)) {
      logInfo('Invalid step format', { userId: user.id, step, correlationId });
      return NextResponse.json(
        { error: 'step must contain only alphanumeric characters, underscores, and hyphens', correlationId },
        { status: 400 }
      );
    }
    
    logInfo('POST request', { userId: user.id, step, correlationId });
    
    // Save onboarding data
    await saveOnboarding(user.id, step, data ?? {});
    
    // Invalidate cache after update
    try {
      await invalidateUserOnboardingCache(user.id);
      logInfo('Cache invalidated after update', { userId: user.id, correlationId });
    } catch (cacheError) {
      // Log but don't fail the request
      logError('Cache invalidation error', cacheError, { userId: user.id, correlationId });
    }
    
    logInfo('POST request completed', { userId: user.id, step, correlationId });
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    logError('POST request failed', error, { correlationId });
    
    // Check for specific error types
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to save onboarding data',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId 
      },
      { status: 500 }
    );
  }
}

export const GET = getHandler;
export const POST = postHandler;
