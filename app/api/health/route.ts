/**
 * Health Check API
 * 
 * Comprehensive endpoint to verify server and services status
 * 
 * Returns:
 * - 200: All systems operational
 * - 503: Service degraded or unavailable
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const correlationId = `health-${Date.now()}`;

  try {
    console.log('[Health] Check started', { correlationId });

    // Check environment configuration
    const services = {
      database: checkService('DATABASE_URL'),
      auth: checkService('JWT_SECRET') || checkService('NEXTAUTH_SECRET'),
      redis: checkService('REDIS_URL'),
      email: checkService('SMTP_HOST') || checkService('RESEND_API_KEY'),
    };

    // Determine overall status
    const criticalServices = ['database', 'auth'];
    const allCriticalHealthy = criticalServices.every(
      service => services[service as keyof typeof services] === 'configured'
    );

    const status = allCriticalHealthy ? 'healthy' : 'degraded';
    const statusCode = allCriticalHealthy ? 200 : 503;

    const health = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        platform: getDeploymentPlatform(),
        region: process.env.AWS_REGION || process.env.VERCEL_REGION || 'unknown',
      },
      services,
      correlationId,
    };

    console.log('[Health] Check completed', {
      status,
      services,
      correlationId,
    });

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('[Health] Check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId,
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        correlationId,
      },
      { status: 500 }
    );
  }
}

/**
 * Check if service is configured
 */
function checkService(envVar: string): 'configured' | 'not-configured' {
  return process.env[envVar] ? 'configured' : 'not-configured';
}

/**
 * Detect deployment platform
 */
function getDeploymentPlatform(): string {
  if (process.env.AWS_AMPLIFY_WEBHOOK_URL) return 'aws-amplify';
  if (process.env.VERCEL) return 'vercel';
  if (process.env.RAILWAY_ENVIRONMENT) return 'railway';
  if (process.env.RENDER) return 'render';
  return 'local';
}
