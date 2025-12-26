export const CSRF_COOKIE_NAME = 'huntaze_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCSRFToken(): string {
  // Use Web Crypto when available (Edge/runtime-safe), fallback to Node when needed
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      (globalThis as any).crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // ignore and fall through
  }
  // Node.js fallback without importing 'crypto' at module scope (avoids edge bundling issues)
  try {
     
    const nodeCrypto = require('crypto') as typeof import('crypto');
    return nodeCrypto.randomBytes(16).toString('hex');
  } catch {
    // Last-resort weak fallback to ensure function never throws
    let s = '';
    for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    return s;
  }
}

export function verifyCSRFToken(
  headerToken: string | null | undefined,
  cookieToken: string | null | undefined,
): boolean {
  if (!headerToken || !cookieToken) return false;
  if (headerToken.length !== cookieToken.length) return false;
  // Prefer constant-time byte comparison. Use Node's timingSafeEqual when available; otherwise fallback.
  try {
     
    const nodeCrypto = require('crypto') as typeof import('crypto');
    return nodeCrypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken));
  } catch {
    const a = new TextEncoder().encode(headerToken);
    const b = new TextEncoder().encode(cookieToken);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }
}

export function getCSRFCookieName() {
  return CSRF_COOKIE_NAME;
}
