import crypto from 'crypto';

export const CSRF_COOKIE_NAME = 'huntaze_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCSRFToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyCSRFToken(
  headerToken: string | null | undefined,
  cookieToken: string | null | undefined,
): boolean {
  if (!headerToken || !cookieToken) return false;
  if (headerToken.length !== cookieToken.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken));
  } catch {
    return false;
  }
}

export function getCSRFCookieName() {
  return CSRF_COOKIE_NAME;
}
