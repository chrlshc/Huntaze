export const ErrorCodes = {
  LOGIN_REQUIRED: 'LOGIN_REQUIRED',
  TWO_FA_REQUIRED: 'TWO_FA_REQUIRED',
  NAVIGATION_TIMEOUT: 'NAVIGATION_TIMEOUT',
  SELECTOR_MISSING: 'SELECTOR_MISSING',
  TARGET_NOT_FOUND: 'TARGET_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  CONTENT_BLOCKED: 'CONTENT_BLOCKED',
  NETWORK: 'NETWORK',
  UNKNOWN: 'UNKNOWN',
  BAD_REQUEST: 'BAD_REQUEST'
}

export class FlowError extends Error {
  constructor(code, message, { retryable = false, meta = null } = {}) {
    super(message)
    this.name = 'FlowError'
    this.code = code
    this.retryable = retryable
    this.meta = meta
  }
}

export function normaliseError(err) {
  if (err instanceof FlowError) {
    return {
      status: 'error',
      error: {
        code: err.code,
        message: err.message,
        meta: err.meta || null
      },
      retryable: Boolean(err.retryable)
    }
  }

  const message = err?.message || 'Unexpected error'
  const code = /timeout/i.test(message) ? ErrorCodes.NAVIGATION_TIMEOUT : ErrorCodes.UNKNOWN
  return {
    status: 'error',
    error: { code, message, meta: null },
    retryable: code === ErrorCodes.NAVIGATION_TIMEOUT
  }
}

export function buildSuccess(payload) {
  return { status: 'success', payload }
}

