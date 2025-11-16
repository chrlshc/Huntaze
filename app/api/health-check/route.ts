/**
 * Health check route excluded from middleware matcher
 * Used to isolate if problems come from middleware
 */

import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('health-check-api');

export async function GET() {
  const correlationId = logger.info('Health check route accessed', {
    nodeEnv: process.env.NODE_ENV,
    amplifyEnv: process.env.AMPLIFY_ENV,
  });

  const envStatus = {
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    amplifyEnv: process.env.AMPLIFY_ENV,
  };

  logger.info('Environment status checked', { envStatus });

  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      correlationId,
      env: envStatus,
    },
    {
      status: 200,
      headers: {
        'X-Correlation-ID': correlationId,
      },
    }
  );
}
