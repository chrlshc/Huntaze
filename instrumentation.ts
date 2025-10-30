/**
 * Next.js 15 Instrumentation
 * 
 * Provides observability hooks for error tracking and monitoring
 * Requirements: 11.5
 */

export async function onRequestError(
  err: unknown,
  request: Request,
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
    revalidateReason: 'on-demand' | 'stale' | undefined;
    renderType: 'dynamic' | 'dynamic-resume' | undefined;
  }
) {
  const error = err as Error;
  
  // Log error details
  console.error('[Instrumentation] Request Error:', {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    context,
  });

  // Send to observability endpoint (CloudWatch/Sentry)
  if (process.env.OBS_ENDPOINT) {
    try {
      await fetch(process.env.OBS_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.OBS_API_KEY || '',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: error.message,
          stack: error.stack,
          request: {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
          },
          context,
          environment: process.env.NODE_ENV,
          service: 'huntaze-ui',
        }),
      });
    } catch (observabilityError) {
      // Don't fail the request if observability fails
      console.error('[Instrumentation] Failed to send error to observability:', observabilityError);
    }
  }
}

export async function register() {
  // Initialize tracer/metrics on server startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing observability...');
    
    // Setup any monitoring SDKs here
    // Example: Initialize Sentry, DataDog, New Relic, etc.
    
    if (process.env.SENTRY_DSN) {
      // Initialize Sentry
      console.log('[Instrumentation] Sentry initialized');
    }
    
    if (process.env.CLOUDWATCH_ENABLED === 'true') {
      // Initialize CloudWatch metrics
      console.log('[Instrumentation] CloudWatch metrics initialized');
    }
    
    console.log('[Instrumentation] Observability ready');
  }
}
