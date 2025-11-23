/**
 * Unit Tests for CSRF Token API
 * 
 * Tests the /api/csrf/token endpoint to ensure it correctly generates
 * and returns CSRF tokens with proper cookie configuration.
 * 
 * Feature: production-critical-fixes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Dynamic import to avoid path resolution issues
async function getHandler() {
  const module = await import('../../../app/api/csrf/token/route');
  return module.GET;
}

describe('CSRF Token API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/csrf/token', () => {
    it('should return a CSRF token', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/csrf/token');
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');
      expect(body.token.length).toBeGreaterThan(0);
    });

    it('should set CSRF token cookie', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/csrf/token');
      
      const response = await GET(req);
      
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain('csrf-token=');
    });

    it('should return token matching cookie value', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/csrf/token');
      
      const response = await GET(req);
      
      const body = await response.json();
      const setCookieHeader = response.headers.get('set-cookie');
      
      // Extract token from cookie
      const cookieMatch = setCookieHeader?.match(/csrf-token=([^;]+)/);
      expect(cookieMatch).toBeTruthy();
      
      const cookieToken = cookieMatch![1];
      expect(cookieToken).toBe(body.token);
    });

    it('should generate unique tokens on each request', async () => {
      const GET = await getHandler();
      const req1 = new NextRequest('http://localhost:3000/api/csrf/token');
      const req2 = new NextRequest('http://localhost:3000/api/csrf/token');
      
      const response1 = await GET(req1);
      const response2 = await GET(req2);
      
      const body1 = await response1.json();
      const body2 = await response2.json();
      
      expect(body1.token).not.toBe(body2.token);
    });

    it('should set cookie with 24-hour expiration', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/csrf/token');
      
      const response = await GET(req);
      
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('Max-Age=86400'); // 24 hours in seconds
    });

    it('should set cookie with SameSite=Lax', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/csrf/token');
      
      const response = await GET(req);
      
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader?.toLowerCase()).toContain('samesite=lax');
    });

    it('should set cookie with Path=/', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/csrf/token');
      
      const response = await GET(req);
      
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('Path=/');
    });

    it('should set cookie with HttpOnly flag', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/csrf/token');
      
      const response = await GET(req);
      
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('HttpOnly');
    });
  });
});
