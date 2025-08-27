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

const errorMessages: Record<ErrorCode, { en: string; fr: string }> = {
  AUTH_REQUIRED: { en: 'Authentication required', fr: 'Authentification requise' },
  FORBIDDEN: { en: 'Access forbidden', fr: 'Accès interdit' },
  NOT_FOUND: { en: 'Resource not found', fr: 'Ressource introuvable' },
  RATE_LIMIT: { en: 'Too many requests', fr: 'Trop de requêtes' },
  BAD_REQUEST: { en: 'Bad request', fr: 'Requête invalide' },
  NETWORK_ERROR: { en: 'Network error', fr: 'Erreur réseau' },
  SERVER_ERROR: { en: 'Server error', fr: 'Erreur serveur' },
  AI_SERVICE_UNAVAILABLE: { en: 'AI service unavailable', fr: 'Service IA indisponible' },
  STRIPE_ERROR: { en: 'Payment error', fr: 'Erreur de paiement' },
};

export function getErrorMessage(code: ErrorCode, locale: 'en' | 'fr' = 'en'): string {
  return errorMessages[code]?.[locale] || errorMessages.SERVER_ERROR[locale];
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
