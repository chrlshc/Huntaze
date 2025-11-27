/**
 * API endpoint for page load diagnostics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceDiagnostics } from '@/lib/performance/diagnostics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, metrics } = body;

    if (!url || !metrics) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const diagnostics = getPerformanceDiagnostics();
    const report = diagnostics.analyzePageLoad(metrics, url);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Failed to process diagnostics:', error);
    return NextResponse.json({ error: 'Failed to process diagnostics' }, { status: 500 });
  }
}
