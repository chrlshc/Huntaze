import type { ZodSchema } from 'zod';

export type InternalApiMode = 'real' | 'mock';

export type ApiErrorKind = 'Network' | 'Auth' | 'Validation' | 'RateLimit' | 'Server' | 'Unknown';
export type ApiResponseType = 'json' | 'text' | 'blob';

export class InternalApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  kind?: ApiErrorKind;

  constructor(message: string, status: number, opts?: { code?: string; details?: unknown; kind?: ApiErrorKind }) {
    super(message);
    this.name = 'InternalApiError';
    this.status = status;
    this.code = opts?.code;
    this.details = opts?.details;
    this.kind = opts?.kind;
  }
}

export type InternalApiRequestOptions<T = unknown> = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeoutMs?: number;
  schema?: ZodSchema<T>;
  responseType?: ApiResponseType;
  retryOnAuth?: boolean;
};

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_INTERNAL_API_BASE_URL || '/api';
}

function joinUrl(baseUrl: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const suffix = path.startsWith('/') ? path : `/${path}`;

  // Avoid duplicating `/api` when baseUrl already includes it.
  if (base.endsWith('/api') && (suffix === '/api' || suffix.startsWith('/api/'))) {
    return `${base}${suffix.slice('/api'.length)}`;
  }

  return `${base}${suffix}`;
}

async function parseJsonSafe(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: any, fallback: string): { message: string; code?: string; details?: unknown } {
  if (!payload) return { message: fallback };

  if (typeof payload === 'string') return { message: payload };

  if (typeof payload?.error === 'string') return { message: payload.error };

  if (typeof payload?.message === 'string') return { message: payload.message };

  if (typeof payload?.error?.message === 'string') {
    return {
      message: payload.error.message,
      code: typeof payload.error.code === 'string' ? payload.error.code : undefined,
      details: payload.error.details,
    };
  }

  if (typeof payload?.error === 'object' && payload?.error) {
    return {
      message: typeof payload.error.message === 'string' ? payload.error.message : fallback,
      code: typeof payload.error.code === 'string' ? payload.error.code : undefined,
      details: payload.error.details,
    };
  }

  return { message: fallback };
}

function normalizeErrorCode(status: number, code?: string): string | undefined {
  if (code) return code;

  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 408) return 'TIMEOUT';
  if (status >= 500) return 'SERVER_ERROR';
  if (status === 0) return 'NETWORK_ERROR';

  return undefined;
}

function getErrorKind(status: number, code?: string): ApiErrorKind {
  if (code === 'NETWORK_ERROR' || status === 0 || status === 408) return 'Network';
  if (status === 401 || status === 403) return 'Auth';
  if (status === 422) return 'Validation';
  if (status === 429) return 'RateLimit';
  if (status >= 500) return 'Server';
  return 'Unknown';
}

let refreshPromise: Promise<boolean> | null = null;

function isInternalPath(path: string): boolean {
  return !path.startsWith('http://') && !path.startsWith('https://');
}

async function refreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (!response.ok) return false;
        const payload = await response.json().catch(() => null);
        return Boolean(payload?.success);
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function redirectToLoginForExpiredSession(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/auth/login')) return;
  const callbackUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  window.location.href = `/auth/login?error=session_expired&callbackUrl=${callbackUrl}`;
}

export async function internalApiFetch<T>(path: string, options: InternalApiRequestOptions<T> = {}): Promise<T> {
  const {
    timeoutMs = 15_000,
    headers: headersInit,
    body,
    credentials,
    schema,
    signal: externalSignal,
    responseType = 'json',
    retryOnAuth = true,
    ...rest
  } = options;

  const controller = new AbortController();
  let timedOut = false;
  let abortedByCaller = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => {
    abortedByCaller = true;
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortedByCaller = true;
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onAbort, { once: true });
    }
  }

  const requestUrl = joinUrl(getBaseUrl(), path);
  const isRefreshRequest = requestUrl.includes('/api/auth/refresh');
  const canRefresh =
    retryOnAuth && typeof window !== 'undefined' && isInternalPath(path) && !isRefreshRequest;

  try {
    const headers = new Headers();
    if (headersInit) {
      if (headersInit instanceof Headers) {
        headersInit.forEach((value, key) => headers.set(key, value));
      } else if (Array.isArray(headersInit)) {
        for (const [key, value] of headersInit) headers.set(key, value);
      } else {
        for (const [key, value] of Object.entries(headersInit)) {
          if (typeof value === 'string') headers.set(key, value);
        }
      }
    }

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const hasBody = body !== undefined && body !== null;

    if (!isFormData && hasBody && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(requestUrl, {
      ...rest,
      body: isFormData ? (body as FormData) : hasBody ? JSON.stringify(body) : undefined,
      headers,
      credentials: credentials ?? 'include',
      signal: controller.signal,
    });

    if (response.status === 401 && canRefresh) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return internalApiFetch<T>(path, {
          ...options,
          retryOnAuth: false,
          signal: externalSignal,
        });
      }
    }

    if (response.status === 401) {
      redirectToLoginForExpiredSession();
    }

    if (!response.ok) {
      const payload = await parseJsonSafe(response);
      const { message, code, details } = extractErrorMessage(
        payload,
        `Request failed with status ${response.status}`,
      );
      throw new InternalApiError(message, response.status, {
        code: normalizeErrorCode(response.status, code),
        details,
        kind: getErrorKind(response.status, code),
      });
    }

    if (responseType === 'blob') {
      return (await response.blob()) as T;
    }

    if (responseType === 'text') {
      return (await response.text()) as T;
    }

    const payload = await parseJsonSafe(response);

    if (schema) {
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        throw new InternalApiError('Response validation failed', 422, {
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
          kind: 'Validation',
        });
      }
      return parsed.data;
    }

    return payload as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      if (abortedByCaller && !timedOut) {
        throw new InternalApiError('Request aborted', 499, { code: 'ABORTED', kind: 'Network' });
      }
      throw new InternalApiError('Request timed out', 408, { code: 'TIMEOUT', kind: 'Network' });
    }

    if (error instanceof InternalApiError) {
      throw error;
    }

    throw new InternalApiError(error?.message || 'Network error', 0, {
      code: 'NETWORK_ERROR',
      kind: 'Network',
    });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onAbort);
    }
  }
}

export const apiClient = {
  request: <T>(path: string, options: InternalApiRequestOptions<T> = {}) =>
    internalApiFetch<T>(path, options),
  get: <T>(path: string, options: InternalApiRequestOptions<T> = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: InternalApiRequestOptions<T> = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options: InternalApiRequestOptions<T> = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options: InternalApiRequestOptions<T> = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options: InternalApiRequestOptions<T> = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'DELETE' }),
};
