import { SignJWT, jwtVerify } from 'jose';

const textEncoder = new TextEncoder();

function getSecret(): Uint8Array {
  const secret = process.env.OF_BRIDGE_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing OF_BRIDGE_SECRET/JWT_SECRET');
  return textEncoder.encode(secret);
}

export async function createIngestToken(payload: { userId: string; ttlSeconds?: number }): Promise<string> {
  const { userId, ttlSeconds = 600 } = payload;
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ purpose: 'of-bridge' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(getSecret());
}

export async function verifyIngestToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (payload.purpose !== 'of-bridge') return null;
    const sub = payload.sub as string | undefined;
    if (!sub) return null;
    return { userId: sub };
  } catch {
    return null;
  }
}

