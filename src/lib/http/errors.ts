import { NextResponse } from 'next/server';

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'BAD_REQUEST'
  | 'SERVER_ERROR';

const defaultMsg: Record<ErrorCode, string> = {
  AUTH_REQUIRED: 'Authentication required',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not found',
  RATE_LIMIT: 'Too many requests',
  BAD_REQUEST: 'Bad request',
  SERVER_ERROR: 'Server error',
};

export function jsonError(code: ErrorCode, status: number, details?: unknown) {
  const requestId = crypto.randomUUID?.() || undefined;
  return NextResponse.json(
    { error: { code, message: defaultMsg[code], details, requestId } },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

// Small helper to wrap handlers and catch exceptions consistently
export async function withErrorHandling<T>(fn: () => Promise<T>) {
  try {
    // @ts-expect-error allow handlers to return Response/NextResponse
    return await fn();
  } catch (e: any) {
    const status = Number(e?.status || e?.statusCode || 500);
    if (status === 400) return jsonError('BAD_REQUEST', 400);
    if (status === 401) return jsonError('AUTH_REQUIRED', 401);
    if (status === 403) return jsonError('FORBIDDEN', 403);
    if (status === 404) return jsonError('NOT_FOUND', 404);
    if (status === 429) return jsonError('RATE_LIMIT', 429);
    return jsonError('SERVER_ERROR', 500);
  }
}

