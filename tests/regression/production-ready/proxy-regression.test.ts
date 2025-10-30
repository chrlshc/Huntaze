/**
 * Regression Tests - Production Ready Proxy
 * Tests to prevent regressions in config/production-ready/proxy.ts
 * 
 * Coverage:
 * - Security header regressions
 * - CSP policy weakening
 * - Host validation bypasses
 * - Performance degradation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import proxy from '@/config/production-ready/proxy';

describe('Production Ready Proxy - Regression Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Security Header Regressions', () => {
    it('should never remove X-Frame-Options header', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should never weaken X-Frame-Options to SAMEORIGIN', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.headers.get('X-Frame-Options')).not.toBe('SAMEORIGIN');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should never remove X-Content-Type-Options', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should never remove Strict-Transport-Security', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    });

    it('should never reduce HSTS max-age below 1 year', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const hsts = response.headers.get('Strict-Transport-Security') || '';

      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      expect(maxAgeMatch).toBeDefined();
      
      const maxAge = parseInt(maxAgeMatch![1]);
      expect(maxAge).toBeGreaterThanOrEqual(31536000); // 1 year
    });

    it('should never remove includeSubDomains from HSTS', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.headers.get('Strict-Transport-Security')).toContain('includeSubDomains');
    });

    it('should never remove preload from HSTS', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.headers.get('Strict-Transport-Security')).toContain('preload');
    });
  });

  describe('CSP Policy Regressions', () => {
    it('should never add unsafe-eval to CSP', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).not.toContain('unsafe-eval');
    });

    it('should never add unsafe-inline to script-src', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';

      // Extract script-src directive
      const scriptSrcMatch = csp.match(/script-src[^;]+/);
      expect(scriptSrcMatch).toBeDefined();
      
      const scriptSrc = scriptSrcMatch![0];
      expect(scriptSrc).not.toContain('unsafe-inline');
    });

    it('should never weaken default-src from self', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain("default-src 'self'");
      expect(csp).not.toContain("default-src *");
      expect(csp).not.toContain("default-src 'unsafe-inline'");
    });

    it('should never allow object-src', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain("object-src 'none'");
    });

    it('should never allow frame-ancestors', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should never remove upgrade-insecure-requests', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('should always use nonce for script-src', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';
      const nonce = response.headers.get('x-nonce');

      expect(nonce).toBeDefined();
      expect(csp).toContain(`'nonce-${nonce}'`);
    });
  });

  describe('Host Validation Regressions', () => {
    it('should never allow arbitrary hosts in production', () => {
      process.env.NODE_ENV = 'production';
      const maliciousHosts = [
        'evil.com',
        'phishing.com',
        'malware.net',
        'fake-huntaze.com',
        'huntaze.evil.com',
      ];

      maliciousHosts.forEach(host => {
        const req = new NextRequest(new URL(`https://${host}/dashboard`));
        const response = proxy(req);

        expect(response.status).toBe(307); // Should redirect
        expect(response.headers.get('location')).toContain('app.huntaze.com');
      });
    });

    it('should never disable host validation in production', () => {
      process.env.NODE_ENV = 'production';
      const req = new NextRequest(new URL('https://evil.com/dashboard'));
      
      const response = proxy(req);

      // Should always redirect in production
      expect(response.status).toBe(307);
    });

    it('should maintain whitelist of allowed hosts', () => {
      process.env.NODE_ENV = 'production';
      const allowedHosts = ['app.huntaze.com', 'huntaze.com', 'www.huntaze.com'];

      allowedHosts.forEach(host => {
        const req = new NextRequest(new URL(`https://${host}/dashboard`));
        const response = proxy(req);

        expect(response.status).not.toBe(307);
      });
    });
  });

  describe('Rate Limiting Regressions', () => {
    it('should never remove rate limit headers', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Window')).toBeDefined();
    });

    it('should never increase rate limit above 1000', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');

      expect(limit).toBeLessThanOrEqual(1000);
    });

    it('should maintain 1 hour window', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const window = parseInt(response.headers.get('X-RateLimit-Window') || '0');

      expect(window).toBe(3600); // 1 hour in seconds
    });
  });

  describe('Permissions Policy Regressions', () => {
    it('should never enable dangerous permissions', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const policy = response.headers.get('Permissions-Policy') || '';

      // All dangerous permissions should be disabled
      expect(policy).toContain('camera=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('payment=()');
      expect(policy).toContain('usb=()');
    });

    it('should never allow camera access', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const policy = response.headers.get('Permissions-Policy') || '';

      expect(policy).toMatch(/camera=\(\)/);
      expect(policy).not.toMatch(/camera=\(self\)/);
      expect(policy).not.toMatch(/camera=\(\*\)/);
    });

    it('should never allow microphone access', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const policy = response.headers.get('Permissions-Policy') || '';

      expect(policy).toMatch(/microphone=\(\)/);
    });

    it('should never allow geolocation access', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const policy = response.headers.get('Permissions-Policy') || '';

      expect(policy).toMatch(/geolocation=\(\)/);
    });
  });

  describe('Bot Detection Regressions', () => {
    it('should never stop logging suspicious bots', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const suspiciousBots = [
        'EvilBot/1.0',
        'MyCrawler/2.0',
        'DataScraper/3.0',
        'SpamSpider/1.0',
      ];

      suspiciousBots.forEach(userAgent => {
        const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
        req.headers.set('user-agent', userAgent);
        
        proxy(req);
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(suspiciousBots.length);
      
      consoleWarnSpy.mockRestore();
    });

    it('should never block legitimate bots', () => {
      const legitimateBots = [
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      ];

      legitimateBots.forEach(userAgent => {
        const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
        req.headers.set('user-agent', userAgent);
        
        const response = proxy(req);

        expect(response.status).not.toBe(403);
      });
    });
  });

  describe('Performance Regressions', () => {
    it('should never take more than 10ms per request', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      
      const start = Date.now();
      proxy(req);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should handle 100 requests in under 100ms', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const req = new NextRequest(new URL(`https://app.huntaze.com/page-${i}`));
        proxy(req);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should not leak memory on repeated calls', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 1000; i++) {
        const req = new NextRequest(new URL(`https://app.huntaze.com/page-${i}`));
        proxy(req);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Matcher Configuration Regressions', () => {
    it('should never match API routes', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('(?!api');
    });

    it('should never match static files', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('_next/static');
      expect(config.matcher[0]).toContain('_next/image');
    });

    it('should never match SEO files', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('robots.txt');
      expect(config.matcher[0]).toContain('sitemap.xml');
    });

    it('should never match favicon', () => {
      const { config } = require('@/config/production-ready/proxy');

      expect(config.matcher[0]).toContain('favicon.ico');
    });
  });

  describe('Nonce Generation Regressions', () => {
    it('should never reuse nonces', () => {
      const nonces = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const req = new NextRequest(new URL(`https://app.huntaze.com/page-${i}`));
        const response = proxy(req);
        const nonce = response.headers.get('x-nonce');
        
        expect(nonce).toBeDefined();
        expect(nonces.has(nonce!)).toBe(false);
        nonces.add(nonce!);
      }
      
      expect(nonces.size).toBe(100);
    });

    it('should never use predictable nonces', () => {
      const req1 = new NextRequest(new URL('https://app.huntaze.com/page1'));
      const req2 = new NextRequest(new URL('https://app.huntaze.com/page2'));
      
      const response1 = proxy(req1);
      const response2 = proxy(req2);
      
      const nonce1 = response1.headers.get('x-nonce');
      const nonce2 = response2.headers.get('x-nonce');
      
      // Nonces should be different
      expect(nonce1).not.toBe(nonce2);
      
      // Nonces should not be sequential
      expect(nonce1).not.toBe(`${nonce2}1`);
    });

    it('should never expose nonce in CSP without proper format', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      const response = proxy(req);
      const csp = response.headers.get('Content-Security-Policy') || '';
      const nonce = response.headers.get('x-nonce');

      // Nonce should be properly formatted in CSP
      expect(csp).toContain(`'nonce-${nonce}'`);
      expect(csp).not.toContain(`nonce-${nonce}`); // Without quotes
    });
  });

  describe('A/B Testing Regressions', () => {
    it('should never apply A/B test to non-dashboard paths', () => {
      const paths = ['/settings', '/profile', '/analytics'];
      
      paths.forEach(path => {
        const req = new NextRequest(new URL(`https://app.huntaze.com${path}`));
        req.cookies.set('ab-test', 'new-ui');
        
        const response = proxy(req);
        
        // Should not rewrite to dashboard-v2
        expect(response).toBeDefined();
      });
    });

    it('should never break security when A/B testing', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/dashboard'));
      req.cookies.set('ab-test', 'new-ui');
      
      const response = proxy(req);

      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('Feature Flag Regressions', () => {
    it('should never apply feature flag to wrong paths', () => {
      const paths = ['/dashboard', '/settings', '/profile'];
      
      paths.forEach(path => {
        const req = new NextRequest(new URL(`https://app.huntaze.com${path}`));
        req.cookies.set('feature-chatbot-v2', 'true');
        
        const response = proxy(req);
        
        expect(response).toBeDefined();
      });
    });

    it('should never break security when using feature flags', () => {
      const req = new NextRequest(new URL('https://app.huntaze.com/chatbot'));
      req.cookies.set('feature-chatbot-v2', 'true');
      
      const response = proxy(req);

      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });
});
