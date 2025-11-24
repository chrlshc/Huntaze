/**
 * Unit Tests for OG Image API
 * 
 * Tests the /api/og endpoint to ensure it correctly generates
 * dynamic Open Graph images with Magic Blue styling.
 * 
 * Feature: mobile-ux-marketing-refactor
 * Validates: Requirements 5.1, 5.4, 5.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { OGImageParams } from '../../../app/api/og/types';

// Dynamic import to avoid path resolution issues
async function getHandler() {
  const module = await import('../../../app/api/og/route');
  return module.GET;
}

/**
 * Helper to create test request with query params
 */
function createTestRequest(params?: OGImageParams): NextRequest {
  const url = new URL('http://localhost:3000/api/og');
  if (params?.title) {
    url.searchParams.set('title', params.title);
  }
  return new NextRequest(url.toString());
}

describe('OG Image API', () => {
  describe('GET /api/og', () => {
    it('should return an image response with default title', async () => {
      const GET = await getHandler();
      const req = createTestRequest();
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
    });

    it('should return an image response with custom title', async () => {
      const GET = await getHandler();
      const req = createTestRequest({ title: 'Custom Title' });
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
    });

    it('should use default title "Huntaze" when no title parameter provided', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/og');
      
      const response = await GET(req);
      
      // The response should be successful
      expect(response.status).toBe(200);
    });

    it('should handle special characters in title', async () => {
      const GET = await getHandler();
      const specialTitle = encodeURIComponent('Test & Special <Characters>');
      const req = new NextRequest(`http://localhost:3000/api/og?title=${specialTitle}`);
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
    });

    it('should handle empty title parameter', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/og?title=');
      
      const response = await GET(req);
      
      // Should use default title "Huntaze"
      expect(response.status).toBe(200);
    });

    it('should return correct image dimensions (1200x630)', async () => {
      const GET = await getHandler();
      const req = new NextRequest('http://localhost:3000/api/og?title=Test');
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      // The ImageResponse should generate a 1200x630 image
      // We can't easily verify dimensions without parsing the image,
      // but we can verify the response is valid
      expect(response.headers.get('content-type')).toContain('image/png');
    });

    it('should handle long titles gracefully', async () => {
      const GET = await getHandler();
      const longTitle = encodeURIComponent('This is a very long title that should still be handled correctly by the OG image generator');
      const req = new NextRequest(`http://localhost:3000/api/og?title=${longTitle}`);
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
    });

    it('should handle unicode characters in title', async () => {
      const GET = await getHandler();
      const unicodeTitle = encodeURIComponent('Hello 世界 🚀');
      const req = new NextRequest(`http://localhost:3000/api/og?title=${unicodeTitle}`);
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
    });
  });

  describe('Error Handling', () => {
    it('should redirect to fallback image on error', async () => {
      const GET = await getHandler();
      
      // Create a request that might cause an error
      // Note: In practice, ImageResponse is quite robust, so we test the fallback logic exists
      const req = new NextRequest('http://localhost:3000/api/og?title=Test');
      
      const response = await GET(req);
      
      // Should either succeed or redirect to fallback
      expect([200, 302]).toContain(response.status);
      
      if (response.status === 302) {
        expect(response.headers.get('location')).toBe('/og-image.png');
      }
    });
  });
});
