/**
 * API endpoint for tracking API request performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceDiagnostics } from '@/lib/performance/diagnostics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, method, duration, statusCode, error } = body;

    if (!endpoint || !method || typeof duration !== 'number' || typeof statusCode !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const diagnostics = getPerformanceDiagnostics();
    diagnostics.trackRequest(endpoint, method, duration, statusCode, error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track request:', error);
    return NextResponse.json({ error: 'Failed to track request' }, { status: 500 });
  }
}
