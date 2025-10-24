import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';

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
export async function generateRefreshToken(payload: Omit<UserPayload, 'iat' | 'exp'>) {
  const token = await new SignJWT(payload)
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

  (cookies() as unknown as UnsafeUnwrappedCookies).set('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60, // 1 hour
  });

  (cookies() as unknown as UnsafeUnwrappedCookies).set('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Get current user from cookies
export async function getCurrentUser(): Promise<UserPayload | null> {
  const accessToken = (await cookies()).get('access_token')?.value;
  
  if (!accessToken) {
    return null;
  }

  return verifyToken(accessToken);
}

// Clear auth cookies
export function clearAuthCookies() {
  (cookies() as unknown as UnsafeUnwrappedCookies).delete('access_token');
  (cookies() as unknown as UnsafeUnwrappedCookies).delete('refresh_token');
  (cookies() as unknown as UnsafeUnwrappedCookies).delete('session');
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = (await cookies()).get('refresh_token')?.value;
  
  if (!refreshToken) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(refreshToken, getSecret());
    const user = payload as UserPayload;
    // Re-issue a short-lived access token using payload from refresh
    const newAccess = await new SignJWT({
      userId: user.userId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .sign(getSecret());

    // Update cookies
    (await cookies()).set('access_token', newAccess, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });
    // Legacy compatibility cookie
    (await cookies()).set('auth_token', newAccess, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return newAccess;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}
