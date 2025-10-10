import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/auth/secret';

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
    const { payload } = await jwtVerify(access, getJwtSecret());
    return payload as AuthPayload;
  } catch {
    return null;
  }
}
