import { NextResponse } from 'next/server';
import { query, getPool } from '@/lib/db/index';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test basic connection
    const pool = getPool();
    const poolStatus = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };

    // Test simple query execution
    const testQuery = 'SELECT 1 as test, NOW() as timestamp';
    const result = await query(testQuery);
    
    // Test users table (critical for auth)
    const userTableCheck = await query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'users'"
    );
    
    // Test sessions table (critical for auth)
    const sessionTableCheck = await query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'sessions'"
    );

    const responseTime = Date.now() - startTime;

    const healthData = {
      service: 'database',
      status: 'healthy' as const,
      timestamp: new Date(),
      responseTime: `${responseTime}ms`,
      details: {
        connection: true,
        queryExecution: true,
        poolStatus,
        tables: {
          users: userTableCheck.rows[0].count > 0,
          sessions: sessionTableCheck.rows[0].count > 0
        },
        testResult: result.rows[0],
        environment: process.env.NODE_ENV
      }
    };

    return NextResponse.json(healthData);

  } catch (error) {
    console.error('Database health check failed:', error);
    
    const errorDetails = {
      service: 'database',
      status: 'unhealthy' as const,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown database error',
      details: {
        connection: false,
        queryExecution: false,
        errorType: error instanceof Error ? error.name : 'UnknownError',
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      }
    };

    return NextResponse.json(errorDetails, { status: 503 });
  }
}