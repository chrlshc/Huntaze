/**
 * Lambda@Edge function for adding security headers to CloudFront responses
 * 
 * This function runs at CloudFront edge locations on viewer-response events
 * to add comprehensive security headers to all responses.
 * 
 * Deploy to us-east-1 region (required for Lambda@Edge)
 * 
 * Security Headers Added:
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Content-Security-Policy
 * - Permissions-Policy
 */

exports.handler = async (event) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  // Strict-Transport-Security (HSTS)
  // Force HTTPS for 1 year, include subdomains, allow preloading
  headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }];

  // X-Content-Type-Options
  // Prevent MIME type sniffing
  headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }];

  // X-Frame-Options
  // Prevent clickjacking attacks
  headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }];

  // X-XSS-Protection
  // Enable browser XSS protection (legacy browsers)
  headers['x-xss-protection'] = [{
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }];

  // Referrer-Policy
  // Control referrer information sent with requests
  headers['referrer-policy'] = [{
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }];

  // Content-Security-Policy (CSP)
  // Comprehensive CSP for Huntaze application
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.huntaze.com https://vercel.live https://vitals.vercel-insights.com",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

  headers['content-security-policy'] = [{
    key: 'Content-Security-Policy',
    value: cspDirectives
  }];

  // Permissions-Policy (formerly Feature-Policy)
  // Disable unnecessary browser features
  const permissionsPolicy = [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');

  headers['permissions-policy'] = [{
    key: 'Permissions-Policy',
    value: permissionsPolicy
  }];

  // Cross-Origin-Embedder-Policy
  // Prevent cross-origin resource loading
  headers['cross-origin-embedder-policy'] = [{
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp'
  }];

  // Cross-Origin-Opener-Policy
  // Isolate browsing context
  headers['cross-origin-opener-policy'] = [{
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  }];

  // Cross-Origin-Resource-Policy
  // Control cross-origin resource sharing
  headers['cross-origin-resource-policy'] = [{
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin'
  }];

  // Add custom header to track Lambda@Edge execution
  headers['x-security-headers'] = [{
    key: 'X-Security-Headers',
    value: 'lambda-edge'
  }];

  // Log for debugging (visible in CloudWatch Logs)
  console.log('Security headers added to response');

  return response;
};
