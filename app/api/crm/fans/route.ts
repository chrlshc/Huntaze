import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { crmData } from '@/lib/services/crmData';

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
  const { payload } = await jwtVerify(token, secret);
  return payload.userId as string;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const fans = crmData.listFans(userId);
    return NextResponse.json({ fans });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list fans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const body = await request.json();
    const fan = crmData.createFan(userId, body || {});
    return NextResponse.json({ fan }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fan' }, { status: 500 });
  }
}

