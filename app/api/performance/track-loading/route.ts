/**
 * API endpoint for tracking loading states
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceDiagnostics } from '@/lib/performance/diagnostics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { component, duration, reason } = body;

    if (!component || typeof duration !== 'number' || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const diagnostics = getPerformanceDiagnostics();
    diagnostics.trackLoadingState(component, duration, reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track loading state:', error);
    return NextResponse.json({ error: 'Failed to track loading state' }, { status: 500 });
  }
}
