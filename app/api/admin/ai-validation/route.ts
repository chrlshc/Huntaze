/**
 * AI System Validation API Endpoint
 * 
 * GET /api/admin/ai-validation
 * 
 * Runs the full AI system validation suite and returns a comprehensive report.
 * Requires admin authentication.
 * 
 * Query Parameters:
 * - skipAWS: Skip AWS connectivity checks (default: false)
 * - skipResilience: Skip resilience tests (default: false)
 * - skipE2E: Skip end-to-end tests (default: false)
 * - format: Response format - 'json' or 'text' (default: 'json')
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import {
  runValidation,
  formatReport,
  ValidationRunnerConfig,
} from '@/lib/ai/validation/validation-runner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for full validation

/**
 * GET handler for AI validation
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Check admin role (if applicable)
    // For now, any authenticated user can run validation
    // In production, add role check: if (authResult.user.role !== 'admin')

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const skipAWS = searchParams.get('skipAWS') === 'true';
    const skipResilience = searchParams.get('skipResilience') === 'true';
    const skipE2E = searchParams.get('skipE2E') === 'true';
    const format = searchParams.get('format') || 'json';

    // Build configuration
    const config: ValidationRunnerConfig = {
      skipAWSConnectivity: skipAWS,
      skipResilience,
      skipE2E,
      environment: process.env.NODE_ENV,
      routerUrl: process.env.AI_ROUTER_URL,
    };

    // Run validation
    const report = await runValidation(config);

    // Return response based on format
    if (format === 'text') {
      const textReport = formatReport(report);
      return new NextResponse(textReport, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // Default: JSON response
    return NextResponse.json({
      success: report.overallStatus !== 'FAIL',
      report,
      meta: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('AI Validation Error:', error);
    
    return NextResponse.json(
      {
        error: 'Validation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for running specific validations
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { validations, config: userConfig } = body;

    // Build configuration
    const config: ValidationRunnerConfig = {
      skipAWSConnectivity: !validations?.includes('aws'),
      skipResilience: !validations?.includes('resilience'),
      skipE2E: !validations?.includes('e2e'),
      environment: process.env.NODE_ENV,
      routerUrl: userConfig?.routerUrl || process.env.AI_ROUTER_URL,
    };

    // Run validation
    const report = await runValidation(config);

    return NextResponse.json({
      success: report.overallStatus !== 'FAIL',
      report,
      meta: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        requestedValidations: validations || 'all',
      },
    });
  } catch (error) {
    console.error('AI Validation Error:', error);
    
    return NextResponse.json(
      {
        error: 'Validation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
