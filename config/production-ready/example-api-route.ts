/**
 * Example API Route - Production Ready 2025
 * 
 * Cet exemple montre comment utiliser tous les services production-ready
 * dans une API route Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  prisma,
  queryOptimizations,
  createPerformanceMiddleware,
  logAuditEvent,
  trackUserAction,
  generateUploadUrl,
  secrets,
} from '@/config/production-ready';

export const runtime = 'nodejs';

/**
 * GET /api/subscribers
 * Liste des subscribers avec pagination et cache
 */
export async function GET(request: NextRequest) {
  // 1. Authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Performance monitoring
  const withPerf = createPerformanceMiddleware('/api/subscribers');
  
  try {
    const result = await withPerf(async () => {
      // 3. Parse query params
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '20');
      const tier = searchParams.get('tier') || undefined;
      
      // 4. Database query with optimizations
      const where: any = { userId: session.user.id };
      if (tier) where.tier = tier;
      
      const [subscribers, total] = await Promise.all([
        prisma.subscriber.findMany({
          where,
          ...queryOptimizations.paginate(page, pageSize),
          ...queryOptimizations.withCache(60), // 1 min cache
          orderBy: { createdAt: 'desc' },
        }),
        prisma.subscriber.count({ where }),
      ]);
      
      return {
        data: subscribers,
        metadata: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    });
    
    // 5. Track user action
    await trackUserAction('LIST_SUBSCRIBERS', session.user.id);
    
    // 6. Return response
    return NextResponse.json({
      success: true,
      ...result,
    });
    
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch subscribers' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscribers
 * Créer un nouveau subscriber avec audit log
 */
export async function POST(request: NextRequest) {
  // 1. Authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Performance monitoring
  const withPerf = createPerformanceMiddleware('/api/subscribers');
  
  try {
    const result = await withPerf(async () => {
      // 3. Parse and validate body
      const body = await request.json();
      const { email, tier, name } = body;
      
      if (!email || !tier) {
        throw new Error('Missing required fields');
      }
      
      // 4. Create subscriber
      const subscriber = await prisma.subscriber.create({
        data: {
          email,
          tier,
          name,
          userId: session.user.id,
        },
      });
      
      return subscriber;
    });
    
    // 5. Audit log
    await logAuditEvent({
      userId: session.user.id,
      action: 'CREATE_SUBSCRIBER',
      resource: 'subscriber',
      resourceId: result.id,
      success: true,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    
    // 6. Track user action
    await trackUserAction('CREATE_SUBSCRIBER', session.user.id);
    
    // 7. Return response
    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating subscriber:', error);
    
    // Audit log for failure
    await logAuditEvent({
      userId: session.user.id,
      action: 'CREATE_SUBSCRIBER',
      resource: 'subscriber',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscriber'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content/upload-url
 * Générer une URL presigned pour upload S3
 */
export async function POST_UPLOAD(request: NextRequest) {
  // 1. Authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // 2. Parse body
    const { fileName, contentType } = await request.json();
    
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // 3. Generate presigned URL
    const { url, key, expiresAt } = await generateUploadUrl({
      userId: session.user.id,
      fileName,
      contentType,
      expiresIn: 60, // 1 minute
    });
    
    // 4. Audit log
    await logAuditEvent({
      userId: session.user.id,
      action: 'GENERATE_UPLOAD_URL',
      resource: 'content',
      resourceId: key,
      success: true,
      metadata: { fileName, contentType },
    });
    
    // 5. Return response
    return NextResponse.json({
      success: true,
      data: {
        url,
        key,
        expiresAt,
      },
    });
    
  } catch (error) {
    console.error('Error generating upload URL:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate upload URL'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health
 * Health check endpoint avec vérification de tous les services
 */
export async function GET_HEALTH(request: NextRequest) {
  try {
    // 1. Check database
    const dbHealth = await healthCheckDB();
    
    // 2. Check secrets
    const secretsHealth = await secretsHealthCheck();
    
    // 3. Overall status
    const isHealthy = dbHealth.status === 'ok' && secretsHealth.status === 'ok';
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth,
        secrets: secretsHealth,
      },
    }, {
      status: isHealthy ? 200 : 503,
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 503,
    });
  }
}

/**
 * Example: Using secrets in API route
 */
async function exampleUsingSecrets() {
  // Get specific secret
  const onlyfansApiKey = await secrets.getOnlyFansApiKey();
  
  // Use it in API call
  const response = await fetch('https://api.onlyfans.com/...', {
    headers: {
      'Authorization': `Bearer ${onlyfansApiKey}`,
    },
  });
  
  return response.json();
}
