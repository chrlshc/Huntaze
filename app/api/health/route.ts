import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        id: process.env.AWS_AMPLIFY_WEBHOOK_URL ? 'amplify' : 'local',
        region: process.env.AWS_REGION || 'unknown'
      },
      services: {
        database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
        auth: process.env.JWT_SECRET ? 'configured' : 'not-configured',
        redis: process.env.REDIS_URL ? 'configured' : 'not-configured'
      }
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
