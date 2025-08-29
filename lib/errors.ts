// Error types and helpers

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'BAD_REQUEST'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'STRIPE_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode: number;
}

const errorMessages: Record<ErrorCode, string> = {
  AUTH_REQUIRED: 'Authentication required',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT: 'Too many requests',
  BAD_REQUEST: 'Bad request',
  NETWORK_ERROR: 'Network error',
  SERVER_ERROR: 'Server error',
  AI_SERVICE_UNAVAILABLE: 'AI service unavailable',
  STRIPE_ERROR: 'Payment error',
};

export function getErrorMessage(code: ErrorCode): string {
  return errorMessages[code] || errorMessages.SERVER_ERROR;
}

export function createError(code: ErrorCode, details?: any, statusCode?: number): AppError {
  return {
    code,
    message: getErrorMessage(code),
    details,
    statusCode: statusCode || 500,
  };
}

export function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 401:
      return 'AUTH_REQUIRED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 429:
      return 'RATE_LIMIT';
    case 400:
      return 'BAD_REQUEST';
    default:
      return 'SERVER_ERROR';
  }
}

export function shouldRetry(error: AppError): boolean {
  const retryableCodes: ErrorCode[] = ['NETWORK_ERROR', 'SERVER_ERROR', 'AI_SERVICE_UNAVAILABLE', 'STRIPE_ERROR'];
  return retryableCodes.includes(error.code);
}

export function getRetryDelay(attempt: number): number {
  const baseDelay = 1000;
  const maxDelay = 30000;
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return exponentialDelay + jitter;
}
