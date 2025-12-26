import { createLogger } from '@/lib/api/logger';
import {
  ExternalServiceError,
  mapHttpStatusToExternalCode,
  type ExternalServiceErrorCode,
} from './errors';

type RetryOptions = {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryableStatusCodes?: number[];
  retryMethods?: string[];
};

export type ExternalRequestOptions = RequestInit & {
  service: string;
  operation: string;
  timeoutMs?: number;
  correlationId?: string;
  retry?: RetryOptions;
  throwOnHttpError?: boolean;
};

const DEFAULT_RETRYABLE_STATUS = [408, 429, 500, 502, 503, 504];
const DEFAULT_RETRY_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const REDACT_QUERY_KEYS = new Set([
  'access_token',
  'refresh_token',
  'client_secret',
  'token',
  'api_key',
  'apikey',
  'signature',
  'sig',
]);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeDelayMs(attempt: number, retry: Required<RetryOptions>): number {
  const base = retry.initialDelayMs * Math.pow(retry.backoffFactor, attempt - 1);
  const jitter = Math.random() * 0.3 * base;
  return clamp(base + jitter, retry.initialDelayMs, retry.maxDelayMs);
}

function redactUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    let changed = false;
    for (const key of parsed.searchParams.keys()) {
      if (!REDACT_QUERY_KEYS.has(key.toLowerCase())) continue;
      parsed.searchParams.set(key, '***');
      changed = true;
    }
    if (changed) return parsed.toString();
  } catch {
    // Fall through to regex fallback.
  }

  return rawUrl.replace(
    /([?&](?:access_token|refresh_token|client_secret|token|api_key|apikey|signature|sig)=)[^&#]*/gi,
    '$1***'
  );
}

function mergeSignals(signals: Array<AbortSignal | null | undefined>): AbortSignal {
  const controller = new AbortController();

  const onAbort = () => {
    if (controller.signal.aborted) return;
    const reason =
      signals.find((sig) => sig?.aborted)?.reason ?? new Error('Aborted');
    controller.abort(reason);
  };

  for (const sig of signals) {
    if (!sig) continue;
    if (sig.aborted) {
      onAbort();
      break;
    }
    sig.addEventListener('abort', onAbort, { once: true });
  }

  return controller.signal;
}

function parseRetryAfterSeconds(headerValue: string | null): number | null {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds) && seconds >= 0) return seconds;

  const date = new Date(headerValue);
  const ms = date.getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / 1000));
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function shouldRetryHttp(
  response: Response,
  method: string,
  retry: Required<RetryOptions>
): boolean {
  if (!retry.retryMethods.includes(method.toUpperCase())) return false;
  return retry.retryableStatusCodes.includes(response.status);
}

function toNetworkErrorCode(error: unknown): { code: ExternalServiceErrorCode; retryable: boolean } {
  if (error instanceof Error && error.name === 'AbortError') {
    return { code: 'TIMEOUT', retryable: true };
  }
  return { code: 'NETWORK_ERROR', retryable: true };
}

export async function externalFetch(
  url: string,
  options: ExternalRequestOptions
): Promise<Response> {
  const logger = createLogger(`external:${options.service}`, options.correlationId);
  const redactedUrl = redactUrl(url);
  const method = (options.method ?? 'GET').toUpperCase();

  const retry: Required<RetryOptions> = {
    maxRetries: options.retry?.maxRetries ?? 2,
    initialDelayMs: options.retry?.initialDelayMs ?? 200,
    maxDelayMs: options.retry?.maxDelayMs ?? 2_000,
    backoffFactor: options.retry?.backoffFactor ?? 2,
    retryableStatusCodes: options.retry?.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS,
    retryMethods: (options.retry?.retryMethods ?? DEFAULT_RETRY_METHODS).map((m) => m.toUpperCase()),
  };

  const timeoutMs = options.timeoutMs ?? 20_000;
  const maxRetries = Math.max(0, retry.maxRetries);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort(new Error('Timeout'));
    }, timeoutMs);

    try {
      const signal = mergeSignals([options.signal, timeoutController.signal]);
      const response = await fetch(url, { ...options, signal });
      clearTimeout(timeoutId);

      if (options.throwOnHttpError && !response.ok) {
        const { code, retryable } = mapHttpStatusToExternalCode(response.status);
        const body = await safeReadText(response);
        const error = new ExternalServiceError({
          service: options.service,
          code,
          retryable,
          status: response.status,
          correlationId: options.correlationId,
          message: `${options.operation} failed (${response.status})`,
          details: body
            ? { body: body.slice(0, 2_000), url: redactedUrl }
            : { url: redactedUrl },
        });

        if (attempt < maxRetries && retryable && retry.retryMethods.includes(method)) {
          const retryAfter = parseRetryAfterSeconds(response.headers.get('retry-after'));
          const delayMs = retryAfter ? retryAfter * 1000 : computeDelayMs(attempt + 1, retry);
          logger.warn(`${options.operation} retrying after HTTP error`, {
            attempt: attempt + 1,
            maxRetries,
            status: response.status,
            delayMs,
            url: redactedUrl,
          });
          await sleep(delayMs);
          continue;
        }

        throw error;
      }

      if (!response.ok && attempt < maxRetries && shouldRetryHttp(response, method, retry)) {
        const retryAfter = parseRetryAfterSeconds(response.headers.get('retry-after'));
        const delayMs = retryAfter ? retryAfter * 1000 : computeDelayMs(attempt + 1, retry);
        logger.warn(`${options.operation} retrying`, {
          attempt: attempt + 1,
          maxRetries,
          status: response.status,
          delayMs,
          url: redactedUrl,
        });
        await sleep(delayMs);
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // External abort should propagate without retry.
      if (options.signal?.aborted) throw error;

      const { code, retryable } = toNetworkErrorCode(error);
      const wrapped = new ExternalServiceError({
        service: options.service,
        code,
        retryable,
        correlationId: options.correlationId,
        message: `${options.operation} failed (${code})`,
        details: { url: redactedUrl },
        cause: error,
      });

      if (attempt < maxRetries && retryable && retry.retryMethods.includes(method)) {
        const delayMs = computeDelayMs(attempt + 1, retry);
        logger.warn(`${options.operation} retrying after network error`, {
          attempt: attempt + 1,
          maxRetries,
          delayMs,
          url: redactedUrl,
        });
        await sleep(delayMs);
        continue;
      }

      throw wrapped;
    }
  }

  // Unreachable (loop always returns/throws).
  throw new ExternalServiceError({
    service: options.service,
    code: 'UNKNOWN',
    retryable: false,
    correlationId: options.correlationId,
    message: `${options.operation} failed (unknown)`,
  });
}

export async function externalFetchJson<T>(
  url: string,
  options: ExternalRequestOptions
): Promise<T> {
  const response = await externalFetch(url, {
    ...options,
    throwOnHttpError: options.throwOnHttpError ?? true,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ExternalServiceError({
      service: options.service,
      code: 'INVALID_RESPONSE',
      retryable: false,
      correlationId: options.correlationId,
      status: response.status,
      message: `${options.operation} returned invalid JSON`,
      details: { url: redactUrl(url) },
      cause: error,
    });
  }
}
