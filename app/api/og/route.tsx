/**
 * Open Graph Image Generation API
 * 
 * Generates dynamic OG images with Magic Blue styling for social media sharing.
 * 
 * GET /api/og?title=Your+Title
 * 
 * Query Parameters:
 * - title: string (optional) - Title to display on the image. Defaults to "Huntaze"
 * 
 * Response:
 * - 200: PNG image (1200x630)
 * - 302: Redirect to fallback image on error
 * 
 * Features:
 * - Edge runtime for fast generation
 * - Magic Blue (#5E6AD2) styling
 * - Automatic fallback to static image
 * - Proper error handling and logging
 * 
 * Requirements: 5.1, 5.4, 5.5 (mobile-ux-marketing-refactor)
 * 
 * @example
 * <meta property="og:image" content="https://huntaze.com/api/og?title=Features" />
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * TypeScript types for API responses
 */
export interface OGImageParams {
  title?: string;
}

export interface OGImageError {
  error: string;
  message: string;
  timestamp: string;
}

/**
 * Constants for OG image generation
 */
const OG_IMAGE_CONFIG = {
  width: 1200,
  height: 630,
  defaultTitle: 'Huntaze',
  maxTitleLength: 100,
  fallbackImage: '/og-image.png',
} as const;

const MAGIC_BLUE = '#5E6AD2';
const BACKGROUND_DARK = '#0F0F10';
const CARD_BACKGROUND = '#151516';
const TEXT_COLOR = '#EDEDED';

/**
 * Structured logging helper
 */
function logInfo(context: string, metadata?: Record<string, any>) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OG Image API] ${context}`, metadata);
  }
}

function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[OG Image API] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

/**
 * Sanitize and validate title parameter
 */
function sanitizeTitle(title: string | null): string {
  if (!title || title.trim().length === 0) {
    return OG_IMAGE_CONFIG.defaultTitle;
  }
  
  // Truncate if too long
  const sanitized = title.trim();
  if (sanitized.length > OG_IMAGE_CONFIG.maxTitleLength) {
    return sanitized.substring(0, OG_IMAGE_CONFIG.maxTitleLength) + '...';
  }
  
  return sanitized;
}

/**
 * GET /api/og
 * 
 * Generate dynamic Open Graph image with Magic Blue styling
 * 
 * Query Parameters:
 * - title: string (optional) - Title to display
 * 
 * Response:
 * - 200: PNG image (1200x630)
 * - 302: Redirect to fallback image on error
 */
export async function GET(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Extract and validate parameters
    const { searchParams } = new URL(request.url);
    const rawTitle = searchParams.get('title');
    const title = sanitizeTitle(rawTitle);
    
    logInfo('Generating OG image', {
      title,
      rawTitle,
      url: request.url,
    });

    // Generate image with ImageResponse
    const response = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: BACKGROUND_DARK,
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1E1E20 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1E1E20 2%, transparent 0%)',
            backgroundSize: '100px 100px',
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 900,
              color: TEXT_COLOR,
              padding: '20px 40px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              background: CARD_BACKGROUND,
              boxShadow: `0px 10px 50px rgba(94, 106, 210, 0.3)`, // Magic Blue glow
            }}
          >
            {title}
          </div>
        </div>
      ),
      {
        width: OG_IMAGE_CONFIG.width,
        height: OG_IMAGE_CONFIG.height,
      }
    );
    
    const duration = Date.now() - startTime;
    logInfo('OG image generated successfully', {
      title,
      duration,
    });
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError('OG image generation failed', error, {
      url: request.url,
      duration,
    });
    
    // Fallback to static image (fail-safe)
    return new Response(null, {
      status: 302,
      headers: {
        Location: OG_IMAGE_CONFIG.fallbackImage,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
