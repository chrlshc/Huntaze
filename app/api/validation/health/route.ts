import { NextRequest, NextResponse } from 'next/server';
import { ValidationOrchestrator } from '@/lib/security/validation-orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const orchestrator = new ValidationOrchestrator();
    
    const platforms = {
      tiktok: {
        clientKey: process.env.TIKTOK_CLIENT_KEY || '',
        clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
        redirectUri: process.env.TIKTOK_REDIRECT_URI || '',
      },
      instagram: {
        appId: process.env.FACEBOOK_APP_ID || '',
        appSecret: process.env.FACEBOOK_APP_SECRET || '',
        redirectUri: process.env.INSTAGRAM_REDIRECT_URI || '',
      },
      reddit: {
        clientId: process.env.REDDIT_CLIENT_ID || '',
        clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
        redirectUri: process.env.REDDIT_REDIRECT_URI || '',
        userAgent: process.env.REDDIT_USER_AGENT || 'Huntaze/1.0',
      },
    };

    const results = await orchestrator.validateMultiplePlatforms(platforms);
    
    const totalPlatforms = Object.keys(results).length;
    const healthyPlatforms = Object.values(results).filter(r => r.isValid).length;
    const overallHealth = healthyPlatforms === totalPlatforms ? 'healthy' : 
                         healthyPlatforms > 0 ? 'degraded' : 'unhealthy';
    
    return NextResponse.json({
      status: overallHealth,
      timestamp: new Date().toISOString(),
      platforms: Object.entries(results).map(([platform, result]) => ({
        platform,
        status: result.isValid ? 'healthy' : 'unhealthy',
        errors: result.errors.length,
        warnings: result.warnings.length,
      })),
      summary: {
        total: totalPlatforms,
        healthy: healthyPlatforms,
        unhealthy: totalPlatforms - healthyPlatforms,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
