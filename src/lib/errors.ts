// Centralized error handling with localized messages

export type ErrorCode = 
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'AUTH_EXPIRED'
  | 'RATE_LIMIT'
  | 'VALIDATION_ERROR'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_DECLINED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'BAD_REQUEST'
  | 'ONLYFANS_CONNECTION_FAILED'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'STRIPE_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode?: number;
}

const errorMessages: Record<ErrorCode, { en: string; fr: string }> = {
  AUTH_REQUIRED: {
    en: 'Please sign in to continue',
    fr: 'Veuillez vous connecter pour continuer'
  },
  AUTH_INVALID: {
    en: 'Invalid email or password',
    fr: 'Email ou mot de passe invalide'
  },
  AUTH_EXPIRED: {
    en: 'Your session has expired. Please sign in again',
    fr: 'Votre session a expiré. Veuillez vous reconnecter'
  },
  RATE_LIMIT: {
    en: 'Too many requests. Please try again later',
    fr: 'Trop de requêtes. Veuillez réessayer plus tard'
  },
  VALIDATION_ERROR: {
    en: 'Please check your input and try again',
    fr: 'Veuillez vérifier vos informations et réessayer'
  },
  PAYMENT_FAILED: {
    en: 'Payment failed. Please try again or use a different payment method',
    fr: 'Le paiement a échoué. Veuillez réessayer ou utiliser un autre moyen de paiement'
  },
  PAYMENT_DECLINED: {
    en: 'Your card was declined. Please check your card details',
    fr: 'Votre carte a été refusée. Veuillez vérifier vos informations bancaires'
  },
  SUBSCRIPTION_EXPIRED: {
    en: 'Your subscription has expired. Please renew to continue',
    fr: 'Votre abonnement a expiré. Veuillez renouveler pour continuer'
  },
  SERVER_ERROR: {
    en: 'Something went wrong. Please try again',
    fr: 'Une erreur est survenue. Veuillez réessayer'
  },
  NETWORK_ERROR: {
    en: 'Connection error. Please check your internet connection',
    fr: 'Erreur de connexion. Veuillez vérifier votre connexion internet'
  },
  NOT_FOUND: {
    en: 'The requested resource was not found',
    fr: 'La ressource demandée est introuvable'
  },
  FORBIDDEN: {
    en: 'You don\'t have permission to access this resource',
    fr: 'Vous n\'avez pas la permission d\'accéder à cette ressource'
  },
  BAD_REQUEST: {
    en: 'Invalid request. Please check your data',
    fr: 'Requête invalide. Veuillez vérifier vos données'
  },
  ONLYFANS_CONNECTION_FAILED: {
    en: 'Failed to connect to OnlyFans. Please check your credentials',
    fr: 'Impossible de se connecter à OnlyFans. Veuillez vérifier vos identifiants'
  },
  AI_SERVICE_UNAVAILABLE: {
    en: 'AI service is temporarily unavailable. Please try again later',
    fr: 'Le service IA est temporairement indisponible. Veuillez réessayer plus tard'
  },
  STRIPE_ERROR: {
    en: 'Payment processing error. Please try again',
    fr: 'Erreur de traitement du paiement. Veuillez réessayer'
  }
};

export function getErrorMessage(code: ErrorCode, locale: 'en' | 'fr' = 'en'): string {
  return errorMessages[code]?.[locale] || errorMessages.SERVER_ERROR[locale];
}

export function createError(code: ErrorCode, details?: any, statusCode?: number): AppError {
  return {
    code,
    message: getErrorMessage(code),
    details,
    statusCode: statusCode || 500
  };
}

// HTTP status to error code mapping
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

// Retry configuration for different error types
export function shouldRetry(error: AppError): boolean {
  const retryableCodes: ErrorCode[] = [
    'NETWORK_ERROR',
    'SERVER_ERROR',
    'AI_SERVICE_UNAVAILABLE',
    'STRIPE_ERROR'
  ];
  return retryableCodes.includes(error.code);
}

export function getRetryDelay(attempt: number): number {
  // Exponential backoff with jitter
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
  return exponentialDelay + jitter;
}