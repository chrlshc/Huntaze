// Ensure SSR, skip all Next.js caches for this route.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pick<T extends Record<string, any>>(o: T, k: string) {
  return o && typeof o === 'object' ? (o as any)[k] : undefined;
}

async function parseParams(req: Request) {
  const url = new URL(req.url);
  const qs = Object.fromEntries(url.searchParams as any);
  let body: any = {};
  try { body = await req.json(); } catch { /* no body */ }

  const account_id = pick(body, 'account_id') ?? pick(qs as any, 'account_id');
  const period     = pick(body, 'period')     ?? pick(qs as any, 'period')     ?? '7d';
  const platform   = pick(body, 'platform')   ?? pick(qs as any, 'platform')   ?? 'instagram';

  return { account_id, period, platform };
}

async function respond202(payload: any) {
  return new Response(JSON.stringify({ ok: true, accepted: true, ...payload }), {
    status: 202,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // belt-and-suspenders to bypass any edge/CDN cache
      'cache-control': 'no-store',
    },
  });
}

export async function POST(req: Request) {
  const p = await parseParams(req);
  // (Later) enqueue async job here; for now, always 202
  return respond202(p);
}

export async function GET(req: Request) {
  // GET is accepted too (mirrors POST)
  return POST(req);
}

