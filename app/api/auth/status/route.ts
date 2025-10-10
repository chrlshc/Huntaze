import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ authenticated: false }, { status: 200 });
    const { userId, email, name } = user;
    return NextResponse.json({ authenticated: true, user: { userId, email, name } }, { status: 200 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

