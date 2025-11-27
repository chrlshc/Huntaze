/**
 * Lambda@Edge: Origin Response Handler
 * 
 * Executes after receiving response from origin
 * - Adds security headers
 * - Compresses content
 * - Optimizes responses
 */

import { CloudFrontResponseEvent, CloudFrontResponseHandler, CloudFrontResponse } from 'aws-lambda';
import { gzipSync, brotliCompressSync } from 'zlib';

// Security headers configuration
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
};

// Compressible content types
const COMPRESSIBLE_TYPES = [
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'text/xml',
  'text/plain',
  'image/svg+xml',
];

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: CloudFrontResponse): CloudFrontResponse {
  const headers = response.headers;

  // Add all security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    const headerKey = key.toLowerCase();
    headers[headerKey] = [
      {
        key,
        value,
      },
    ];
  });

  // Add CORS headers if needed
  if (headers['access-control-allow-origin']) {
    // CORS already set by origin, keep it
  } else {
    // Add default CORS for API responses
    if (response.headers['content-type']?.[0]?.value?.includes('application/json')) {
      headers['access-control-allow-origin'] = [
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ];
      headers['access-control-allow-methods'] = [
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
      ];
      headers['access-control-allow-headers'] = [
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ];
    }
  }

  return response;
}

/**
 * Compress response content
 */
function compressContent(
  response: CloudFrontResponse,
  acceptEncoding: string
): CloudFrontResponse {
  // Check if content is compressible
  const contentType = response.headers['content-type']?.[0]?.value || '';
  const isCompressible = COMPRESSIBLE_TYPES.some(type => contentType.includes(type));

  if (!isCompressible) {
    return response;
  }

  // Check if already compressed
  if (response.headers['content-encoding']) {
    return response;
  }

  // Get response body
  const body = response.body;
  if (!body) {
    return response;
  }

  try {
    let compressed: Buffer;
    let encoding: string;

    // Prefer Brotli over Gzip
    if (acceptEncoding.includes('br')) {
      compressed = brotliCompressSync(Buffer.from(body, 'utf-8'));
      encoding = 'br';
    } else if (acceptEncoding.includes('gzip')) {
      compressed = gzipSync(Buffer.from(body, 'utf-8'));
      encoding = 'gzip';
    } else {
      // No compression support
      return response;
    }

    // Only compress if it reduces size by at least 10%
    const originalSize = Buffer.byteLength(body, 'utf-8');
    const compressedSize = compressed.length;

    if (compressedSize < originalSize * 0.9) {
      response.body = compressed.toString('base64');
      response.bodyEncoding = 'base64';
      response.headers['content-encoding'] = [
        { key: 'Content-Encoding', value: encoding },
      ];
      response.headers['content-length'] = [
        { key: 'Content-Length', value: compressedSize.toString() },
      ];
    }

    return response;
  } catch (error) {
    console.error('Compression error:', error);
    return response;
  }
}

/**
 * Optimize cache headers
 */
function optimizeCacheHeaders(response: CloudFrontResponse): CloudFrontResponse {
  const headers = response.headers;
  const contentType = headers['content-type']?.[0]?.value || '';

  // Set cache headers based on content type
  if (contentType.includes('image/')) {
    // Images: 1 year cache
    headers['cache-control'] = [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
    ];
  } else if (
    contentType.includes('text/css') ||
    contentType.includes('javascript')
  ) {
    // CSS/JS: 1 year cache (assuming versioned URLs)
    headers['cache-control'] = [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
    ];
  } else if (contentType.includes('text/html')) {
    // HTML: No cache (always fresh)
    headers['cache-control'] = [
      { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
    ];
  } else if (contentType.includes('application/json')) {
    // API responses: 5 minutes cache
    headers['cache-control'] = [
      { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=60' },
    ];
  }

  return response;
}

/**
 * Add performance hints
 */
function addPerformanceHints(response: CloudFrontResponse): CloudFrontResponse {
  const headers = response.headers;

  // Add Server-Timing header for performance monitoring
  const serverTiming = [
    'edge;dur=0', // Edge processing time (placeholder)
    'origin;dur=0', // Origin processing time (placeholder)
  ];

  headers['server-timing'] = [
    { key: 'Server-Timing', value: serverTiming.join(', ') },
  ];

  // Add Link header for preloading critical resources
  if (headers['content-type']?.[0]?.value?.includes('text/html')) {
    const preloadLinks = [
      '</styles/main.css>; rel=preload; as=style',
      '</scripts/main.js>; rel=preload; as=script',
    ];

    headers['link'] = [
      { key: 'Link', value: preloadLinks.join(', ') },
    ];
  }

  return response;
}

/**
 * Set A/B test variant cookie
 */
function setABTestCookie(
  response: CloudFrontResponse,
  variant: string
): CloudFrontResponse {
  const headers = response.headers;

  // Set cookie for A/B test variant (1 year expiry)
  const cookieValue = `ab_variant=${variant}; Max-Age=31536000; Path=/; Secure; SameSite=Lax`;

  if (headers['set-cookie']) {
    headers['set-cookie'].push({
      key: 'Set-Cookie',
      value: cookieValue,
    });
  } else {
    headers['set-cookie'] = [
      { key: 'Set-Cookie', value: cookieValue },
    ];
  }

  return response;
}

/**
 * Main Lambda@Edge handler for origin responses
 */
export const handler: CloudFrontResponseHandler = async (event: CloudFrontResponseEvent) => {
  let response = event.Records[0].cf.response;
  const request = event.Records[0].cf.request;

  try {
    // Get Accept-Encoding from request
    const acceptEncoding = request.headers['accept-encoding']?.[0]?.value || '';

    // Get A/B variant from request
    const abVariant = request.headers['x-ab-variant']?.[0]?.value || 'A';

    // 1. Add security headers
    response = addSecurityHeaders(response);

    // 2. Compress content
    response = compressContent(response, acceptEncoding);

    // 3. Optimize cache headers
    response = optimizeCacheHeaders(response);

    // 4. Add performance hints
    response = addPerformanceHints(response);

    // 5. Set A/B test cookie
    response = setABTestCookie(response, abVariant);

    return response;
  } catch (error) {
    console.error('Origin response error:', error);
    
    // Return original response on error
    return response;
  }
};

// Export functions for testing
export {
  addSecurityHeaders,
  compressContent,
  optimizeCacheHeaders,
  addPerformanceHints,
  setABTestCookie,
  SECURITY_HEADERS,
  COMPRESSIBLE_TYPES,
};
