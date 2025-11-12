import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { UserOnboardingRepository } from '@/lib/db/repositories/user-onboarding';
import { requireUser } from '@/lib/server-auth';
import { trackGatingBlocked } from '@/lib/services/onboarding-analytics';

/**
 * Gating middleware response payload
 */
export interface GatingBlockedResponse {
  error: 'PRECONDITION_REQUIRED';
  message: string;
  missingStep: string;
  action: {
    type: 'open_modal' | 'redirect';
    modal?: string;
    url?: string;
    prefill?: Record<string, any>;
  };
  correlationId: string;
}

/**
 * Configuration for gating middleware
 */
export interface GatingConfig {
  requiredStep: string;
  message?: string;
  action?: GatingBlockedResponse['action'];
  isCritical?: boolean;
}

/**
 * Default messages for common steps
 */
const DEFAULT_MESSAGES: Record<string, string> = {
  email_verification: 'Vous devez vérifier votre email avant de continuer',
  payments: 'Vous devez configurer les paiements avant de publier votre boutique',
  theme: 'Vous devez configurer un thème avant de publier',
  product: 'Vous devez ajouter au moins un produit avant de publier'
};

/**
 * Default actions for common steps
 */
const DEFAULT_ACTIONS: Record<string, GatingBlockedResponse['action']> = {
  email_verification: {
    type: 'open_modal',
    modal: 'email_verification'
  },
  payments: {
    type: 'open_modal',
    modal: 'payments_setup',
    prefill: {}
  },
  theme: {
    type: 'redirect',
    url: '/admin/themes'
  },
  product: {
    type: 'redirect',
    url: '/admin/products/new'
  }
};

/**
 * Routes that are considered non-critical (fail-open on errors)
 */
const NON_CRITICAL_ROUTES = [
  '/api/preview',
  '/api/settings',
  '/api/profile'
];

/**
 * Check if a route is non-critical
 */
function isNonCriticalRoute(path: string): boolean {
  return NON_CRITICAL_ROUTES.some(route => path.startsWith(route));
}

/**
 * Get default message for a step
 */
function getStepMessage(stepId: string, customMessage?: string): string {
  return customMessage || DEFAULT_MESSAGES[stepId] || 
    `Vous devez compléter l'étape "${stepId}" avant de continuer`;
}

/**
 * Get default action for a step
 */
function getStepAction(
  stepId: string, 
  customAction?: GatingBlockedResponse['action'],
  prefillData?: Record<string, any>
): GatingBlockedResponse['action'] {
  if (customAction) {
    return customAction;
  }
  
  const defaultAction = DEFAULT_ACTIONS[stepId] || {
    type: 'redirect' as const,
    url: '/onboarding'
  };
  
  // Merge prefill data if provided
  if (prefillData && defaultAction.type === 'open_modal') {
    return {
      ...defaultAction,
      prefill: { ...defaultAction.prefill, ...prefillData }
    };
  }
  
  return defaultAction;
}

/**
 * Structured logging helper
 */
function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[Gating Middleware] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

function logInfo(context: string, metadata?: Record<string, any>) {
  console.log(`[Gating Middleware] ${context}`, metadata);
}

function logWarn(context: string, metadata?: Record<string, any>) {
  console.warn(`[Gating Middleware] ${context}`, metadata);
}

/**
 * Create a gating middleware function that checks if a user has completed a required step
 * 
 * @param config - Configuration for the gating check
 * @returns Middleware function that can be used in API routes
 * 
 * @example
 * ```typescript
 * // In your API route
 * export async function POST(req: Request) {
 *   const gatingCheck = await requireStep({
 *     requiredStep: 'payments',
 *     isCritical: true
 *   });
 *   
 *   if (gatingCheck) {
 *     return gatingCheck; // Returns 409 response
 *   }
 *   
 *   // Continue with your logic
 *   // ...
 * }
 * ```
 */
export async function requireStep(
  config: GatingConfig
): Promise<NextResponse<GatingBlockedResponse> | null> {
  const correlationId = crypto.randomUUID();
  const { requiredStep, message, action, isCritical = false } = config;
  
  try {
    // Get authenticated user
    const user = await requireUser();
    
    logInfo('Gating check started', {
      userId: user.id,
      requiredStep,
      correlationId
    });
    
    const pool = getPool();
    const userOnboardingRepo = new UserOnboardingRepository(pool);
    
    // Check if user has completed the required step
    const isComplete = await userOnboardingRepo.hasStepDone(user.id, requiredStep);
    
    if (isComplete) {
      logInfo('Gating check passed', {
        userId: user.id,
        requiredStep,
        correlationId
      });
      return null; // Allow access
    }
    
    // Step is not complete - block access
    logInfo('Gating check blocked', {
      userId: user.id,
      requiredStep,
      correlationId
    });
    
    // Track gating event for analytics
    try {
      await trackGatingBlocked(
        user.id,
        'unknown', // Will be set by caller if needed
        requiredStep,
        {
          correlationId,
          isCritical
        }
      );
    } catch (eventError) {
      // Log but don't fail the gating check
      logError('Failed to track gating event', eventError, {
        userId: user.id,
        requiredStep,
        correlationId
      });
    }
    
    // Return 409 with structured payload
    const response: GatingBlockedResponse = {
      error: 'PRECONDITION_REQUIRED',
      message: getStepMessage(requiredStep, message),
      missingStep: requiredStep,
      action: getStepAction(requiredStep, action),
      correlationId
    };
    
    return NextResponse.json(response, { status: 409 });
    
  } catch (error) {
    logError('Gating check failed', error, {
      requiredStep,
      correlationId
    });
    
    // Determine fail-open vs fail-closed behavior
    if (!isCritical) {
      logWarn('Allowing access due to check failure (non-critical)', {
        requiredStep,
        correlationId
      });
      return null; // Fail open - allow access
    }
    
    // Fail closed for critical routes
    logError('Blocking access due to check failure (critical)', error, {
      requiredStep,
      correlationId
    });
    
    return NextResponse.json(
      {
        error: 'PRECONDITION_REQUIRED',
        message: 'Impossible de vérifier les prérequis. Veuillez réessayer.',
        missingStep: requiredStep,
        action: { type: 'redirect' as const, url: '/onboarding' },
        correlationId
      },
      { status: 503 }
    );
  }
}

/**
 * Higher-order function to wrap API route handlers with gating middleware
 * 
 * @param config - Gating configuration
 * @param handler - The actual API route handler
 * @returns Wrapped handler with gating check
 * 
 * @example
 * ```typescript
 * export const POST = withGating(
 *   { requiredStep: 'payments', isCritical: true },
 *   async (req: Request) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 */
export function withGating<T = any>(
  config: GatingConfig,
  handler: (req: Request, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: Request, context?: any): Promise<NextResponse<T | GatingBlockedResponse>> => {
    const gatingCheck = await requireStep(config);
    
    if (gatingCheck) {
      return gatingCheck as any;
    }
    
    return handler(req, context);
  };
}

/**
 * Middleware function for Next.js middleware.ts file
 * This can be used in the global middleware to check gating before route handlers
 * 
 * @example
 * ```typescript
 * // In middleware.ts
 * import { onboardingGatingMiddleware } from '@/lib/middleware/onboarding-gating';
 * 
 * export async function middleware(req: NextRequest) {
 *   // Check if route requires gating
 *   if (req.nextUrl.pathname.startsWith('/api/store/publish')) {
 *     const gatingResponse = await onboardingGatingMiddleware(req, {
 *       requiredStep: 'payments',
 *       isCritical: true
 *     });
 *     
 *     if (gatingResponse) {
 *       return gatingResponse;
 *     }
 *   }
 *   
 *   return NextResponse.next();
 * }
 * ```
 */
export async function onboardingGatingMiddleware(
  req: NextRequest,
  config: GatingConfig
): Promise<NextResponse<GatingBlockedResponse> | null> {
  return requireStep(config);
}
