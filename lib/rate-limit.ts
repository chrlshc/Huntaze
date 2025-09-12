import { NextRequest } from 'next/server';

type Options = {
  windowMs: number; // window in ms
  max: number; // max requests per window per key
  keyGenerator?: (req: NextRequest) => string;
};

// Simple in-memory store { key: { count, expiresAt } }
const store = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(req: NextRequest, opts: Options): { ok: boolean; remaining: number } {
  const { windowMs, max } = opts;
  const keyGen = opts.keyGenerator || defaultKeyGenerator;
  const key = keyGen(req);
  const now = Date.now();

  const rec = store.get(key);
  if (!rec || rec.expiresAt <= now) {
    store.set(key, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  if (rec.count >= max) {
    return { ok: false, remaining: 0 };
  }

  rec.count += 1;
  store.set(key, rec);
  return { ok: true, remaining: Math.max(0, max - rec.count) };
}

function defaultKeyGenerator(req: NextRequest): string {
  // Prefer real IP header if behind proxy; fallback to remote address
  const h = req.headers;
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown';
  const path = new URL(req.url).pathname;
  return `${ip}:${path}`;
}

