/**
 * Rate Limit Headers Utility
 * 
 * Utilities for building and adding rate limit headers to HTTP responses.
 * Follows standard rate limit header conventions (X-RateLimit-*).
 */

import { RateLimitResult } from './types';

/**
 * Build rate limit headers for 429 responses
 * 
 * Creates a Headers object with all rate limit information including
 * Retry-After header for rate limited requests.
 * 
 * @param result - Rate limit check result
 * @param policyDescription - Optional human-readable policy description
 * @returns Headers object with rate limit headers
 * @throws Error if result contains invalid data
 */
export function buildRateLimitHeaders(
  result: RateLimitResult,
  policyDescription?: string
): Headers {
  try {
    // Validate input
    if (!result || typeof result !== 'object') {
      console.error('[RateLimitHeaders] Invalid result object:', result);
      throw new Error('Invalid rate limit result');
    }

    if (typeof result.limit !== 'number' || result.limit < 0) {
      console.error('[RateLimitHeaders] Invalid limit:', result.limit);
      throw new Error('Invalid rate limit value');
    }

    if (typeof result.remaining !== 'number' || result.remaining < 0) {
      console.error('[RateLimitHeaders] Invalid remaining:', result.remaining);
      throw new Error('Invalid remaining value');
    }

    if (!(result.resetAt instanceof Date) || isNaN(result.resetAt.getTime())) {
      console.error('[RateLimitHeaders] Invalid resetAt date:', result.resetAt);
      throw new Error('Invalid reset date');
    }

    const headers = new Headers();
    
    // Standard rate limit headers
    headers.set('X-RateLimit-Limit', String(result.limit));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt.getTime() / 1000)));
    
    // Retry-After header (required for 429 responses)
    if (result.retryAfter !== undefined) {
      if (typeof result.retryAfter !== 'number' || result.retryAfter < 0) {
        console.warn('[RateLimitHeaders] Invalid retryAfter, using 0:', result.retryAfter);
        headers.set('Retry-After', '0');
      } else {
        headers.set('Retry-After', String(result.retryAfter));
      }
    }
    
    // Policy description header
    if (policyDescription) {
      headers.set('X-RateLimit-Policy', policyDescription);
    } else {
      headers.set('X-RateLimit-Policy', `${result.limit} requests per window`);
    }
    
    console.log('[RateLimitHeaders] Headers built:', {
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.resetAt.toISOString(),
      retryAfter: result.retryAfter,
      hasPolicy: !!policyDescription,
    });
    
    return headers;
  } catch (error) {
    console.error('[RateLimitHeaders] Error building headers:', error);
    throw error;
  }
}

/**
 * Add rate limit headers to a successful response
 * 
 * Modifies the response headers in-place to include rate limit information.
 * Used for successful requests to inform clients of their current limits.
 * 
 * @param headers - Response headers object to modify
 * @param result - Rate limit check result
 * @param policyDescription - Optional human-readable policy description
 * @throws Error if headers or result are invalid
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
  policyDescription?: string
): void {
  try {
    // Validate inputs
    if (!headers || !(headers instanceof Headers)) {
      console.error('[RateLimitHeaders] Invalid headers object');
      throw new Error('Invalid headers object');
    }

    if (!result || typeof result !== 'object') {
      console.error('[RateLimitHeaders] Invalid result object:', result);
      throw new Error('Invalid rate limit result');
    }

    headers.set('X-RateLimit-Limit', String(result.limit));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt.getTime() / 1000)));
    
    if (policyDescription) {
      headers.set('X-RateLimit-Policy', policyDescription);
    }

    console.log('[RateLimitHeaders] Headers added to response:', {
      limit: result.limit,
      remaining: result.remaining,
      hasPolicy: !!policyDescription,
    });
  } catch (error) {
    console.error('[RateLimitHeaders] Error adding headers:', error);
    throw error;
  }
}

/**
 * Build a 429 Too Many Requests response
 * 
 * Creates a complete Response object for rate limited requests with
 * appropriate headers and error body.
 * 
 * @param result - Rate limit check result
 * @param policyDescription - Optional human-readable policy description
 * @returns Response object with 429 status
 * @throws Error if result is invalid
 */
export function buildRateLimitResponse(
  result: RateLimitResult,
  policyDescription?: string
): Response {
  try {
    console.log('[RateLimitHeaders] Building 429 response:', {
      limit: result.limit,
      remaining: result.remaining,
      retryAfter: result.retryAfter,
      resetAt: result.resetAt.toISOString(),
    });

    const headers = buildRateLimitHeaders(result, policyDescription);
    headers.set('Content-Type', 'application/json');
    
    const retryAfter = result.retryAfter || 0;
    const body = JSON.stringify({
      error: 'Rate limit exceeded',
      message: retryAfter > 0 
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.',
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.resetAt.toISOString(),
      retryAfter,
    });
    
    console.log('[RateLimitHeaders] 429 response created successfully');
    
    return new Response(body, {
      status: 429,
      statusText: 'Too Many Requests',
      headers,
    });
  } catch (error) {
    console.error('[RateLimitHeaders] Error building 429 response:', error);
    
    // Fallback response if something goes wrong
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
      }),
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Format policy description for headers
 * 
 * Creates a human-readable description of the rate limit policy.
 * 
 * @param perMinute - Requests per minute
 * @param perHour - Optional requests per hour
 * @param perDay - Optional requests per day
 * @returns Formatted policy description
 */
export function formatPolicyDescription(
  perMinute?: number,
  perHour?: number,
  perDay?: number
): string {
  try {
    const parts: string[] = [];
    
    // Validate and add per-minute limit
    if (perMinute !== undefined) {
      if (typeof perMinute !== 'number' || perMinute < 0) {
        console.warn('[RateLimitHeaders] Invalid perMinute value:', perMinute);
      } else if (perMinute > 0) {
        parts.push(`${perMinute}/min`);
      }
    }
    
    // Validate and add per-hour limit
    if (perHour !== undefined) {
      if (typeof perHour !== 'number' || perHour < 0) {
        console.warn('[RateLimitHeaders] Invalid perHour value:', perHour);
      } else if (perHour > 0) {
        parts.push(`${perHour}/hour`);
      }
    }
    
    // Validate and add per-day limit
    if (perDay !== undefined) {
      if (typeof perDay !== 'number' || perDay < 0) {
        console.warn('[RateLimitHeaders] Invalid perDay value:', perDay);
      } else if (perDay > 0) {
        parts.push(`${perDay}/day`);
      }
    }
    
    const description = parts.join(', ') || 'No limit';
    
    console.log('[RateLimitHeaders] Policy description formatted:', {
      perMinute,
      perHour,
      perDay,
      description,
    });
    
    return description;
  } catch (error) {
    console.error('[RateLimitHeaders] Error formatting policy description:', error);
    return 'No limit';
  }
}
