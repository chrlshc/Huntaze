/**
 * Content Trends Video Analysis API
 * 
 * Full pipeline: Video URL → Frames → Llama Vision → DeepSeek R1 → DeepSeek V3
 * 
 * POST /api/ai/content-trends/analyze
 * 
 * Body:
 * - videoUrl: string (TikTok, Instagram, YouTube URL)
 * - frameUrls?: string[] (pre-extracted frames, skip FFmpeg)
 * - transcript?: string
 * - engagementMetrics?: { views, likes, shares, comments }
 * - brandContext?: { industry, tone, targetAudience }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAzureInferenceClient } from '@/lib/ai/content-trends/azure-inference-client';
import { validateEndpointConfiguration } from '@/lib/ai/content-trends/azure-foundry-config';

export const maxDuration = 60; // Allow up to 60s for full pipeline

interface AnalyzeRequest {
  videoUrl?: string;
  frameUrls?: string[];
  transcript?: string;
  engagementMetrics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  brandContext?: {
    industry: string;
    tone: string;
    targetAudience: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    const configValidation = validateEndpointConfiguration();
    if (!configValidation.valid) {
      return NextResponse.json(
        {
          error: 'Azure AI Foundry not configured',
          details: configValidation.errors,
          hint: 'Set AZURE_DEEPSEEK_R1_ENDPOINT, AZURE_DEEPSEEK_V3_ENDPOINT, AZURE_LLAMA_VISION_ENDPOINT, and AZURE_AI_API_KEY in .env.local',
        },
        { status: 503 }
      );
    }

    const body: AnalyzeRequest = await request.json();

    // Validate input
    if (!body.frameUrls?.length && !body.videoUrl) {
      return NextResponse.json(
        { error: 'Either frameUrls or videoUrl is required' },
        { status: 400 }
      );
    }

    let frameUrls = body.frameUrls || [];

    // If videoUrl provided but no frames, we'd need to extract them
    // For MVP, require pre-extracted frames or implement FFmpeg extraction
    if (body.videoUrl && !frameUrls.length) {
      return NextResponse.json(
        {
          error: 'Frame extraction not implemented yet',
          hint: 'Provide frameUrls directly or use the video-processor service',
        },
        { status: 400 }
      );
    }

    // Limit frames for cost control
    const MAX_FRAMES = 40;
    if (frameUrls.length > MAX_FRAMES) {
      // Sample frames evenly
      const step = Math.ceil(frameUrls.length / MAX_FRAMES);
      frameUrls = frameUrls.filter((_, i) => i % step === 0).slice(0, MAX_FRAMES);
    }

    const client = getAzureInferenceClient();

    // Run full pipeline
    const result = await client.analyzeVideo(frameUrls, {
      transcript: body.transcript,
      engagementMetrics: body.engagementMetrics,
      brandContext: body.brandContext,
    });

    return NextResponse.json({
      success: true,
      data: {
        timeline: result.timeline,
        viralAnalysis: {
          score: result.viralAnalysis.viralScore,
          retentionPrediction: result.viralAnalysis.retentionPrediction,
          mechanisms: result.viralAnalysis.mechanisms,
          emotionalTriggers: result.viralAnalysis.emotionalTriggers,
          recommendations: result.viralAnalysis.recommendations,
        },
        assets: result.assets,
      },
      meta: {
        framesAnalyzed: frameUrls.length,
        estimatedCostUsd: result.totalCostUsd,
        pipeline: ['llama-vision', 'deepseek-r1', 'deepseek-v3'],
      },
    });
  } catch (error) {
    console.error('[ContentTrendsAnalyze] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/content-trends/analyze
 * Returns configuration status
 */
export async function GET() {
  const configValidation = validateEndpointConfiguration();
  
  return NextResponse.json({
    configured: configValidation.valid,
    errors: configValidation.errors,
    models: {
      'deepseek-r1': {
        configured: !!process.env.AZURE_DEEPSEEK_R1_ENDPOINT,
        purpose: 'Viral analysis & reasoning',
      },
      'deepseek-v3': {
        configured: !!process.env.AZURE_DEEPSEEK_V3_ENDPOINT,
        purpose: 'Content generation (hooks, scripts)',
      },
      'llama-vision': {
        configured: !!process.env.AZURE_LLAMA_VISION_ENDPOINT,
        purpose: 'Frame-by-frame visual analysis',
      },
    },
    pricing: {
      'deepseek-r1': { input: '$0.00135/1K', output: '$0.0054/1K' },
      'deepseek-v3': { input: '$0.00114/1K', output: '$0.00456/1K' },
      'llama-vision': { input: '$0.40/1M', output: '$0.40/1M' },
    },
    limits: {
      maxFrames: 40,
      recommendedFps: 1,
      maxVideoSeconds: 35,
    },
  });
}
