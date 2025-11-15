/**
 * Messages Service Types
 */

export enum MessagesErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

export interface MessagesError extends Error {
  type: MessagesErrorType;
  userMessage: string;
  retryable: boolean;
  correlationId?: string;
}
