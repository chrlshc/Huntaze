import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

// JWT secret handling
function getSecret(): Uint8Array {
  const secretStr = process.env.JWT_SECRET;
  if (!secretStr) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not set in production');
    }
    // Fallback for local/dev only
    return new TextEncoder().encode('dev-only-secret');
  }
  return new TextEncoder().encode(secretStr);
}

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface UserPayload extends JWTPayload {
  userId: string;
  email: string;
  name?: string;
  picture?: string;
  provider: string;
}

// Generate JWT token
export async function generateToken(payload: Omit<UserPayload, 'iat' | 'exp'>) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getSecret());
  
  return token;
}

// Generate refresh token
export async function generateRefreshToken(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getSecret());
  
  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as UserPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Set auth cookies
export function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  cookies().set('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60, // 1 hour
  });

  cookies().set('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Get current user from cookies
export async function getCurrentUser(): Promise<UserPayload | null> {
  const accessToken = cookies().get('access_token')?.value;
  
  if (!accessToken) {
    return null;
  }

  return verifyToken(accessToken);
}

// Clear auth cookies
export function clearAuthCookies() {
  cookies().delete('access_token');
  cookies().delete('refresh_token');
  cookies().delete('session');
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = cookies().get('refresh_token')?.value;
  
  if (!refreshToken) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(refreshToken, getSecret());
    
    // TODO: Get full user data from database using userId
    // For now, return null (implement when DB is ready)
    return null;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}
