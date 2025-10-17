import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { generateToken, generateRefreshToken } from '@/lib/auth/jwt';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    // Basic rate limit to reduce abuse of signin endpoint
    const limited = rateLimit(request, { windowMs: 60_000, max: 10 });
    if (!limited.ok) {
      const r = NextResponse.json({ error: 'Too many attempts, try later', requestId }, { status: 429 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      const r = NextResponse.json({ error: 'Email and password are required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // TODO: Fetch user from database
    // For demo purposes, we'll simulate a user check
    
    // In a real app, you would:
    // 1. Query the database for a user with this email
    // 2. Compare the provided password with the stored hash
    // 3. Return appropriate error if user not found or password incorrect

    // Demo user (in production, fetch from database and compare hash)
    const mockStoredHash = await bcrypt.hash('password123', 10);
    const isValidPassword = await bcrypt.compare(password, mockStoredHash);
    if (!isValidPassword && password !== 'password123') {
      const rr = NextResponse.json({ error: 'Invalid email or password', requestId }, { status: 401 });
      rr.headers.set('X-Request-Id', requestId);
      return rr;
    }

    // Create user object (would come from database)
    const user = {
      id: 'user123',
      email,
      name: email.split('@')[0],
      provider: 'email',
    };

    // Generate short-lived access token and refresh token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });
    const refreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });

    // Create response
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
      requestId,
    });

    // Set secure cookies
    const baseCookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    // New standard cookie
    response.cookies.set('access_token', token, {
      ...baseCookie,
      maxAge: 60 * 60, // 1 hour
    });
    response.cookies.set('refresh_token', refreshToken, {
      ...baseCookie,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Backward-compatibility for existing code paths
    response.cookies.set('auth_token', token, {
      ...baseCookie,
      maxAge: 60 * 60, // 1 hour
    });

    response.headers.set('X-Request-Id', requestId);
    return response;
  } catch (error: any) {
    log.error('auth_signin_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to sign in', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
