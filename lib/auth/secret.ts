const SECRET_ENV_KEYS = ['JWT_SECRET', 'NEXTAUTH_SECRET', 'AUTH_SECRET'] as const;
const GLOBAL_FALLBACK_KEY = '__huntaze_jwt_fallback_secret';

let cachedSecret: Uint8Array | null = null;
let cachedRawSecret: string | null = null;
let warnedMissingSecret = false;

function resolveRawSecret(): string {
  if (cachedRawSecret) return cachedRawSecret;

  const fromEnv = SECRET_ENV_KEYS.map((key) => process.env[key]?.trim()).find(Boolean);
  if (fromEnv) {
    cachedRawSecret = fromEnv!;
    return cachedRawSecret;
  }

  const globalSecret = (globalThis as Record<string, unknown>)[GLOBAL_FALLBACK_KEY] as string | undefined;
  if (globalSecret) {
    cachedRawSecret = globalSecret;
    return cachedRawSecret;
  }

  // Development: predictable fixed secret so reloads keep sessions.
  if (process.env.NODE_ENV !== 'production') {
    cachedRawSecret = 'dev-only-secret';
    (globalThis as Record<string, unknown>)[GLOBAL_FALLBACK_KEY] = cachedRawSecret;
    return cachedRawSecret;
  }

  // Production fallback: derive a deterministic value from public metadata so tokens
  // remain stable across instances but surface a clear warning for operators.
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.VERCEL_URL ||
    'https://app.huntaze.com';

  cachedRawSecret = `huntaze::jwt::${base}`;
  (globalThis as Record<string, unknown>)[GLOBAL_FALLBACK_KEY] = cachedRawSecret;

  if (!warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn(
      '[auth] JWT secret missing. Falling back to a derived value. Configure JWT_SECRET (or NEXTAUTH_SECRET/AUTH_SECRET) to secure tokens and keep them stable across deployments.'
    );
  }

  return cachedRawSecret;
}

export function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = resolveRawSecret();
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

export function getJwtSecretRaw(): string {
  return resolveRawSecret();
}
