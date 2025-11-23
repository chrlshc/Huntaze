/**
 * Middleware Types for Next.js 16.0.3 App Router
 * 
 * This module provides type definitions for middleware functions that are
 * compatible with Next.js 16 App Router architecture.
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 * 
 * @module lib/middleware/types
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Type for Next.js App Router route handlers
 * 
 * A RouteHandler is a function that accepts a NextRequest and returns
 * a Promise that resolves to a NextResponse. This is the standard signature
 * for API route handlers in Next.js 16 App Router.
 * 
 * Compatible with Next.js 16.0.3 App Router
 * 
 * @example
 * ```typescript
 * const handler: RouteHandler = async (req) => {
 *   return NextResponse.json({ message: 'Hello' });
 * };
 * ```
 */
export type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Middleware wrapper type
 * 
 * A MiddlewareWrapper is a higher-order function that takes a RouteHandler
 * and returns a new RouteHandler. This allows middleware to wrap and enhance
 * route handlers with additional functionality (auth, CSRF, rate limiting, etc.)
 * 
 * The wrapper maintains type safety by ensuring both input and output are
 * valid RouteHandler functions.
 * 
 * @example
 * ```typescript
 * const withAuth: MiddlewareWrapper = (handler) => {
 *   return async (req) => {
 *     // Check authentication
 *     if (!isAuthenticated(req)) {
 *       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *     }
 *     // Call original handler
 *     return handler(req);
 *   };
 * };
 * ```
 */
export type MiddlewareWrapper = (handler: RouteHandler) => RouteHandler;

/**
 * Middleware configuration options
 * 
 * Generic type for middleware configuration. Specific middleware
 * implementations can extend this with their own options.
 */
export interface MiddlewareConfig {
  /**
   * Whether to skip this middleware in test environment
   * @default false
   */
  skipInTest?: boolean;
  
  /**
   * Custom error handler for middleware failures
   */
  onError?: (error: Error, req: NextRequest) => Promise<NextResponse>;
}

/**
 * Middleware execution result
 * 
 * Represents the result of a middleware check. If the middleware
 * determines the request should not proceed, it returns a NextResponse.
 * If the request should proceed, it returns null.
 */
export type MiddlewareResult = NextResponse | null;

/**
 * Async middleware function type
 * 
 * A middleware function that can perform async checks and either
 * return a response (to block the request) or null (to allow it).
 * 
 * @example
 * ```typescript
 * const checkAuth: AsyncMiddleware = async (req) => {
 *   const session = await getSession(req);
 *   if (!session) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   return null; // Allow request to proceed
 * };
 * ```
 */
export type AsyncMiddleware = (req: NextRequest) => Promise<MiddlewareResult>;

/**
 * Compose multiple middleware wrappers into a single wrapper
 * 
 * Takes an array of middleware wrappers and composes them into a single
 * wrapper that applies all middlewares in order (left to right).
 * 
 * @param middlewares - Array of middleware wrappers to compose
 * @returns A single composed middleware wrapper
 * 
 * @example
 * ```typescript
 * const handler = composeMiddleware([
 *   withRateLimit,
 *   withCsrf,
 *   withAuth
 * ])(async (req) => {
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function composeMiddleware(
  middlewares: MiddlewareWrapper[]
): MiddlewareWrapper {
  return (handler: RouteHandler): RouteHandler => {
    return middlewares.reduceRight(
      (wrappedHandler, middleware) => middleware(wrappedHandler),
      handler
    );
  };
}

/**
 * Type guard to check if a value is a NextResponse
 * 
 * @param value - Value to check
 * @returns True if value is a NextResponse
 */
export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

/**
 * Type guard to check if a value is a RouteHandler
 * 
 * @param value - Value to check
 * @returns True if value is a RouteHandler function
 */
export function isRouteHandler(value: unknown): value is RouteHandler {
  return typeof value === 'function';
}
