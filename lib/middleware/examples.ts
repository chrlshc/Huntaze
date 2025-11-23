/**
 * Example usage of middleware types
 * 
 * This file demonstrates how to use the middleware types with Next.js 16.0.3
 * App Router to create type-safe middleware functions.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { RouteHandler, MiddlewareWrapper } from './types';
import { composeMiddleware } from './types';

/**
 * Example 1: Simple authentication middleware
 */
export const withSimpleAuth: MiddlewareWrapper = (handler) => {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return handler(req);
  };
};

/**
 * Example 2: Logging middleware
 */
export const withLogging: MiddlewareWrapper = (handler) => {
  return async (req: NextRequest) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    const response = await handler(req);
    
    console.log(`[${new Date().toISOString()}] Response: ${response.status}`);
    
    return response;
  };
};

/**
 * Example 3: Rate limiting middleware (simplified)
 */
export const withSimpleRateLimit: MiddlewareWrapper = (handler) => {
  const requestCounts = new Map<string, number>();
  
  return async (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const count = requestCounts.get(ip) || 0;
    
    if (count > 100) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    requestCounts.set(ip, count + 1);
    
    return handler(req);
  };
};

/**
 * Example 4: Composing multiple middlewares
 */
export function createProtectedHandler(handler: RouteHandler): RouteHandler {
  return composeMiddleware([
    withLogging,
    withSimpleRateLimit,
    withSimpleAuth,
  ])(handler);
}

/**
 * Example 5: Using the middleware in an API route
 * 
 * ```typescript
 * // app/api/protected/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { createProtectedHandler } from '@/lib/middleware/examples';
 * 
 * const handler = async (req: NextRequest) => {
 *   return NextResponse.json({ message: 'Protected data' });
 * };
 * 
 * export const GET = createProtectedHandler(handler);
 * ```
 */
