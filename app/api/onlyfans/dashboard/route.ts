export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

import { getDashboardSnapshot } from '@/lib/of/dashboard-service';
import { toDashboardPayload } from '@/lib/of/dashboard-formatters';
import type { OnlyFansDashboardPayload } from '@/lib/of/dashboard-public-types';

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get('accountId') ?? 'demo-account';
  const refreshParam = request.nextUrl.searchParams.get('refresh');
  const shouldRefresh = refreshParam === '1' || refreshParam === 'true';

  const snapshot = await getDashboardSnapshot(accountId, { refresh: shouldRefresh });
  const payload: OnlyFansDashboardPayload = toDashboardPayload(snapshot);

  return NextResponse.json(payload);
}
