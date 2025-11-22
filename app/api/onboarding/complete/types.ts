/**
 * Onboarding Complete API Types
 * 
 * Type definitions for the onboarding completion endpoint.
 * 
 * Requirements: 5.4, 5.6, 5.9
 */

// ============================================================================
// Request Types
// ============================================================================

/**
 * Content types available for creators
 */
export type ContentType = 'photos' | 'videos' | 'stories' | 'ppv';

/**
 * Creator goals
 */
export type CreatorGoal = 'grow-audience' | 'increase-revenue' | 'save-time' | 'all';

/**
 * OnlyFans platform credentials
 */
export interface PlatformCredentials {
  username: string;
  password: string;
}

/**
 * Onboarding completion request body
 */
export interface OnboardingCompleteRequest {
  /**
   * Content types the creator produces
   * @example ['photos', 'videos']
   */
  contentTypes?: ContentType[];

  /**
   * Primary goal for using the platform
   * @example 'increase-revenue'
   */
  goal?: CreatorGoal;

  /**
   * Monthly revenue goal in dollars
   * @example 5000
   * @minimum 0
   * @maximum 1000000
   */
  revenueGoal?: number;

  /**
   * OnlyFans credentials (optional)
   * Password will be encrypted before storage
   */
  platform?: PlatformCredentials;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * User data returned in success response
 */
export interface OnboardingUser {
  id: number;
  email: string;
  onboardingCompleted: boolean;
}

/**
 * Success response data
 */
export interface OnboardingCompleteSuccessData {
  success: true;
  message: string;
  user: OnboardingUser;
  correlationId: string;
  duration: number;
}

/**
 * Error response data
 */
export interface OnboardingCompleteError {
  error: string;
  correlationId: string;
  retryable: boolean;
  statusCode: number;
}

/**
 * Success response wrapper
 */
export interface OnboardingCompleteSuccess {
  success: true;
  data: OnboardingCompleteSuccessData;
}

/**
 * Error response wrapper
 */
export interface OnboardingCompleteFailure {
  success: false;
  error: OnboardingCompleteError;
}

/**
 * Complete response type (union)
 */
export type OnboardingCompleteResponse = 
  | OnboardingCompleteSuccess 
  | OnboardingCompleteFailure;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if response is successful
 */
export function isOnboardingSuccess(
  response: OnboardingCompleteResponse
): response is OnboardingCompleteSuccess {
  return response.success === true;
}

/**
 * Check if response is an error
 */
export function isOnboardingError(
  response: OnboardingCompleteResponse
): response is OnboardingCompleteFailure {
  return response.success === false;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: OnboardingCompleteError): boolean {
  return error.retryable === true;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate content types array
 */
export function isValidContentTypes(types: unknown): types is ContentType[] {
  if (!Array.isArray(types)) return false;
  
  const validTypes: ContentType[] = ['photos', 'videos', 'stories', 'ppv'];
  return types.every(type => validTypes.includes(type as ContentType));
}

/**
 * Validate creator goal
 */
export function isValidGoal(goal: unknown): goal is CreatorGoal {
  const validGoals: CreatorGoal[] = ['grow-audience', 'increase-revenue', 'save-time', 'all'];
  return typeof goal === 'string' && validGoals.includes(goal as CreatorGoal);
}

/**
 * Validate revenue goal
 */
export function isValidRevenueGoal(goal: unknown): goal is number {
  return typeof goal === 'number' && goal >= 0 && goal <= 1000000;
}

/**
 * Validate platform credentials
 */
export function isValidPlatformCredentials(creds: unknown): creds is PlatformCredentials {
  if (typeof creds !== 'object' || creds === null) return false;
  
  const { username, password } = creds as any;
  
  return (
    typeof username === 'string' &&
    username.length > 0 &&
    username.length <= 255 &&
    typeof password === 'string' &&
    password.length > 0 &&
    password.length <= 255
  );
}

/**
 * Validate complete onboarding request
 */
export function isValidOnboardingRequest(data: unknown): data is OnboardingCompleteRequest {
  if (typeof data !== 'object' || data === null) return false;
  
  const { contentTypes, goal, revenueGoal, platform } = data as any;
  
  // All fields are optional, but if present must be valid
  if (contentTypes !== undefined && !isValidContentTypes(contentTypes)) return false;
  if (goal !== undefined && !isValidGoal(goal)) return false;
  if (revenueGoal !== undefined && !isValidRevenueGoal(revenueGoal)) return false;
  if (platform !== undefined && !isValidPlatformCredentials(platform)) return false;
  
  return true;
}
