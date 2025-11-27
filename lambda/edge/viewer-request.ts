/**
 * Lambda@Edge: Viewer Request Handler
 * 
 * Executes before CloudFront cache lookup
 * - Normalizes headers
 * - Device-based routing
 * - Edge authentication
 * - A/B testing assignment
 */

import { CloudFrontRequestEvent, CloudFrontRequestHandler, CloudFrontRequest } from 'aws-lambda';

// Device types
export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  BOT = 'bot',
}

// A/B test variants
export enum ABTestVariant {
  A = 'A',
  B = 'B',
}

/**
 * Normalize headers for consistent caching
 */
function normalizeHeaders(request: CloudFrontRequest): CloudFrontRequest {
  const headers = request.headers;

  // Normalize Accept-Encoding
  if (headers['accept-encoding']) {
    const acceptEncoding = headers['accept-encoding'][0].value.toLowerCase();
    
    // Prefer Brotli over Gzip
    if (acceptEncoding.includes('br')) {
      headers['accept-encoding'] = [{ key: 'Accept-Encoding', value: 'br' }];
    } else if (acceptEncoding.includes('gzip')) {
      headers['accept-encoding'] = [{ key: 'Accept-Encoding', value: 'gzip' }];
    } else {
      delete headers['accept-encoding'];
    }
  }

  // Normalize User-Agent to device type
  const userAgent = headers['user-agent']?.[0]?.value || '';
  const deviceType = detectDevice(userAgent);
  headers['cloudfront-is-mobile-viewer'] = [
    { key: 'CloudFront-Is-Mobile-Viewer', value: deviceType === DeviceType.MOBILE ? 'true' : 'false' }
  ];
  headers['cloudfront-is-tablet-viewer'] = [
    { key: 'CloudFront-Is-Tablet-Viewer', value: deviceType === DeviceType.TABLET ? 'true' : 'false' }
  ];
  headers['cloudfront-is-desktop-viewer'] = [
    { key: 'CloudFront-Is-Desktop-Viewer', value: deviceType === DeviceType.DESKTOP ? 'true' : 'false' }
  ];

  return request;
}

/**
 * Detect device type from User-Agent
 */
function detectDevice(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();

  // Bot detection
  if (
    ua.includes('bot') ||
    ua.includes('crawler') ||
    ua.includes('spider') ||
    ua.includes('googlebot') ||
    ua.includes('bingbot')
  ) {
    return DeviceType.BOT;
  }

  // Mobile detection
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('blackberry') ||
    ua.includes('windows phone')
  ) {
    return DeviceType.MOBILE;
  }

  // Tablet detection
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return DeviceType.TABLET;
  }

  // Default to desktop
  return DeviceType.DESKTOP;
}

/**
 * Route request based on device type
 */
function deviceBasedRouting(request: CloudFrontRequest): CloudFrontRequest {
  const deviceType = detectDevice(request.headers['user-agent']?.[0]?.value || '');

  // Add device type to URI for cache key differentiation
  // This allows serving different content per device type
  if (deviceType === DeviceType.MOBILE) {
    request.headers['x-device-type'] = [{ key: 'X-Device-Type', value: 'mobile' }];
  } else if (deviceType === DeviceType.TABLET) {
    request.headers['x-device-type'] = [{ key: 'X-Device-Type', value: 'tablet' }];
  } else {
    request.headers['x-device-type'] = [{ key: 'X-Device-Type', value: 'desktop' }];
  }

  return request;
}

/**
 * Validate authentication token at edge
 */
function validateAuth(request: CloudFrontRequest): CloudFrontRequest | { status: string; statusDescription: string; body: string } {
  // Check for authentication token in cookie or header
  const authCookie = request.headers['cookie']?.[0]?.value || '';
  const authHeader = request.headers['authorization']?.[0]?.value || '';

  // Extract token
  let token: string | null = null;
  
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (authCookie.includes('auth_token=')) {
    const match = authCookie.match(/auth_token=([^;]+)/);
    token = match ? match[1] : null;
  }

  // Skip auth for public paths
  const publicPaths = ['/login', '/register', '/public', '/api/health'];
  const isPublicPath = publicPaths.some(path => request.uri.startsWith(path));

  if (isPublicPath) {
    return request;
  }

  // If no token and not public path, return 401
  if (!token) {
    return {
      status: '401',
      statusDescription: 'Unauthorized',
      body: JSON.stringify({ error: 'Authentication required' }),
    };
  }

  // Basic token validation (in production, verify JWT signature)
  // For now, just check if token exists and is not empty
  if (token.length < 10) {
    return {
      status: '401',
      statusDescription: 'Unauthorized',
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }

  // Add validated token to header for origin
  request.headers['x-auth-token'] = [{ key: 'X-Auth-Token', value: token }];

  return request;
}

/**
 * Assign A/B test variant at edge
 */
function assignABTestVariant(request: CloudFrontRequest): CloudFrontRequest {
  // Check if user already has a variant assigned
  const cookies = request.headers['cookie']?.[0]?.value || '';
  const variantMatch = cookies.match(/ab_variant=([AB])/);

  let variant: ABTestVariant;

  if (variantMatch) {
    // Use existing variant
    variant = variantMatch[1] as ABTestVariant;
  } else {
    // Assign new variant (50/50 split)
    // Use client IP for consistent assignment
    const clientIp = request.headers['cloudfront-viewer-address']?.[0]?.value || '';
    const hash = simpleHash(clientIp);
    variant = hash % 2 === 0 ? ABTestVariant.A : ABTestVariant.B;
  }

  // Add variant to header for origin and cache key
  request.headers['x-ab-variant'] = [{ key: 'X-AB-Variant', value: variant }];

  return request;
}

/**
 * Simple hash function for consistent A/B assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Main Lambda@Edge handler for viewer requests
 */
export const handler: CloudFrontRequestHandler = async (event: CloudFrontRequestEvent) => {
  let request = event.Records[0].cf.request;

  try {
    // 1. Normalize headers
    request = normalizeHeaders(request);

    // 2. Device-based routing
    request = deviceBasedRouting(request);

    // 3. Validate authentication
    const authResult = validateAuth(request);
    if ('status' in authResult) {
      // Return 401 response
      return authResult as any;
    }
    request = authResult;

    // 4. A/B test assignment
    request = assignABTestVariant(request);

    return request;
  } catch (error) {
    console.error('Viewer request error:', error);
    
    // Return error response
    return {
      status: '500',
      statusDescription: 'Internal Server Error',
      body: JSON.stringify({ error: 'Request processing failed' }),
    };
  }
};

// Export functions for testing
export {
  normalizeHeaders,
  detectDevice,
  deviceBasedRouting,
  validateAuth,
  assignABTestVariant,
  simpleHash,
};
