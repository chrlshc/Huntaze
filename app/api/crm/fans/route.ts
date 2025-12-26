import { NextRequest, NextResponse } from 'next/server';
import { FansRepository } from '@/lib/db/repositories';
import { resolveUserId } from '../_lib/auth';
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest) {
  try {
    const { userId } = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    const fans = await FansRepository.listFans(userId);
    return NextResponse.json({ fans });
  } catch (error) {
    console.error('Failed to list fans:', error);
    return NextResponse.json({ error: 'Failed to list fans' }, { status: 500 });
  }
}

async function postHandler(request: NextRequest) {
  try {
    // modest rate limit to protect write endpoint
    const ident = idFromRequestHeaders(request.headers)
    const rl = await checkRateLimit({ id: ident.id, limit: 60, windowSec: 60 })
    if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const { userId } = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    const body = await request.json();
    const fan = await FansRepository.createFan(userId, body || {});
    return NextResponse.json({ fan }, { status: 201 });
  } catch (error) {
    console.error('Failed to create fan:', error);
    return NextResponse.json({ error: 'Failed to create fan' }, { status: 500 });
  }
}

export const GET = getHandler as any
export const POST = postHandler as any
