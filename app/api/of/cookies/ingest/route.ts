import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyIngestToken } from '@/lib/bridgeTokens';
import { isBridgeTokenUsed, markBridgeTokenUsed } from '@/lib/bridgeTokenStore';
import { putEncryptedCookies } from '@/lib/of/aws-session-store';
import { enqueueLogin } from '@/lib/queue/of-sqs';

const CookieSchema = z.object({
  name: z.string(),
  value: z.string(),
  domain: z.string(),
  path: z.string().optional(),
  httpOnly: z.boolean().optional(),
  secure: z.boolean().optional(),
  sameSite: z.string().optional(),
  expirationDate: z.number().nullable().optional(),
  partitionKey: z.any().nullable().optional(),
});

const BodySchema = z.object({
  userId: z.string(),
  cookies: z.array(CookieSchema).min(1),
});

function getAppOrigin(): string | null {
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_ORIGIN || '';
  if (!origin) return null;
  try {
    const u = new URL(origin);
    return `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}`;
  } catch {
    return null;
  }
}

function corsHeaders(origin: string | null) {
  const appOrigin = getAppOrigin();
  const extOrigin = process.env.EXTENSION_ORIGIN || null; // e.g., chrome-extension://<id>
  const isExt = !!origin && origin.startsWith('chrome-extension://');
  const allow = isExt ? origin : (origin && (origin === appOrigin || (extOrigin && origin === extOrigin)) ? origin : appOrigin || '*');
  return {
    'Access-Control-Allow-Origin': allow || '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, X-OF-Bridge',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  // Auth via Bearer token (ingest token)
  const authz = req.headers.get('authorization') || '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  const verified = token ? await verifyIngestToken(token) : null;
  if (!verified) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  if (isBridgeTokenUsed(verified.jti)) {
    return NextResponse.json({ error: 'Token already used' }, { status: 409, headers });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers });

  const { userId, cookies } = parsed.data;
  if (userId !== verified.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });

  // Strict domain filter
  const ofCookies = cookies.filter((c) => /(^|\.)onlyfans\.com$/i.test(c.domain));
  if (!ofCookies.length) return NextResponse.json({ error: 'No onlyfans.com cookies' }, { status: 400, headers });

  try {
    await putEncryptedCookies(userId, JSON.stringify(ofCookies));
  } catch (e: any) {
    return NextResponse.json({ error: 'Persist failed' }, { status: 500, headers });
  }

  // Optional: trigger a backend login retry to verify session (re-uses existing SQS infrastructure)
  try {
    await enqueueLogin({ userId });
  } catch {
    // ignore if queue not configured
  }

  // Mark token as used (one-shot) after success
  try { markBridgeTokenUsed(verified.jti, verified.exp); } catch {}

  return NextResponse.json({ ok: true }, { status: 200, headers });
}
