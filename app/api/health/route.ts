import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Git commit info (populated at build time)
const BUILD_INFO = {
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  commit: process.env.NEXT_PUBLIC_GIT_COMMIT || 'unknown',
  buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Basic health checks
  const checks = {
    server: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
    },
    environment: {
      node: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV,
    },
    build: BUILD_INFO,
  };

  // Check required environment variables
  const requiredEnvVars = [
    'JWT_SECRET',
    'NEXT_PUBLIC_AWS_REGION',
    'NEXT_PUBLIC_USER_POOL_ID',
    'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
  ];

  const envStatus = requiredEnvVars.reduce((acc, varName) => {
    acc[varName] = process.env[varName] ? 'configured' : 'missing';
    return acc;
  }, {} as Record<string, string>);

  // Detailed health status (only in non-production or with auth)
  const headersList = headers();
  const authHeader = headersList.get('authorization');
  const isAuthorized = authHeader === `Bearer ${process.env.HEALTH_CHECK_TOKEN}` || process.env.NODE_ENV !== 'production';

  if (isAuthorized) {
    // Return detailed health information
    return NextResponse.json({
      status: 'healthy',
      ...checks,
      config: envStatus,
      responseTime: `${Date.now() - startTime}ms`,
    });
  }

  // Return minimal health info for unauthorized requests in production
  return NextResponse.json({
    status: 'healthy',
    timestamp: checks.timestamp,
    version: BUILD_INFO.version,
    environment: BUILD_INFO.environment,
  });
}

// HEAD method for lightweight health checks (load balancers)
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Status': 'ok',
      'X-App-Version': BUILD_INFO.version,
    },
  });
}