import { NextRequest, NextResponse } from 'next/server';
import { mergeOnboarding, markStep } from '@/app/api/_store/onboarding';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    // Validate AI configuration
    const requiredFields = ['tone', 'responseSpeed', 'contentTypes', 'personalityTraits'] as const;
    for (const field of requiredFields) {
      if (!config[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
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

    return NextResponse.json({ 
      success: true,
      message: 'AI configuration saved and training initiated',
      estimatedTrainingTime: '2-3 minutes'
    });
  } catch (error) {
    console.error('Error saving AI config:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
