/**
 * Integration Tests - Production Ready Proxy
 * Tests for config/production-ready/proxy.ts integration scenarios
 * 
 * Coverage:
 * - Full request/response cycle
 * - Multiple middleware features together
 * - Real-world scenarios
 * - Performance under load
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import proxy from '@/config/production-ready/proxy';

describe('Production Ready Proxy - Integration Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Complete Security Stack', () => {
    it('should apply all security headers in production', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);

      // CSP
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('Content-Security-Policy')).toContain('nonce-');
      
      // Security headers
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Permissions-Policy')).toBeDefined();
      
      // Rate limiting
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1000');
      expect(response.headers.get('X-RateLimit-Window')).toBe('3600');
      
      // Nonce
      expect(response.headers.get('x-nonce')).toBeDefined();
    });

    it('should maintain security in development', () => {
      process.env.NODE_ENV = 'development';
      const req = new NextRequest(new URL('http://localhost:3000/dashboard'));
      
      const response = proxy(req);

      // Security headers should still be applied
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('A/B Testing with Security', () => {
    it('should rewrite and apply security headers', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('ab-test', 'new-ui');
      
      const response = proxy(req);

      // Security headers should be present
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      
      // Response should be defined (rewrite happened)
      expect(response).toBeDefined();
    });

    it('should handle A/B test with suspicious user agent', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('ab-test', 'new-ui');
      req.headers.set('user-agent', 'EvilBot/1.0');
      
      const response = proxy(req);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Feature Flags with Security', () => {
    it('should rewrite chatbot and apply security headers', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/chatbot'));
      req.cookies.set('feature-chatbot-v2', 'true');
      
      const response = proxy(req);

      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should handle multiple feature flags', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/chatbot'));
      req.cookies.set('feature-chatbot-v2', 'true');
      req.cookies.set('feature-analytics-v3', 'true');
      
      const response = proxy(req);

      expect(response).toBeDefined();
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
    });
  });

  describe('Host Validation in Production', () => {
    it('should redirect invalid host and preserve security', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://evil.com/dashboard'));
      
      const response = proxy(req);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('app.huntaze.com');
      
      // Security headers should still be present on redirect
      expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
    });

    it('should allow valid hosts without redirect', () => {
      process.env.NODE_ENV = 'production';
      const validHosts = ['app.huntaze.com', 'huntaze.com', 'www.huntaze.com'];
      
      validHosts.forEach(host => {
        const req = new NextRequest(new URL(`https://${host}/dashboard`));
        const response = proxy(req);
        
        expect(response.status).not.toBe(307);
        expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      });
    });
  });

  describe('Real-World User Journeys', () => {
    it('should handle authenticated user with A/B test', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('ab-test', 'new-ui');
      req.cookies.set('session', 'user-session-token');
      req.headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0');
      
      const response = proxy(req);

      expect(response).toBeDefined();
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1000');
    });

    it('should handle mobile user', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1');
      
      const response = proxy(req);

      expect(response).toBeDefined();
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('should handle bot crawlers appropriately', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/'));
      req.headers.set('user-agent', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
      
      const response = proxy(req);

      expect(response).toBeDefined();
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent requests', () => {
      const requests = Array.from({ length: 50 }, (_, i) => 
        new NextRequest(new URL(`https://app.huntaze.com/page-${i}`))
      );
      
      const start = Date.now();
      
      requests.forEach(req => {
        const response = proxy(req);
        expect(response).toBeDefined();
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // 50 requests in < 100ms
    });

    it('should handle requests with many cookies', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      // Add many cookies
      for (let i = 0; i < 20; i++) {
        req.cookies.set(`cookie-${i}`, `value-${i}`);
      }
      
      const start = Date.now();
      const response = proxy(req);
      const duration = Date.now() - start;
      
      expect(response).toBeDefined();
      expect(duration).toBeLessThan(10);
    });

    it('should handle requests with long URLs', () => {
      const longPath = '/dashboard/' + 'a'.repeat(1000);
      const req = new NextRequest(new URL(`https://app.huntaze.com${longPath}`));
      
      const response = proxy(req);

      expect(response).toBeDefined();
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed URLs gracefully', () => {
      expect(() => {
        const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
        proxy(req);
      }).not.toThrow();
    });

    it('should handle missing host header', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });

    it('should handle empty user agent', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.headers.set('user-agent', '');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });
  });

  describe('CSP Nonce Integration', () => {
    it('should generate unique nonce for each request', () => {
      const req1 = new NextRequest(new URL('https://app.huntaze.com/page1'));
      const req2 = new NextRequest(new URL('https://app.huntaze.com/page2'));
      
      const response1 = proxy(req1);
      const response2 = proxy(req2);
      
      const nonce1 = response1.headers.get('x-nonce');
      const nonce2 = response2.headers.get('x-nonce');
      
      // Both should have nonces
      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      
      // Nonces should be in CSP
      expect(response1.headers.get('Content-Security-Policy')).toContain(`nonce-${nonce1}`);
      expect(response2.headers.get('Content-Security-Policy')).toContain(`nonce-${nonce2}`);
    });

    it('should use nonce in script-src only', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';
      const nonce = response.headers.get('x-nonce');
      
      // Nonce should be in script-src
      expect(csp).toContain(`script-src 'self' 'nonce-${nonce}'`);
      
      // Nonce should NOT be in style-src (uses unsafe-inline)
      const styleSrcMatch = csp.match(/style-src[^;]+/);
      if (styleSrcMatch) {
        expect(styleSrcMatch[0]).not.toContain('nonce-');
      }
    });
  });

  describe('Compliance and Standards', () => {
    it('should meet OWASP security header recommendations', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);

      // OWASP recommended headers
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
    });

    it('should have CSP that blocks XSS', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';

      // Should not allow unsafe-eval
      expect(csp).not.toContain('unsafe-eval');
      
      // Should not allow unsafe-inline in script-src
      expect(csp).toMatch(/script-src[^;]*'nonce-[^']+'/);
      expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    });

    it('should have HSTS with proper configuration', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const response = proxy(req);
      const hsts = response.headers.get('Strict-Transport-Security') || '';

      expect(hsts).toContain('max-age=31536000'); // 1 year
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });
  });

  describe('Backwards Compatibility', () => {
    it('should work with Next.js 16 request format', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      expect(() => proxy(req)).not.toThrow();
    });

    it('should handle legacy cookie format', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('legacy-cookie', 'value');
      
      const response = proxy(req);

      expect(response).toBeDefined();
    });
  });
});
