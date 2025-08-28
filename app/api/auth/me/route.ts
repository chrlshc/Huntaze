import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      provider: payload.provider,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}