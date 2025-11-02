import { NextRequest, NextResponse } from 'next/server';
import { FansRepository } from '@/lib/db/repositories';
import { getUserFromRequest } from '@/lib/auth/request';
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit';
import { withMonitoring } from '@/lib/observability/bootstrap'

async function getHandler(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    
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

    const user = await getUserFromRequest(request);
    if (!user?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    
    const body = await request.json();
    const fan = await FansRepository.createFan(userId, body || {});
    return NextResponse.json({ fan }, { status: 201 });
  } catch (error) {
    console.error('Failed to create fan:', error);
    return NextResponse.json({ error: 'Failed to create fan' }, { status: 500 });
  }
}

export const GET = withMonitoring('crm.fans.get', getHandler as any, {
  domain: 'crm',
  feature: 'fans_list',
  getUserId: (req) => (req as any)?.headers?.get?.('x-user-id') || undefined,
})
export const POST = withMonitoring('crm.fans.post', postHandler as any, {
  domain: 'crm',
  feature: 'fans_create',
  getUserId: (req) => (req as any)?.headers?.get?.('x-user-id') || undefined,
})
