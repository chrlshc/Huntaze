/**
 * API endpoint for tracking component renders
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceDiagnostics } from '@/lib/performance/diagnostics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { component, renderTime } = body;

    if (!component || typeof renderTime !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const diagnostics = getPerformanceDiagnostics();
    diagnostics.trackRender(component, renderTime);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track render:', error);
    return NextResponse.json({ error: 'Failed to track render' }, { status: 500 });
  }
}
