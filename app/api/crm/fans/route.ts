import { NextRequest, NextResponse } from 'next/server';
import { crmData } from '@/lib/services/crmData';
import { getUserFromRequest } from '@/lib/auth/request';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const userId = user?.userId || null;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const fans = crmData.listFans(userId);
    return NextResponse.json({ fans });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list fans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // modest rate limit to protect write endpoint
    const limited = rateLimit(request, { windowMs: 60_000, max: 60 });
    if (!limited.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const user = await getUserFromRequest(request);
    const userId = user?.userId || null;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const body = await request.json();
    const fan = crmData.createFan(userId, body || {});
    return NextResponse.json({ fan }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fan' }, { status: 500 });
  }
}
