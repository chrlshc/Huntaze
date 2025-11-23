/**
 * CSRF Token API
 * 
 * GET /api/csrf/token
 * 
 * Returns a new CSRF token for the current session.
 * This token should be included in all POST/PUT/DELETE/PATCH requests.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * @authentication Not required - CSRF tokens can be generated without auth
 * @rateLimit None (read-only endpoint)
 * 
 * @responseBody Success (200)
 * {
 *   token: string
 * }
 * 
 * @example
 * GET /api/csrf/token
 * 
 * Response:
 * {
 *   "token": "a1b2c3d4e5f6..."
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfTokenCookie } from '@/lib/middleware/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Response type for CSRF token endpoint
 */
interface CsrfTokenResponse {
  token: string;
}

/**
 * Error response type
 */
interface ErrorResponse {
  error: string;
}

/**
 * GET /api/csrf/token
 * 
 * Generate and return a new CSRF token
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Generate CSRF token
    const token = generateCsrfToken();
    
    // Log token generation (for debugging in non-production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[CSRF] Token generated:', {
        tokenLength: token.length,
        timestamp: new Date().toISOString(),
      });
    }
    
    const response = NextResponse.json<CsrfTokenResponse>({ token });
    
    // Set cookie with correct domain (Requirements 8.1, 8.2, 8.3, 8.4, 8.5)
    return setCsrfTokenCookie(response, token);
  } catch (error) {
    // Log error for debugging
    console.error('[CSRF] Error generating token:', error);
    
    // Return error response
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
