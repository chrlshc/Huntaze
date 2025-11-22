/**
 * Onboarding Types
 * 
 * Shared TypeScript types for onboarding across the application
 */

// ============================================================================
// Request Types
// ============================================================================

/**
 * Content types for onboarding
 */
export type ContentType = 'photos' | 'videos' | 'stories' | 'ppv';

/**
 * User goals for onboarding
 */
export type UserGoal = 'grow-audience' | 'increase-revenue' | 'save-time' | 'all';

/**
 * OnlyFans platform credentials
 */
export interface PlatformCredentials {
  username: string;
  password: string;
}

/**
 * Onboarding completion request
 */
export interface OnboardingRequest {
  contentTypes?: ContentType[];
  goal?: UserGoal;
  revenueGoal?: number;
  platform?: PlatformCredentials;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Onboarding success response
 */
export interface OnboardingSuccessResponse {
  success: true;
  message: string;
  correlationId: string;
  duration: number;
}

/**
 * Onboarding error response
 */
export interface OnboardingErrorResponse {
  error: string;
  correlationId: string;
  retryable: boolean;
  statusCode: number;
}

/**
 * Onboarding response (union type)
 */
export type OnboardingResponse = OnboardingSuccessResponse | OnboardingErrorResponse;

// ============================================================================
// Database Types
// ============================================================================

/**
 * User onboarding data in database
 */
export interface UserOnboardingData {
  id: string;
  onboarding_completed: boolean;
  content_types: ContentType[];
  goal: UserGoal | null;
  revenue_goal: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * OAuth account for platform credentials
 */
export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: 'onlyfans';
  provider_account_id: string;
  access_token: string; // Encrypted password
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Onboarding error types
 */
export enum OnboardingErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Structured onboarding error
 */
export interface OnboardingError {
  type: OnboardingErrorType;
  message: string;
  correlationId: string;
  statusCode: number;
  retryable: boolean;
  timestamp: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if response is success response
 */
export function isOnboardingSuccess(
  response: OnboardingResponse
): response is OnboardingSuccessResponse {
  return 'success' in response && response.success === true;
}

/**
 * Check if response is error response
 */
export function isOnboardingError(
  response: OnboardingResponse
): response is OnboardingErrorResponse {
  return 'error' in response;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(response: OnboardingErrorResponse): boolean {
  return response.retryable === true;
}

/**
 * Check if content type is valid
 */
export function isValidContentType(type: string): type is ContentType {
  return ['photos', 'videos', 'stories', 'ppv'].includes(type);
}

/**
 * Check if goal is valid
 */
export function isValidGoal(goal: string): goal is UserGoal {
  return ['grow-audience', 'increase-revenue', 'save-time', 'all'].includes(goal);
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Partial onboarding request (all fields optional)
 */
export type PartialOnboardingRequest = Partial<OnboardingRequest>;

/**
 * Required onboarding request (all fields required)
 */
export type RequiredOnboardingRequest = Required<OnboardingRequest>;

/**
 * Onboarding request without credentials
 */
export type OnboardingRequestWithoutCredentials = Omit<OnboardingRequest, 'platform'>;

/**
 * Extract content types from request
 */
export type ExtractContentTypes<T extends OnboardingRequest> = T['contentTypes'];

/**
 * Extract goal from request
 */
export type ExtractGoal<T extends OnboardingRequest> = T['goal'];

// ============================================================================
// Constants
// ============================================================================

/**
 * Valid content types
 */
export const CONTENT_TYPES: readonly ContentType[] = [
  'photos',
  'videos',
  'stories',
  'ppv',
] as const;

/**
 * Valid user goals
 */
export const USER_GOALS: readonly UserGoal[] = [
  'grow-audience',
  'increase-revenue',
  'save-time',
  'all',
] as const;

/**
 * Revenue goal limits
 */
export const REVENUE_GOAL_LIMITS = {
  min: 0,
  max: 1000000,
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user-friendly content type label
 */
export function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    photos: 'Photos',
    videos: 'Videos',
    stories: 'Stories',
    ppv: 'Pay-Per-View',
  };
  return labels[type];
}

/**
 * Get user-friendly goal label
 */
export function getGoalLabel(goal: UserGoal): string {
  const labels: Record<UserGoal, string> = {
    'grow-audience': 'Grow Audience',
    'increase-revenue': 'Increase Revenue',
    'save-time': 'Save Time',
    'all': 'All of the Above',
  };
  return labels[goal];
}

/**
 * Format revenue goal for display
 */
export function formatRevenueGoal(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validate revenue goal
 */
export function validateRevenueGoal(amount: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (amount < REVENUE_GOAL_LIMITS.min) {
    errors.push({
      field: 'revenueGoal',
      message: `Revenue goal must be at least ${REVENUE_GOAL_LIMITS.min}`,
      code: 'MIN_VALUE',
    });
  }

  if (amount > REVENUE_GOAL_LIMITS.max) {
    errors.push({
      field: 'revenueGoal',
      message: `Revenue goal must be at most ${formatRevenueGoal(REVENUE_GOAL_LIMITS.max)}`,
      code: 'MAX_VALUE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize onboarding request
 */
export function sanitizeOnboardingRequest(
  request: OnboardingRequest
): OnboardingRequest {
  return {
    contentTypes: request.contentTypes?.filter(isValidContentType),
    goal: request.goal && isValidGoal(request.goal) ? request.goal : undefined,
    revenueGoal: request.revenueGoal !== undefined
      ? Math.max(REVENUE_GOAL_LIMITS.min, Math.min(REVENUE_GOAL_LIMITS.max, request.revenueGoal))
      : undefined,
    platform: request.platform,
  };
}
