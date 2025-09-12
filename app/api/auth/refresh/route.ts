import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken, verifyToken } from '@/lib/auth/jwt';

export async function POST(_request: NextRequest) {
  try {
    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }
    const payload = await verifyToken(newAccess);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        provider: payload.provider,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to refresh' }, { status: 500 });
  }
}

