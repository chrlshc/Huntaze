import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { generateToken, generateRefreshToken } from '@/lib/auth/jwt';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Basic rate limit to reduce abuse of register endpoint
    const limited = rateLimit(request, { windowMs: 60_000, max: 10 });
    if (!limited.ok) {
      return NextResponse.json({ error: 'Too many attempts, try later' }, { status: 429 });
    }

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

    const { name, email, password } = parsed.data;

    // In a real app, create the user in DB here and hash the password
    // For now, simulate a new user id
    const user = {
      id: `user_${Math.random().toString(36).slice(2, 10)}`,
      email,
      name,
      provider: 'email',
    };

    // Issue tokens
    const access = await generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });
    const refresh = await generateRefreshToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });

    const res = NextResponse.json({ success: true, user });

    const baseCookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookies.set('access_token', access, { ...baseCookie, maxAge: 60 * 60 });
    res.cookies.set('refresh_token', refresh, { ...baseCookie, maxAge: 60 * 60 * 24 * 7 });
    // Legacy compatibility
    res.cookies.set('auth_token', access, { ...baseCookie, maxAge: 60 * 60 });
    // Ensure onboarding flow triggers
    res.cookies.set('onboarding_completed', 'false', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}

