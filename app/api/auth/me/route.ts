import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, refreshAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const access = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;

    if (access) {
      const payload = await verifyToken(access);
      if (payload) {
        return NextResponse.json({
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          provider: payload.provider,
        });
      }
    }

    // Try refresh token path
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      const payload = await verifyToken(newAccess);
      if (payload) {
        return NextResponse.json({
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          provider: payload.provider,
        });
      }
    }

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
