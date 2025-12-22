export type ExternalServiceErrorCode =
  | 'CONFIG_MISSING'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'UPSTREAM_5XX'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export type ExternalServiceErrorOptions = {
  service: string;
  code: ExternalServiceErrorCode;
  message: string;
  retryable: boolean;
  status?: number;
  correlationId?: string;
  details?: Record<string, unknown>;
  cause?: unknown;
};

export class ExternalServiceError extends Error {
  readonly service: string;
  readonly code: ExternalServiceErrorCode;
  readonly retryable: boolean;
  readonly status?: number;
  readonly correlationId?: string;
  readonly details?: Record<string, unknown>;

  constructor(options: ExternalServiceErrorOptions) {
    super(options.message);
    this.name = 'ExternalServiceError';
    this.service = options.service;
    this.code = options.code;
    this.retryable = options.retryable;
    this.status = options.status;
    this.correlationId = options.correlationId;
    this.details = options.details;

    if (options.cause !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).cause = options.cause;
    }
  }
}

export function isExternalServiceError(error: unknown): error is ExternalServiceError {
  return error instanceof Error && error.name === 'ExternalServiceError';
}

export function mapHttpStatusToExternalCode(status: number): {
  code: ExternalServiceErrorCode;
  retryable: boolean;
} {
  if (status === 400) return { code: 'BAD_REQUEST', retryable: false };
  if (status === 401) return { code: 'UNAUTHORIZED', retryable: false };
  if (status === 403) return { code: 'FORBIDDEN', retryable: false };
  if (status === 404) return { code: 'NOT_FOUND', retryable: false };
  if (status === 429) return { code: 'RATE_LIMIT', retryable: true };
  if (status >= 500) return { code: 'UPSTREAM_5XX', retryable: true };
  return { code: 'UNKNOWN', retryable: false };
}

