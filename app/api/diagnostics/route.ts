/**
 * Performance Diagnostics API
 * Provides endpoints to control and retrieve diagnostic data
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceDiagnostic } from '@/lib/diagnostics';

/**
 * GET /api/diagnostics
 * Get current diagnostic report
 */
export async function GET() {
  try {
    const report = performanceDiagnostic.generateReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating diagnostic report:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagnostic report' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/diagnostics
 * Control diagnostic session (start, stop, reset)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, page } = body;

    switch (action) {
      case 'start':
        performanceDiagnostic.start();
        return NextResponse.json({
          status: 'started',
          message: 'Diagnostic session started',
        });

      case 'stop':
        const report = performanceDiagnostic.stop();
        return NextResponse.json({
          status: 'stopped',
          message: 'Diagnostic session stopped',
          report,
        });

      case 'reset':
        performanceDiagnostic.reset();
        return NextResponse.json({
          status: 'reset',
          message: 'Diagnostic data reset',
        });

      case 'setPage':
        if (!page) {
          return NextResponse.json(
            { error: 'Page parameter required' },
            { status: 400 }
          );
        }
        performanceDiagnostic.setCurrentPage(page);
        return NextResponse.json({
          status: 'success',
          message: `Current page set to ${page}`,
        });

      case 'status':
        return NextResponse.json({
          isActive: performanceDiagnostic.isActive(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, reset, setPage, or status' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in diagnostics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
