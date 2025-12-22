export type InternalApiMode = 'real' | 'mock';

export class InternalApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, opts?: { code?: string; details?: unknown }) {
    super(message);
    this.name = 'InternalApiError';
    this.status = status;
    this.code = opts?.code;
    this.details = opts?.details;
  }
}

export type InternalApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeoutMs?: number;
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

function redirectToLoginForExpiredSession(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/auth/login')) return;
  const callbackUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  window.location.href = `/auth/login?error=session_expired&callbackUrl=${callbackUrl}`;
}

export async function internalApiFetch<T>(path: string, options: InternalApiRequestOptions = {}): Promise<T> {
  const {
    timeoutMs = 15_000,
    headers: headersInit,
    body,
    credentials,
    ...rest
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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

    const response = await fetch(joinUrl(getBaseUrl(), path), {
      ...rest,
      body: isFormData ? (body as FormData) : hasBody ? JSON.stringify(body) : undefined,
      headers,
      credentials: credentials ?? 'include',
      signal: controller.signal,
    });

    if (response.status === 401) {
      redirectToLoginForExpiredSession();
    }

    const payload = await parseJsonSafe(response);

    if (!response.ok) {
      const { message, code, details } = extractErrorMessage(
        payload,
        `Request failed with status ${response.status}`,
      );
      throw new InternalApiError(message, response.status, {
        code: normalizeErrorCode(response.status, code),
        details,
      });
    }

    return payload as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new InternalApiError('Request timed out', 408, { code: 'TIMEOUT' });
    }

    if (error instanceof InternalApiError) {
      throw error;
    }

    throw new InternalApiError(error?.message || 'Network error', 0, { code: 'NETWORK_ERROR' });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  request: <T>(path: string, options: InternalApiRequestOptions = {}) =>
    internalApiFetch<T>(path, options),
  get: <T>(path: string, options: InternalApiRequestOptions = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: InternalApiRequestOptions = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options: InternalApiRequestOptions = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options: InternalApiRequestOptions = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options: InternalApiRequestOptions = {}) =>
    internalApiFetch<T>(path, { ...options, method: 'DELETE' }),
};
