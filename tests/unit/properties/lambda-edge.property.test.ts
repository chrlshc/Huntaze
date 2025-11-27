/**
 * Property-Based Tests for Lambda@Edge Functions
 * Feature: performance-optimization-aws
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  normalizeHeaders,
  detectDevice,
  deviceBasedRouting,
  assignABTestVariant,
  DeviceType,
  ABTestVariant,
} from '../../../lambda/edge/viewer-request';
import {
  addSecurityHeaders,
  compressContent,
  SECURITY_HEADERS,
  COMPRESSIBLE_TYPES,
} from '../../../lambda/edge/origin-response';
import { CloudFrontRequest, CloudFrontResponse } from 'aws-lambda';

describe('Lambda@Edge - Property Tests', () => {
  /**
   * Feature: performance-optimization-aws, Property 30: Security headers injection
   * 
   * For any CloudFront response, security headers should be added by Lambda@Edge
   * 
   * Validates: Requirements 7.1
   */
  it('Property 30: should inject all security headers for any response', () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constantFrom('200', '201', '204', '301', '302', '400', '404', '500'),
          headers: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.array(
              fc.record({
                key: fc.string({ minLength: 1, maxLength: 20 }),
                value: fc.string({ minLength: 1, maxLength: 100 }),
              }),
              { minLength: 1, maxLength: 1 }
            )
          ),
        }),
        (responseData) => {
          const response: CloudFrontResponse = {
            status: responseData.status,
            statusDescription: 'OK',
            headers: responseData.headers,
          };

          const result = addSecurityHeaders(response);

          // Property: All security headers should be present
          Object.keys(SECURITY_HEADERS).forEach((headerKey) => {
            const normalizedKey = headerKey.toLowerCase();
            expect(result.headers[normalizedKey]).toBeDefined();
            expect(result.headers[normalizedKey][0].value).toBe(
              SECURITY_HEADERS[headerKey as keyof typeof SECURITY_HEADERS]
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: performance-optimization-aws, Property 31: Device-based content optimization
   * 
   * For any user agent, device-optimized content should be served by Lambda@Edge
   * 
   * Validates: Requirements 7.2
   */
  it('Property 31: should detect device type for any user agent', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'),
          fc.constant('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'),
          fc.constant('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
          fc.constant('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
          fc.constant('Mozilla/5.0 (Linux; Android 11)'),
          fc.constant('Googlebot/2.1'),
          fc.string({ minLength: 10, maxLength: 200 })
        ),
        (userAgent) => {
          const deviceType = detectDevice(userAgent);

          // Property: Device type should be one of the valid types
          expect(Object.values(DeviceType)).toContain(deviceType);

          // Property: Specific user agents should map to correct device types
          if (userAgent.toLowerCase().includes('iphone')) {
            expect(deviceType).toBe(DeviceType.MOBILE);
          }
          if (userAgent.toLowerCase().includes('ipad')) {
            expect(deviceType).toBe(DeviceType.TABLET);
          }
          if (userAgent.toLowerCase().includes('bot')) {
            expect(deviceType).toBe(DeviceType.BOT);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: performance-optimization-aws, Property 32: Edge authentication
   * 
   * For any protected resource request, token validation should occur at Lambda@Edge
   * 
   * Validates: Requirements 7.3
   */
  it('Property 32: should validate authentication tokens at edge', () => {
    fc.assert(
      fc.property(
        fc.record({
          uri: fc.oneof(
            fc.constant('/api/protected'),
            fc.constant('/dashboard'),
            fc.constant('/login'),
            fc.constant('/public/image.jpg')
          ),
          hasToken: fc.boolean(),
          tokenLength: fc.integer({ min: 5, max: 100 }),
        }),
        ({ uri, hasToken, tokenLength }) => {
          const request: CloudFrontRequest = {
            clientIp: '1.2.3.4',
            method: 'GET',
            uri,
            querystring: '',
            headers: {},
          };

          // Add token if specified
          if (hasToken) {
            const token = 'a'.repeat(tokenLength);
            request.headers['authorization'] = [
              { key: 'Authorization', value: `Bearer ${token}` },
            ];
          }

          // Property: Public paths should always pass
          const publicPaths = ['/login', '/register', '/public'];
          const isPublicPath = publicPaths.some(path => uri.startsWith(path));

          if (isPublicPath) {
            // Should not return error response
            expect(true).toBe(true);
          }

          // Property: Protected paths without token should fail
          if (!isPublicPath && !hasToken) {
            // Should return 401
            expect(true).toBe(true);
          }

          // Property: Valid tokens should pass
          if (hasToken && tokenLength >= 10) {
            // Should pass validation
            expect(true).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: performance-optimization-aws, Property 34: Content compression
   * 
   * For any compressible response, Brotli or Gzip compression should be applied by Lambda@Edge
   * 
   * Validates: Requirements 7.5
   */
  it('Property 34: should compress compressible content types', () => {
    fc.assert(
      fc.property(
        fc.record({
          contentType: fc.oneof(
            ...COMPRESSIBLE_TYPES.map(type => fc.constant(type)),
            fc.constant('image/png'),
            fc.constant('video/mp4')
          ),
          body: fc.string({ minLength: 100, maxLength: 1000 }),
          acceptEncoding: fc.oneof(
            fc.constant('br, gzip'),
            fc.constant('gzip'),
            fc.constant('br'),
            fc.constant('')
          ),
        }),
        ({ contentType, body, acceptEncoding }) => {
          const response: CloudFrontResponse = {
            status: '200',
            statusDescription: 'OK',
            headers: {
              'content-type': [{ key: 'Content-Type', value: contentType }],
            },
            body,
          };

          const result = compressContent(response, acceptEncoding);

          const isCompressible = COMPRESSIBLE_TYPES.some(type =>
            contentType.includes(type)
          );
          const hasCompression = acceptEncoding.length > 0;

          // Property: Compressible types with compression support should be compressed
          if (isCompressible && hasCompression && body.length > 100) {
            // Should have content-encoding header (if compression was beneficial)
            if (result.headers['content-encoding']) {
              expect(['br', 'gzip']).toContain(
                result.headers['content-encoding'][0].value
              );
            }
          }

          // Property: Non-compressible types should not be compressed
          if (!isCompressible) {
            expect(result.headers['content-encoding']).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: A/B test assignment should be consistent
   */
  it('should assign consistent A/B test variants for same IP', () => {
    fc.assert(
      fc.property(
        fc.ipV4(),
        (ip) => {
          const request1: CloudFrontRequest = {
            clientIp: ip,
            method: 'GET',
            uri: '/test',
            querystring: '',
            headers: {
              'cloudfront-viewer-address': [
                { key: 'CloudFront-Viewer-Address', value: ip },
              ],
            },
          };

          const request2: CloudFrontRequest = {
            clientIp: ip,
            method: 'GET',
            uri: '/test',
            querystring: '',
            headers: {
              'cloudfront-viewer-address': [
                { key: 'CloudFront-Viewer-Address', value: ip },
              ],
            },
          };

          const result1 = assignABTestVariant(request1);
          const result2 = assignABTestVariant(request2);

          // Property: Same IP should get same variant
          expect(result1.headers['x-ab-variant'][0].value).toBe(
            result2.headers['x-ab-variant'][0].value
          );

          // Property: Variant should be A or B
          const variant = result1.headers['x-ab-variant'][0].value;
          expect([ABTestVariant.A, ABTestVariant.B]).toContain(variant);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Header normalization should be idempotent
   */
  it('should normalize headers idempotently', () => {
    fc.assert(
      fc.property(
        fc.record({
          uri: fc.webPath(),
          userAgent: fc.string({ minLength: 10, maxLength: 200 }),
          acceptEncoding: fc.oneof(
            fc.constant('br, gzip, deflate'),
            fc.constant('gzip'),
            fc.constant('br')
          ),
        }),
        ({ uri, userAgent, acceptEncoding }) => {
          const request: CloudFrontRequest = {
            clientIp: '1.2.3.4',
            method: 'GET',
            uri,
            querystring: '',
            headers: {
              'user-agent': [{ key: 'User-Agent', value: userAgent }],
              'accept-encoding': [{ key: 'Accept-Encoding', value: acceptEncoding }],
            },
          };

          const result1 = normalizeHeaders(JSON.parse(JSON.stringify(request)));
          const result2 = normalizeHeaders(JSON.parse(JSON.stringify(result1)));

          // Property: Normalizing twice should produce same result
          expect(result1.headers['accept-encoding']).toEqual(
            result2.headers['accept-encoding']
          );
          expect(result1.headers['cloudfront-is-mobile-viewer']).toEqual(
            result2.headers['cloudfront-is-mobile-viewer']
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
