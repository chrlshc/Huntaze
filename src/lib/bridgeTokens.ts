import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

const textEncoder = new TextEncoder();

function getSecret(): Uint8Array {
  const secret = process.env.OF_BRIDGE_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing OF_BRIDGE_SECRET/JWT_SECRET');
  return textEncoder.encode(secret);
}

export async function createIngestToken(payload: { userId: string; ttlSeconds?: number }): Promise<string> {
  const { userId, ttlSeconds = 600 } = payload;
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomBytes(16).toString('hex');
  return await new SignJWT({ purpose: 'of-bridge', jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(getSecret());
}

export async function verifyIngestToken(token: string): Promise<{ userId: string; jti: string; exp: number } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (payload.purpose !== 'of-bridge') return null;
    const sub = payload.sub as string | undefined;
    const jti = (payload as any).jti as string | undefined;
    const exp = payload.exp as number | undefined;
    if (!sub || !jti || !exp) return null;
    return { userId: sub, jti, exp };
  } catch {
    return null;
  }
}
