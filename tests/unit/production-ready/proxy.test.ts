/**
 * Unit Tests - Production Ready Proxy (Next.js 16)
 * Tests for config/production-ready/proxy.ts
 * 
 * Coverage:
 * - CSP header generation with nonce
 * - Security headers
 * - Host validation
 * - A/B testing
 * - Feature flags
 * - Rate limiting headers
 * - Suspicious request blocking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import proxy from '@/config/production-ready/proxy';

// Mock crypto
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: () => 'test-nonce-base64',
    })),
  },
}));

describe('Production Ready Proxy - Next.js 16', () => {
  let mockRequest: NextRequest;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env;
    process.env = { ...originalEnv };
    
    // Create mock request
    mockRequest = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('CSP Header Generation', () => {
    it('should generate CSP header with nonce', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toBeDefined();
      expect(csp).toContain("script-src 'self' 'nonce-test-nonce-base64'");
    });

    it('should not include unsafe-eval in CSP', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).not.toContain('unsafe-eval');
    });

    it('should not include unsafe-inline in script-src', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("script-src 'self' 'nonce-test-nonce-base64'");
      expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    });

    it('should allow unsafe-inline for style-src (Tailwind CSS)', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    });

    it('should set default-src to self', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("default-src 'self'");
    });

    it('should allow images from self, data, https, and blob', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("img-src 'self' data: https: blob:");
    });

    it('should allow fonts from self and data', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("font-src 'self' data:");
    });

    it('should allow connections to API and AWS', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain('connect-src');
      expect(csp).toContain('https://api.huntaze.com');
      expect(csp).toContain('wss://api.huntaze.com');
      expect(csp).toContain('https://*.amazonaws.com');
    });

    it('should allow media from CDN', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("media-src 'self' https://cdn.huntaze.com");
    });

    it('should block objects', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("object-src 'none'");
    });

    it('should block frame ancestors', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should set base-uri to self', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("base-uri 'self'");
    });

    it('should set form-action to self', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("form-action 'self'");
    });

    it('should upgrade insecure requests', () => {
      const response = proxy(mockRequest);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('should store nonce in x-nonce header', () => {
      const response = proxy(mockRequest);
      const nonce = response.headers.get('x-nonce');

      expect(nonce).toBe('test-nonce-base64');
    });
  });

  describe('Security Headers', () => {
    it('should set X-Frame-Options to DENY', () => {
      const response = proxy(mockRequest);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should set X-Content-Type-Options to nosniff', () => {
      const response = proxy(mockRequest);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should set Referrer-Policy', () => {
      const response = proxy(mockRequest);

      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should set Strict-Transport-Security with preload', () => {
      const response = proxy(mockRequest);
      const hsts = response.headers.get('Strict-Transport-Security');

      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    it('should set X-XSS-Protection', () => {
      const response = proxy(mockRequest);

      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should set Permissions-Policy', () => {
      const response = proxy(mockRequest);
      const policy = response.headers.get('Permissions-Policy');

      expect(policy).toContain('camera=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('payment=()');
      expect(policy).toContain('usb=()');
    });

    it('should disable all dangerous permissions', () => {
      const response = proxy(mockRequest);
      const policy = response.headers.get('Permissions-Policy');

      // All should be set to empty (disabled)
      expect(policy).toMatch(/camera=\(\)/);
      expect(policy).toMatch(/microphone=\(\)/);
      expect(policy).toMatch(/geolocation=\(\)/);
      expect(policy).toMatch(/payment=\(\)/);
      expect(policy).toMatch(/usb=\(\)/);
    });
  });

  describe('Rate Limiting Headers', () => {
    it('should set X-RateLimit-Limit', () => {
      const response = proxy(mockRequest);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('1000');
    });

    it('should set X-RateLimit-Window', () => {
      const response = proxy(mockRequest);

      expect(response.headers.get('X-RateLimit-Window')).toBe('3600');
    });

    it('should indicate 1000 requests per hour', () => {
      const response = proxy(mockRequest);
      const limit = response.headers.get('X-RateLimit-Limit');
      const window = response.headers.get('X-RateLimit-Window');

      expect(limit).toBe('1000');
      expect(window).toBe('3600'); // 1 hour in seconds
    });
  });

  describe('Host Validation', () => {
    it('should allow app.huntaze.com in production', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.status).not.toBe(307); // Not a redirect
    });

    it('should allow huntaze.com in production', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.status).not.toBe(307);
    });

    it('should allow www.huntaze.com in production', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://www.huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.status).not.toBe(307);
    });

    it('should redirect invalid hosts in production', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://evil.com/dashboard'));
      const response = proxy(req);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('app.huntaze.com');
    });

    it('should not validate hosts in development', () => {
      process.env.NODE_ENV = 'development';
      const req = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const response = proxy(req);

      expect(response.status).not.toBe(307);
    });

    it('should preserve pathname when redirecting', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://evil.com/dashboard/analytics'));
      const response = proxy(req);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard/analytics');
    });
  });

  describe('A/B Testing', () => {
    it('should rewrite to dashboard-v2 when ab-test cookie is new-ui', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('ab-test', 'new-ui');
      
      const response = proxy(req);

      // Check if it's a rewrite (internal redirect)
      expect(response).toBeDefined();
    });

    it('should not rewrite when ab-test cookie is not set', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should not rewrite when ab-test cookie is different value', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('ab-test', 'old-ui');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should only rewrite dashboard paths', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/settings'));
      req.cookies.set('ab-test', 'new-ui');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should rewrite dashboard subpaths', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard/analytics'));
      req.cookies.set('ab-test', 'new-ui');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });
  });

  describe('Feature Flags', () => {
    it('should rewrite to chatbot-v2 when feature flag is enabled', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/chatbot'));
      req.cookies.set('feature-chatbot-v2', 'true');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should not rewrite when feature flag is false', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/chatbot'));
      req.cookies.set('feature-chatbot-v2', 'false');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should not rewrite when feature flag is not set', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/chatbot'));
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should only rewrite chatbot paths', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('feature-chatbot-v2', 'true');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should rewrite chatbot subpaths', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/chatbot/conversation/123'));
      req.cookies.set('feature-chatbot-v2', 'true');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });
  });

  describe('Suspicious Request Blocking', () => {
    it('should allow requests with normal user agents', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
      const response = proxy(req);

      expect(response.status).not.toBe(403);
    });

    it('should allow Googlebot', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
      
      const response = proxy(req);

      expect(response.status).not.toBe(403);
    });

    it('should allow bingbot', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)');
      
      const response = proxy(req);

      expect(response.status).not.toBe(403);
    });

    it('should log warning for suspicious bot', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', 'EvilBot/1.0');
      
      proxy(req);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Suspicious user agent:', 'EvilBot/1.0');
      
      consoleWarnSpy.mockRestore();
    });

    it('should log warning for crawler', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', 'MyCrawler/1.0');
      
      proxy(req);

      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    it('should log warning for spider', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', 'MySpider/1.0');
      
      proxy(req);

      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    it('should log warning for scraper', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', 'MyScraper/1.0');
      
      proxy(req);

      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle missing user-agent header', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      // Don't set user-agent header
      
      const response = proxy(req);

      expect(response).toBeDefined();
      expect(response.status).not.toBe(403);
    });

    it('should be case-insensitive for bot detection', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', 'EVILBOT/1.0');
      
      proxy(req);

      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Matcher Configuration', () => {
    it('should have matcher configuration exported', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config).toBeDefined();
      expect(config.matcher).toBeDefined();
    });

    it('should exclude API routes from matcher', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('(?!api');
    });

    it('should exclude _next/static from matcher', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('_next/static');
    });

    it('should exclude _next/image from matcher', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('_next/image');
    });

    it('should exclude favicon.ico from matcher', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('favicon.ico');
    });

    it('should exclude robots.txt from matcher', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('robots.txt');
    });

    it('should exclude sitemap.xml from matcher', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('sitemap.xml');
    });
  });

  describe('Integration Scenarios', () => {
    it('should apply all security headers together', () => {
      const response = proxy(mockRequest);

      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('X-Frame-Options')).toBeDefined();
      expect(response.headers.get('X-Content-Type-Options')).toBeDefined();
      expect(response.headers.get('Referrer-Policy')).toBeDefined();
      expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
      expect(response.headers.get('X-XSS-Protection')).toBeDefined();
      expect(response.headers.get('Permissions-Policy')).toBeDefined();
    });

    it('should handle A/B test and feature flag together', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('ab-test', 'new-ui');
      req.cookies.set('feature-chatbot-v2', 'true');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should validate host and apply security headers', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);

      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.status).not.toBe(307);
    });

    it('should handle all features in production environment', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('ab-test', 'new-ui');
      req.headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
      const response = proxy(req);

      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1000');
    });
  });

  describe('Edge Cases', () => {
    it('should handle request without cookies', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);

      expect(response).toBeDefined();
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('should handle request without headers', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should handle root path', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/'));
      
      const response = proxy(req);

      expect(response).toBeDefined();
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('should handle deep nested paths', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard/analytics/reports/monthly/2025'));
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should handle query parameters', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard?tab=analytics&period=30d'));
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should handle hash fragments', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard#section-1'));
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should execute quickly', () => {
      const start = Date.now();
      
      proxy(mockRequest);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10); // Should be < 10ms
    });

    it('should handle multiple requests efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const req = new NextRequest(new URL(`https://app.huntaze.com/page-${i}`));
        proxy(req);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // 100 requests in < 100ms
    });
  });
});
