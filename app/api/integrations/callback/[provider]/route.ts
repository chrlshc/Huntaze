/**
 * GET /api/integrations/callback/:provider
 * 
 * Handle OAuth callback from provider
 * Requirements: 2.2, 5.4, 11.3
 */

import { NextRequest } from 'next/server';
import { integrationsService } from '@/lib/services/integrations/integrations.service';
import type { Provider } from '@/lib/services/integrations/types';

const VALID_PROVIDERS: Provider[] = ['instagram', 'tiktok', 'reddit', 'onlyfans'];

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Helper to extract client IP address
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider as Provider;
    
    // Validate provider
    if (!VALID_PROVIDERS.includes(provider)) {
      return Response.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=invalid_provider`
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors (user cancelled, etc.)
    if (error) {
      console.warn('[OAuth Callback Error]', { provider, error, errorDescription });
      
      const errorMessage = error === 'access_denied'
        ? 'cancelled'
        : error;
      
      return Response.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=${errorMessage}&provider=${provider}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return Response.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=missing_parameters&provider=${provider}`
      );
    }

    // Extract client information for audit logging
    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || undefined;

    // Handle OAuth callback with CSRF validation and audit logging
    const result = await integrationsService.handleOAuthCallback(
      provider,
      code,
      state,
      ipAddress,
      userAgent
    );

    // Redirect to integrations page with success message
    return Response.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?success=true&provider=${provider}&account=${result.accountId}`
    );
  } catch (error: any) {
    console.error('[Integrations Callback Error]', error);
    
    // Determine error type for user-friendly message
    let errorType = 'unknown';
    if (error.code === 'INVALID_STATE') {
      errorType = 'invalid_state';
    } else if (error.code === 'INVALID_CODE') {
      errorType = 'invalid_code';
    } else if (error.code === 'OAUTH_CALLBACK_ERROR') {
      errorType = 'oauth_error';
    }
    
    return Response.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=${errorType}&provider=${params.provider}`
    );
  }
}
