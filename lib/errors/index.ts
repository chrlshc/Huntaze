// Core Error Handling Utilities
// Provides type-safe error handling for catch blocks and API responses

/**
 * Type guard to check if a value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is an object (but not null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a Zod error
 */
export function isZodError(value: unknown): value is { issues: Array<{ message: string; path: (string | number)[] }> } {
  return isObject(value) && 'issues' in value && Array.isArray(value.issues);
}

/**
 * Type guard to check if a value is an Axios error
 */
export function isAxiosError(value: unknown): value is { 
  response?: { status: number; data?: any }; 
  request?: any; 
  message: string;
  code?: string;
} {
  return isObject(value) && 'message' in value && (
    'response' in value || 'request' in value || 'code' in value
  );
}

/**
 * Safely extract error message from unknown error type
 * Handles Error objects, strings, objects with message property, and unknown types
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (isString(error)) {
    return error;
  }
  
  if (isZodError(error)) {
    return error.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    ).join(', ');
  }
  
  if (isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    return error.message;
  }
  
  if (isObject(error)) {
    if ('message' in error && isString(error.message)) {
      return error.message;
    }
    if ('error' in error && isString(error.error)) {
      return error.error;
    }
    // Try to stringify object for debugging
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error object';
    }
  }
  
  // Fallback for completely unknown types
  return 'An unknown error occurred';
}

/**
 * Create standardized error response for API routes
 */
export function createErrorResponse(
  error: unknown, 
  statusCode: number = 500,
  requestId?: string
): Response {
  const message = getErrorMessage(error);
  
  const errorResponse = {
    success: false,
    error: {
      message,
      code: statusCode,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId })
    }
  };
  
  // Don't expose sensitive error details in production
  if (process.env.NODE_ENV === 'production') {
    // Only include generic message for 500 errors in production
    if (statusCode >= 500) {
      errorResponse.error.message = 'Internal server error';
    }
  } else {
    // In development, include more details
    if (isError(error)) {
      (errorResponse.error as any).stack = error.stack;
      (errorResponse.error as any).name = error.name;
    }
  }
  
  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Safe logging function that handles unknown error types
 */
export function logError(
  message: string, 
  error: unknown, 
  context?: Record<string, any>
): void {
  const errorMessage = getErrorMessage(error);
  const logData = {
    message,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    ...context
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production' && isError(error)) {
    (logData as any).stack = error.stack;
  }
  
  console.error(JSON.stringify(logData, null, 2));
}

/**
 * Database error type guard and handler
 */
export function isDatabaseError(value: unknown): value is {
  code: string;
  detail?: string;
  constraint?: string;
  table?: string;
} {
  return isObject(value) && 'code' in value && isString(value.code);
}

/**
 * Get user-friendly message for database errors
 */
export function getDatabaseErrorMessage(error: unknown): string {
  if (!isDatabaseError(error)) {
    return getErrorMessage(error);
  }
  
  switch (error.code) {
    case '23505': // unique_violation
      return 'This record already exists';
    case '23503': // foreign_key_violation
      return 'Referenced record does not exist';
    case '23502': // not_null_violation
      return 'Required field is missing';
    case '23514': // check_violation
      return 'Invalid data format';
    case '08006': // connection_failure
      return 'Database connection failed';
    case '08001': // sqlclient_unable_to_establish_sqlconnection
      return 'Unable to connect to database';
    default:
      return error.detail || getErrorMessage(error);
  }
}