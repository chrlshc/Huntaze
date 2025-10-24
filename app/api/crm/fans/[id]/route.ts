import { NextRequest, NextResponse } from 'next/server';
import { crmData } from '@/lib/services/crmData';
import { getUserFromRequest } from '@/lib/auth/request';

async function getUserId(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user?.userId || null;
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const fan = crmData.getFan(userId, params.id);
    if (!fan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ fan });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get fan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const patch = await request.json();
    const fan = crmData.updateFan(userId, params.id, patch || {});
    if (!fan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ fan });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update fan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const ok = crmData.deleteFan(userId, params.id);
    return NextResponse.json({ ok });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete fan' }, { status: 500 });
  }
}
