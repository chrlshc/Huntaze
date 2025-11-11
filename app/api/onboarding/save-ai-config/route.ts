import { NextRequest, NextResponse } from 'next/server';
import { mergeOnboarding, markStep } from '@/app/api/_store/onboarding';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const config = await request.json();

    // Validate AI configuration
    const requiredFields = ['tone', 'responseSpeed', 'contentTypes', 'personalityTraits'] as const;
    for (const field of requiredFields) {
      if (!config[field]) {
        const r = NextResponse.json({ error: `Missing required field: ${field}`, requestId }, { status: 400 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
    }

    // Update in-memory store for demo/dev
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value || 'dev-user';
    mergeOnboarding(token, {
      aiConfig: {
        tone: config.tone,
        responseSpeed: config.responseSpeed,
        personalityTraits: config.personalityTraits,
        contentTypes: config.contentTypes,
        voiceSample: config.voiceSample ?? null,
        writingSamples: config.writingSamples || [],
        autoLearn: !!config.autoLearn,
        selectedNicheId: config.selectedNicheId ?? null,
        price: config.price ?? null,
        cadence: config.cadence,
        upsellMenu: config.upsellMenu,
        dmSequences: config.dmSequences,
      },
    });
    markStep(token, 'aiConfig');

    // In production, this would:
    // 1. Save to database
    // 2. Train AI model with samples
    // 3. Configure automation rules

    const r = NextResponse.json({ 
      success: true,
      message: 'AI configuration saved and training initiated',
      estimatedTrainingTime: '2-3 minutes',
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('onboarding_save_ai_config_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to save configuration', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export const POST = handler as any;
