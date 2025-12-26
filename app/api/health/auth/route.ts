import { NextResponse } from 'next/server';
import { query } from '@/lib/db/index';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function GET() {
  try {
    const startTime = Date.now();
    const isDev = process.env.NODE_ENV !== 'production';
    const checks = {
      database: false,
      jwtSecret: false,
      tokenGeneration: false,
      tokenVerification: false,
      passwordHashing: false,
      userTableAccess: false,
      sessionTableAccess: isDev
    };

    // Check JWT_SECRET configuration
    checks.jwtSecret = !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-secret-key-change-in-production';

    // Test database connection for auth tables
    try {
      await query('SELECT 1');
      checks.database = true;
    } catch (error) {
      console.error('Auth health check - database connection failed:', error);
    }

    // Test user table access
    try {
      await query('SELECT COUNT(*) FROM users LIMIT 1');
      checks.userTableAccess = true;
    } catch (error) {
      console.error('Auth health check - users table access failed:', error);
    }

    // Test sessions table access (skip in dev since JWT-only auth doesn't use it)
    if (!isDev) {
      try {
        await query('SELECT COUNT(*) FROM sessions LIMIT 1');
        checks.sessionTableAccess = true;
      } catch (error) {
        console.error('Auth health check - sessions table access failed:', error);
      }
    }

    // Test JWT token generation
    try {
      const testToken = await new SignJWT({ test: true, userId: 'test' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .setIssuedAt()
        .sign(JWT_SECRET);
      
      checks.tokenGeneration = !!testToken;

      // Test JWT token verification
      const verified = await jwtVerify(testToken, JWT_SECRET);
      checks.tokenVerification = !!verified.payload.test;
    } catch (error) {
      console.error('Auth health check - JWT operations failed:', error);
    }

    // Test password hashing
    try {
      const testPassword = 'test-password-123';
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      const isValid = await bcrypt.compare(testPassword, hashedPassword);
      checks.passwordHashing = isValid;
    } catch (error) {
      console.error('Auth health check - password hashing failed:', error);
    }

    const responseTime = Date.now() - startTime;
    const allChecksPass = Object.values(checks).every(check => check === true);

    const healthData = {
      service: 'authentication',
      status: allChecksPass ? 'healthy' as const : 'degraded' as const,
      timestamp: new Date(),
      responseTime: `${responseTime}ms`,
      details: {
        checks,
        environment: process.env.NODE_ENV,
        issues: Object.entries(checks)
          .filter(([_, passed]) => !passed)
          .map(([check, _]) => check)
      }
    };

    return NextResponse.json(healthData, { 
      status: allChecksPass ? 200 : 503 
    });

  } catch (error) {
    console.error('Authentication health check failed:', error);
    
    const errorDetails = {
      service: 'authentication',
      status: 'unhealthy' as const,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown authentication error',
      details: {
        errorType: error instanceof Error ? error.name : 'UnknownError',
        environment: process.env.NODE_ENV
      }
    };

    return NextResponse.json(errorDetails, { status: 503 });
  }
}
