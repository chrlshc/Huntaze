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

type DbTarget = {
  configured: boolean;
  host: string;
  port: string;
  database: string;
};

type DbSslInfo = {
  enabled: boolean;
  mode: string;
  rejectUnauthorized?: boolean;
};

function parseDatabaseUrl(conn?: string): URL | null {
  if (!conn) return null;
  try {
    return new URL(conn);
  } catch {
    return null;
  }
}

function describeDatabaseTarget(conn?: string): DbTarget {
  const url = parseDatabaseUrl(conn);
  if (!url) {
    return {
      configured: false,
      host: 'unknown',
      port: 'unknown',
      database: 'unknown',
    };
  }

  const database = url.pathname.replace(/^\//, '') || 'unknown';

  return {
    configured: true,
    host: url.hostname || 'unknown',
    port: url.port || '5432',
    database,
  };
}

function resolveSslInfo(conn?: string): DbSslInfo {
  const url = parseDatabaseUrl(conn);
  const rawMode = (url?.searchParams.get('sslmode') ?? process.env.PGSSLMODE ?? '').toLowerCase();
  const mode = rawMode || 'default';

  if (rawMode === 'disable') {
    return { enabled: false, mode };
  }

  const shouldEnable = rawMode ? rawMode !== 'disable' : process.env.NODE_ENV === 'production';
  if (!shouldEnable) {
    return { enabled: false, mode };
  }

  const rejectUnauthorized = rawMode === 'verify-full' || rawMode === 'verify-ca';
  return { enabled: true, mode, rejectUnauthorized };
}

function shouldExposeDbTarget(): boolean {
  return process.env.E2E_TESTING === '1' || process.env.LOG_DB_TARGET === '1';
}

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

    const includeDbTarget = shouldExposeDbTarget();
    const databaseTarget = includeDbTarget
      ? {
          ...describeDatabaseTarget(process.env.DATABASE_URL),
          ssl: resolveSslInfo(process.env.DATABASE_URL),
        }
      : undefined;

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
      ...(includeDbTarget ? { databaseTarget } : {}),
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
