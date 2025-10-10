import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { generateToken, generateRefreshToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { windowMs: 60_000, max: 10 });
    if (!limited.ok) return NextResponse.json({ error: 'Too many attempts, try later' }, { status: 429 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { email, password } = parsed.data;
    // In production: create user and hash password. Here: simulate user id
    const userId = `usr_${Math.random().toString(36).slice(2, 10)}`;
    const name = email.split('@')[0];

    const access = await generateToken({ userId, email, name, provider: 'email' });
    const refresh = await generateRefreshToken({ userId, email, name, provider: 'email' });

    const res = NextResponse.json({ success: true, user: { id: userId, email, name } });
    const baseCookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
    res.cookies.set('access_token', access, { ...baseCookie, maxAge: 60 * 60 });
    res.cookies.set('refresh_token', refresh, { ...baseCookie, maxAge: 60 * 60 * 24 * 7 });
    res.cookies.set('auth_token', access, { ...baseCookie, maxAge: 60 * 60 });
    res.cookies.set('onboarding_completed', 'false', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error('Signup error:', e);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}

