import { cookies, headers } from 'next/headers';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export type AuthUser = {
  id: string;
  username?: string;
  email?: string;
  groups?: string[];
  token?: string;
};

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID || process.env.NEXT_PUBLIC_USER_POOL_ID || '';
const issuer = userPoolId ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}` : '';
const jwks = issuer ? createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`)) : null;

function fromHeader(h: Headers): AuthUser | null {
  const id = h.get('x-user-id');
  if (!id) return null;
  const groupsHeader = h.get('x-user-groups') || '';
  return {
    id,
    username: h.get('x-username') || undefined,
    email: h.get('x-user-email') || undefined,
    groups: groupsHeader
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

async function verifyToken(token: string): Promise<AuthUser> {
  if (!jwks || !issuer) throw new HttpError(401, 'Unauthorized');
  const { payload } = await jwtVerify(token, jwks, { issuer });
  const id = (payload.sub as string) || (payload['username'] as string);
  const email = (payload['email'] as string) || undefined;
  const username = (payload['cognito:username'] as string) || undefined;
  const groups = (payload['cognito:groups'] as string[]) || [];
  if (!id) throw new HttpError(401, 'Unauthorized');
  return { id, email, username, groups, token };
}

export async function getUser(): Promise<AuthUser | null> {
  // Prefer middleware-injected headers
  const hdr = fromHeader(headers());
  if (hdr?.id) return hdr;

  // Fallback: verify access token cookie
  const c = cookies();
  const token = c.get('accessToken')?.value || c.get('access_token')?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<AuthUser> {
  const u = await getUser();
  if (!u) throw new HttpError(401, 'Unauthorized');
  return u;
}

export function requireRole(user: AuthUser, roles: string[]) {
  const ok = roles.some((r) => user.groups?.includes(r));
  if (!ok) throw new HttpError(403, 'Forbidden');
}

