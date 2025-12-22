/**
 * Health Check API
 * 
 * Lightweight endpoint to verify server liveness and minimal config
 * 
 * Notes:
 * - Keep this endpoint lightweight and dependency-free (LB liveness).
 * 
 * Requirements: 5.1
 * 
 * Returns:
 * - 200: All systems operational
 * - 503: Service degraded or unavailable
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateCorrelationId } from '@/lib/middleware/correlation-id';
import { createLogger } from '@/lib/utils/logger';
import type { RouteHandler } from '@/lib/middleware/types';

const logger = createLogger('health-api');

const handler: RouteHandler = async (req: NextRequest) => {
  const correlationId = getOrGenerateCorrelationId(req);

  try {
    // Minimal config-only checks for LB liveness (no external dependencies).
    const services = {
      database: checkService('DATABASE_URL'),
      auth: checkAnyService(['NEXTAUTH_SECRET', 'JWT_SECRET']),
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

    if (status !== 'healthy') {
      logger.warn('Health check degraded', {
        correlationId,
        services,
        environment: process.env.NODE_ENV || 'development',
      });
    }

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store',
        'X-Correlation-Id': correlationId,
      },
    });
  } catch (error) {
    logger.error(
      'Health check failed',
      error instanceof Error ? error : new Error('Unknown error'),
      { correlationId }
    );

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        correlationId,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'X-Correlation-Id': correlationId,
        },
      }
    );
  }
};

/**
 * Check if service is configured
 */
function checkService(envVar: string): 'configured' | 'not-configured' {
  return process.env[envVar] ? 'configured' : 'not-configured';
}

function checkAnyService(envVars: string[]): 'configured' | 'not-configured' {
  return envVars.some((envVar) => !!process.env[envVar]) ? 'configured' : 'not-configured';
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

// Public liveness endpoint (no rate limiting).
export const GET = handler;
