/**
 * Changelog API
 * 
 * Serves changelog updates for the "What's New" widget.
 * 
 * GET /api/changelog
 * 
 * Response:
 * - 200: JSON with changelog entries and latest release date
 * - 500: JSON with empty entries array on error
 * 
 * Features:
 * - Mocked data for MVP (can be replaced with CMS integration)
 * - Graceful error handling with fallback
 * - Proper TypeScript types
 * - Structured logging
 * - Rate limiting (100 requests/minute)
 * - Response caching (5 minutes)
 * 
 * Protected with:
 * - withRateLimit (public endpoint)
 * 
 * Requirements: 7.1, 7.5 (mobile-ux-marketing-refactor)
 * 
 * @example
 * const response = await fetch('/api/changelog');
 * const data = await response.json();
 * // { entries: [...], latestReleaseDate: "2024-01-15T00:00:00Z" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import type { RouteHandler } from '@/lib/middleware/types';
import type { ChangelogEntry, ChangelogResponse } from './types';

// Re-export types for convenience
export type { ChangelogEntry, ChangelogResponse } from './types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Can be changed to 'force-static' if data is truly static

/**
 * Cache configuration
 * In-memory cache for changelog data to reduce computation
 */
let cachedData: { entries: ChangelogEntry[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Structured logging helper
 */
function logInfo(context: string, metadata?: Record<string, any>) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Changelog API] ${context}`, metadata);
  }
}

function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[Changelog API] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

/**
 * Mock changelog data
 * 
 * In production, this would be replaced with:
 * - CMS integration (Contentful, Sanity, etc.)
 * - Database query (Prisma ChangelogCache model)
 * - External API call
 */
function getMockChangelogEntries(): ChangelogEntry[] {
  return [
    {
      id: '1',
      title: 'Mobile UX Improvements',
      description: 'Enhanced mobile experience with viewport locking and safe area support for iPhone notches and Android gestures.',
      releaseDate: '2024-01-15T00:00:00Z',
      features: [
        'Fixed horizontal scrolling issues on mobile devices',
        'Added support for iPhone notches and safe areas',
        'Improved touch interactions and gesture handling',
        'Implemented dynamic viewport height (dvh) for better mobile browser support',
      ],
    },
    {
      id: '2',
      title: 'Performance Optimizations',
      description: 'Significant performance improvements with code splitting and optimized bundle sizes.',
      releaseDate: '2024-01-10T00:00:00Z',
      features: [
        'Reduced initial JavaScript bundle size by 40%',
        'Implemented dynamic imports for below-the-fold content',
        'Added skeleton loaders for better perceived performance',
        'Optimized image loading with Next.js Image component',
      ],
    },
    {
      id: '3',
      title: 'Design System Update',
      description: 'Introduced Linear-inspired dark mode design system with semantic tokens and improved accessibility.',
      releaseDate: '2024-01-05T00:00:00Z',
      features: [
        'New "Linear Midnight" color palette with Magic Blue accents',
        'Semantic design tokens for consistent theming',
        'WhiteAlpha borders for glass-like UI effects',
        'Inter font integration for professional typography',
      ],
    },
    {
      id: '4',
      title: 'SEO Infrastructure',
      description: 'Enhanced SEO capabilities with structured data, Open Graph images, and environment-based indexing control.',
      releaseDate: '2024-01-01T00:00:00Z',
      features: [
        'Dynamic Open Graph image generation',
        'JSON-LD structured data for better search visibility',
        'Automatic noindex for staging environments',
        'Static site generation for marketing pages',
      ],
    },
    {
      id: '5',
      title: 'Analytics & Privacy',
      description: 'Implemented privacy-first analytics with ad-blocker bypass and Do Not Track support.',
      releaseDate: '2023-12-28T00:00:00Z',
      features: [
        'First-party analytics proxy to bypass ad-blockers',
        'Respect for Do Not Track (DNT) headers',
        'GDPR-compliant consent management',
        'IP anonymization for user privacy',
      ],
    },
  ];
}

/**
 * Fetch changelog entries with caching
 * 
 * Implements in-memory caching to reduce computation for frequently accessed data.
 * Cache is invalidated after CACHE_TTL (5 minutes).
 * 
 * @returns Changelog entries
 */
function getChangelogEntries(): ChangelogEntry[] {
  const now = Date.now();
  
  // Check if cache is valid
  if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
    logInfo('Returning cached changelog entries', {
      cacheAge: now - cachedData.timestamp,
      entryCount: cachedData.entries.length,
    });
    return cachedData.entries;
  }
  
  // Cache miss or expired - fetch fresh data
  logInfo('Cache miss - fetching fresh changelog entries');
  
  // In production, replace this with:
  // - CMS fetch: const entries = await fetchFromCMS();
  // - Database query: const entries = await prisma.changelogCache.findFirst();
  // - External API: const entries = await fetch('https://api.example.com/changelog');
  const entries = getMockChangelogEntries();
  
  // Update cache
  cachedData = {
    entries,
    timestamp: now,
  };
  
  return entries;
}

/**
 * GET /api/changelog
 * 
 * Fetch changelog entries and latest release date
 * 
 * Response:
 * - 200: JSON with entries and latestReleaseDate
 * - 500: JSON with empty entries on error
 * 
 * Features:
 * - In-memory caching (5 minutes TTL)
 * - Graceful error handling with fallback
 * - Structured logging with performance metrics
 * - Rate limiting (100 requests/minute)
 */
const handler: RouteHandler = async (req: NextRequest): Promise<NextResponse<ChangelogResponse>> => {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  
  try {
    logInfo('GET request started', { correlationId });
    
    // Fetch entries (with caching)
    const entries = getChangelogEntries();
    
    // Get the latest release date from the first entry (assuming sorted by date desc)
    const latestReleaseDate = entries[0]?.releaseDate || new Date().toISOString();
    
    const duration = Date.now() - startTime;
    logInfo('GET request completed', {
      correlationId,
      entryCount: entries.length,
      latestReleaseDate,
      duration,
      cached: cachedData !== null,
    });
    
    // Set cache headers for client-side caching
    const response = NextResponse.json<ChangelogResponse>({
      entries,
      latestReleaseDate,
    });
    
    // Cache for 5 minutes on client side
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError('GET request failed', error, {
      correlationId,
      duration,
    });
    
    // Graceful fallback: return empty entries instead of crashing
    // This ensures the widget still renders without breaking the UI
    return NextResponse.json<ChangelogResponse>(
      {
        entries: [],
        latestReleaseDate: new Date(0).toISOString(), // Unix epoch
      },
      { status: 500 }
    );
  }
};

// Apply rate limiting middleware
// Public endpoint with generous rate limit (100 requests/minute)
export const GET = withRateLimit(handler, {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
});
