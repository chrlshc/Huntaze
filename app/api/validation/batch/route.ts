import { NextRequest, NextResponse } from 'next/server';
import { ValidationOrchestrator } from '@/lib/security/validation-orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platforms } = body;

    if (!platforms || typeof platforms !== 'object') {
      return NextResponse.json(
        { error: 'Invalid platforms object' },
        { status: 400 }
      );
    }

    const orchestrator = new ValidationOrchestrator();
    const results = await orchestrator.validateMultiplePlatforms(platforms);

    const summary = {
      total: Object.keys(results).length,
      valid: Object.values(results).filter(r => r.isValid).length,
      invalid: Object.values(results).filter(r => !r.isValid).length,
    };

    return NextResponse.json({
      results,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Batch validation failed' },
      { status: 500 }
    );
  }
}
