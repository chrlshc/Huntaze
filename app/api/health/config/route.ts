import { NextResponse } from 'next/server';

interface ConfigValidation {
  requiredVars: string[];
  optionalVars: string[];
  validationRules: Record<string, (value: string) => boolean>;
  results: {
    missing: string[];
    invalid: string[];
    warnings: string[];
    configured: string[];
  };
}

export async function GET() {
  try {
    const startTime = Date.now();

    // Define required environment variables for authentication
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV'
    ];

    // Define optional but recommended variables
    const optionalVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET'
    ];

    // Define validation rules
    const validationRules: Record<string, (value: string) => boolean> = {
      DATABASE_URL: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      JWT_SECRET: (value) => value.length >= 32 && value !== 'your-secret-key-change-in-production',
      NODE_ENV: (value) => ['development', 'production', 'test'].includes(value),
      NEXTAUTH_URL: (value) => value.startsWith('http://') || value.startsWith('https://'),
      NEXTAUTH_SECRET: (value) => value.length >= 32
    };

    const validation: ConfigValidation = {
      requiredVars,
      optionalVars,
      validationRules,
      results: {
        missing: [],
        invalid: [],
        warnings: [],
        configured: []
      }
    };

    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      
      if (!value) {
        validation.results.missing.push(varName);
      } else {
        const rule = validationRules[varName];
        if (rule && !rule(value)) {
          validation.results.invalid.push(varName);
        } else {
          validation.results.configured.push(varName);
        }
      }
    }

    // Check optional variables
    for (const varName of optionalVars) {
      const value = process.env[varName];
      
      if (!value) {
        validation.results.warnings.push(`${varName} not configured (optional)`);
      } else {
        const rule = validationRules[varName];
        if (rule && !rule(value)) {
          validation.results.invalid.push(varName);
        } else {
          validation.results.configured.push(varName);
        }
      }
    }

    // Check for Smart Onboarding specific variables that might conflict
    const smartOnboardingVars = [
      'REDIS_URL',
      'WEBSOCKET_PORT',
      'ML_MODEL_ENDPOINT'
    ];

    const smartOnboardingConfig = smartOnboardingVars.reduce((acc, varName) => {
      acc[varName] = process.env[varName] ? 'configured' : 'not configured';
      return acc;
    }, {} as Record<string, string>);

    const responseTime = Date.now() - startTime;
    const hasIssues = validation.results.missing.length > 0 || validation.results.invalid.length > 0;

    const healthData = {
      service: 'configuration',
      status: hasIssues ? 'degraded' as const : 'healthy' as const,
      timestamp: new Date(),
      responseTime: `${responseTime}ms`,
      details: {
        validation: validation.results,
        environment: process.env.NODE_ENV,
        smartOnboardingConfig,
        summary: {
          totalRequired: requiredVars.length,
          configured: validation.results.configured.length,
          missing: validation.results.missing.length,
          invalid: validation.results.invalid.length,
          warnings: validation.results.warnings.length
        }
      }
    };

    return NextResponse.json(healthData, { 
      status: hasIssues ? 503 : 200 
    });

  } catch (error) {
    console.error('Configuration health check failed:', error);
    
    const errorDetails = {
      service: 'configuration',
      status: 'unhealthy' as const,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown configuration error',
      details: {
        errorType: error instanceof Error ? error.name : 'UnknownError',
        environment: process.env.NODE_ENV
      }
    };

    return NextResponse.json(errorDetails, { status: 503 });
  }
}