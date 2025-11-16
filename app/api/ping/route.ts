/**
 * Ultra-simple diagnostic route with no dependencies
 * Used to validate that API routes work independently of NextAuth and middleware
 */

import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ping-api');

export async function GET() {
  const correlationId = logger.info('Ping route accessed', {
    runtime: 'lambda',
    nodeVersion: process.version,
  });

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      runtime: 'lambda',
      nodeVersion: process.version,
      correlationId,
    },
    {
      status: 200,
      headers: {
        'X-Correlation-ID': correlationId,
      },
    }
  );
}
