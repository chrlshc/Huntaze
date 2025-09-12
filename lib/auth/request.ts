import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Internal: get JWT secret consistently and safely
function getSecret(): Uint8Array {
  const secretStr = process.env.JWT_SECRET;
  if (!secretStr) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not set in production');
    }
    return new TextEncoder().encode('dev-only-secret');
  }
  return new TextEncoder().encode(secretStr);
}

export type AuthPayload = {
  userId: string;
  email?: string;
  name?: string;
  picture?: string;
  provider?: string;
};

// Reads access_token (preferred) or auth_token (legacy) from cookies and verifies it
export async function getUserFromRequest(request: NextRequest): Promise<AuthPayload | null> {
  try {
    const access = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!access) return null;
    const { payload } = await jwtVerify(access, getSecret());
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

