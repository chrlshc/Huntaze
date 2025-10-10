import { NextRequest, NextResponse } from 'next/server';
import { runOfSyncAllOnce, runOfSyncUserOnce } from '@/lib/workers/of-sync-worker';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json().catch(() => ({}));
    if (userId) {
      await runOfSyncUserOnce(userId);
    } else {
      await runOfSyncAllOnce();
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'sync_failed' }, { status: 500 });
  }
}

