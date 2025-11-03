/**
 * Unit Tests - Content Extractor Service
 * 
 * Tests for URL content extraction functionality
 * Based on: .kiro/specs/content-creation/tasks.md (Task 13.1)
 * 
 * Coverage:
 * - URL validation
 * - HTML parsing
 * - Open Graph extraction
 * - Twitter Card extraction
 * - Meta tag extraction
 * - Image extraction
 * - Content validation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractContentFromUrl,
  validateExtractedContent,
} from '@/lib/services/contentExtractor';

// Mock fetch
global.fetch = vi.fn();

describe('Content Extractor Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractContentFromUrl', () => {
    describe('URL Validation', () => {
      it('should accept valid HTTP URL', async () => {
        const mockHtml = '<html><head><title>Test</title></head><body>Content</body></html>';
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('http://example.com');
        expect(result).toBeDefined();
        expect(result.url).toBe('http://example.com');
      });

      it('should accept valid HTTPS URL', async () => {
        const mockHtml = '<html><head><title>Test</title></head><body>Content</body></html>';
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result).toBeDefined();
        expect(result.url).toBe('https://example.com');
      });

      it('should reject invalid protocol', async () => {
        await expect(
          extractContentFromUrl('ftp://example.com')
        ).rejects.toThrow('Invalid URL protocol');
      });

      it('should reject malformed URL', async () => {
        await expect(
          extractContentFromUrl('not-a-url')
        ).rejects.toThrow();
      });
    });

    describe('HTTP Response Handling', () => {
      it('should handle successful response', async () => {
        const mockHtml = '<html><head><title>Success</title></head><body>Content here</body></html>';
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.title).toBe('Success');
      });

      it('should handle 404 error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as Response);

        await expect(
          extractContentFromUrl('https://example.com/notfound')
        ).rejects.toThrow('Failed to fetch URL: 404 Not Found');
      });

      it('should handle 500 error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response);

        await expect(
          extractContentFromUrl('https://example.com')
        ).rejects.toThrow('Failed to fetch URL: 500 Internal Server Error');
      });

      it('should handle network error', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        await expect(
          extractContentFromUrl('https://example.com')
        ).rejects.toThrow('Failed to extract content');
      });
    });

    describe('Open Graph Extraction', () => {
      it('should extract og:title', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta property="og:title" content="OG Title" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.title).toBe('OG Title');
      });

      it('should extract og:description', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta property="og:description" content="OG Description" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.description).toBe('OG Description');
      });

      it('should extract og:image', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta property="og:image" content="https://example.com/image.jpg" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.images).toContain('https://example.com/image.jpg');
      });

      it('should extract og:site_name', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta property="og:site_name" content="Example Site" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.siteName).toBe('Example Site');
      });
    });

    describe('Twitter Card Extraction', () => {
      it('should extract twitter:title', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta name="twitter:title" content="Twitter Title" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.title).toBe('Twitter Title');
      });

      it('should extract twitter:description', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta name="twitter:description" content="Twitter Description" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.description).toBe('Twitter Description');
      });

      it('should prioritize OG over Twitter', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta property="og:title" content="OG Title" />
              <meta name="twitter:title" content="Twitter Title" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.title).toBe('OG Title');
      });
    });

    describe('Meta Tag Extraction', () => {
      it('should extract meta description', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta name="description" content="Meta Description" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.description).toBe('Meta Description');
      });

      it('should extract author', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta name="author" content="John Doe" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.author).toBe('John Doe');
      });

      it('should extract published date', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta property="article:published_time" content="2025-01-01T00:00:00Z" />
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.publishedDate).toBe('2025-01-01T00:00:00Z');
      });
    });

    describe('Title Extraction', () => {
      it('should extract title from <title> tag', async () => {
        const mockHtml = `
          <html>
            <head>
              <title>Page Title</title>
            </head>
            <body>Content</body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.title).toBe('Page Title');
      });

      it('should use "Untitled" if no title found', async () => {
        const mockHtml = '<html><body>Content</body></html>';
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.title).toBe('Untitled');
      });
    });

    describe('Content Extraction', () => {
      it('should extract main content', async () => {
        const mockHtml = `
          <html>
            <body>
              <main>
                <p>This is the main content of the page.</p>
              </main>
            </body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.content).toContain('main content');
      });

      it('should remove script tags', async () => {
        const mockHtml = `
          <html>
            <body>
              <script>alert('test');</script>
              <p>Content here</p>
            </body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.content).not.toContain('alert');
        expect(result.content).toContain('Content here');
      });

      it('should remove style tags', async () => {
        const mockHtml = `
          <html>
            <body>
              <style>.test { color: red; }</style>
              <p>Content here</p>
            </body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.content).not.toContain('color: red');
        expect(result.content).toContain('Content here');
      });

      it('should limit content to 5000 characters', async () => {
        const longContent = 'a'.repeat(10000);
        const mockHtml = `<html><body><p>${longContent}</p></body></html>`;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.content.length).toBeLessThanOrEqual(5000);
      });
    });

    describe('Image Extraction', () => {
      it('should extract images from img tags', async () => {
        const mockHtml = `
          <html>
            <body>
              <img src="https://example.com/image1.jpg" />
              <img src="https://example.com/image2.jpg" />
            </body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.images).toContain('https://example.com/image1.jpg');
        expect(result.images).toContain('https://example.com/image2.jpg');
      });

      it('should convert relative URLs to absolute', async () => {
        const mockHtml = `
          <html>
            <body>
              <img src="/images/photo.jpg" />
            </body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.images).toContain('https://example.com/images/photo.jpg');
      });

      it('should filter out icon images', async () => {
        const mockHtml = `
          <html>
            <body>
              <img src="https://example.com/icon.png" />
              <img src="https://example.com/logo.png" />
              <img src="https://example.com/photo.jpg" />
            </body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.images).not.toContain('https://example.com/icon.png');
        expect(result.images).not.toContain('https://example.com/logo.png');
        expect(result.images).toContain('https://example.com/photo.jpg');
      });

      it('should limit to 10 images', async () => {
        const images = Array.from({ length: 20 }, (_, i) => 
          `<img src="https://example.com/image${i}.jpg" />`
        ).join('');
        const mockHtml = `<html><body>${images}</body></html>`;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.images.length).toBeLessThanOrEqual(10);
      });

      it('should prioritize OG image', async () => {
        const mockHtml = `
          <html>
            <head>
              <meta property="og:image" content="https://example.com/og-image.jpg" />
            </head>
            <body>
              <img src="https://example.com/other.jpg" />
            </body>
          </html>
        `;
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://example.com');
        expect(result.images[0]).toBe('https://example.com/og-image.jpg');
      });
    });

    describe('Site Name Extraction', () => {
      it('should extract site name from URL', async () => {
        const mockHtml = '<html><body>Content</body></html>';
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://www.example.com');
        expect(result.siteName).toBe('example.com');
      });

      it('should remove www prefix', async () => {
        const mockHtml = '<html><body>Content</body></html>';
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          text: async () => mockHtml,
        } as Response);

        const result = await extractContentFromUrl('https://www.test.com');
        expect(result.siteName).toBe('test.com');
      });
    });
  });

  describe('validateExtractedContent', () => {
    it('should validate valid content', () => {
      const content = {
        title: 'Valid Title',
        description: 'Valid description',
        content: 'This is a valid content with more than 50 characters to pass validation.',
        images: [],
        url: 'https://example.com',
        siteName: 'example.com',
      };

      const result = validateExtractedContent(content);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject content with short title', () => {
      const content = {
        title: 'AB',
        description: 'Description',
        content: 'This is a valid content with more than 50 characters to pass validation.',
        images: [],
        url: 'https://example.com',
        siteName: 'example.com',
      };

      const result = validateExtractedContent(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is too short or missing');
    });

    it('should reject content with missing title', () => {
      const content = {
        title: '',
        description: 'Description',
        content: 'This is a valid content with more than 50 characters to pass validation.',
        images: [],
        url: 'https://example.com',
        siteName: 'example.com',
      };

      const result = validateExtractedContent(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is too short or missing');
    });

    it('should reject content with short content', () => {
      const content = {
        title: 'Valid Title',
        description: 'Description',
        content: 'Short',
        images: [],
        url: 'https://example.com',
        siteName: 'example.com',
      };

      const result = validateExtractedContent(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content is too short or missing');
    });

    it('should reject content with missing URL', () => {
      const content = {
        title: 'Valid Title',
        description: 'Description',
        content: 'This is a valid content with more than 50 characters to pass validation.',
        images: [],
        url: '',
        siteName: 'example.com',
      };

      const result = validateExtractedContent(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is missing');
    });

    it('should return multiple errors', () => {
      const content = {
        title: '',
        description: 'Description',
        content: 'Short',
        images: [],
        url: '',
        siteName: 'example.com',
      };

      const result = validateExtractedContent(content);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
