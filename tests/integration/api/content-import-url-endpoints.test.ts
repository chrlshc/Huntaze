/**
 * Integration Tests - Content Import URL Endpoints
 * 
 * Tests for URL content import API endpoints
 * Based on: .kiro/specs/content-creation/tasks.md (Task 13.1)
 * 
 * Coverage:
 * - POST /api/content/import/url
 * - Authentication
 * - URL validation
 * - Content extraction
 * - Draft creation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/content/import/url/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/jwt', () => ({
  verifyAuth: vi.fn().mockResolvedValue({
    valid: true,
    payload: { userId: 1 },
  }),
}));

vi.mock('@/lib/services/contentExtractor', () => ({
  extractContentFromUrl: vi.fn(),
  validateExtractedContent: vi.fn(),
}));

vi.mock('@/lib/db/repositories/contentItemsRepository', () => ({
  createContentItem: vi.fn(),
}));

describe('Content Import URL Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/content/import/url', () => {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        const { verifyAuth } = await import('@/lib/auth/jwt');
        vi.mocked(verifyAuth).mockResolvedValueOnce({
          valid: false,
          payload: null,
        });

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should accept valid authentication', async () => {
        const { extractContentFromUrl, validateExtractedContent } = await import('@/lib/services/contentExtractor');
        const { createContentItem } = await import('@/lib/db/repositories/contentItemsRepository');

        vi.mocked(extractContentFromUrl).mockResolvedValueOnce({
          title: 'Test Article',
          description: 'Test description',
          content: 'This is test content with more than 50 characters for validation.',
          images: [],
          url: 'https://example.com',
          siteName: 'example.com',
        });

        vi.mocked(validateExtractedContent).mockReturnValueOnce({
          isValid: true,
          errors: [],
        });

        vi.mocked(createContentItem).mockResolvedValueOnce({
          id: 1,
          user_id: 1,
          title: 'Test Article',
          content: 'This is test content with more than 50 characters for validation.',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      });
    });

    describe('Input Validation', () => {
      it('should require URL parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('URL is required');
      });

      it('should validate URL format', async () => {
        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'not-a-valid-url' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid URL format');
      });

      it('should accept valid URL', async () => {
        const { extractContentFromUrl, validateExtractedContent } = await import('@/lib/services/contentExtractor');
        const { createContentItem } = await import('@/lib/db/repositories/contentItemsRepository');

        vi.mocked(extractContentFromUrl).mockResolvedValueOnce({
          title: 'Test Article',
          description: 'Test description',
          content: 'This is test content with more than 50 characters for validation.',
          images: [],
          url: 'https://example.com',
          siteName: 'example.com',
        });

        vi.mocked(validateExtractedContent).mockReturnValueOnce({
          isValid: true,
          errors: [],
        });

        vi.mocked(createContentItem).mockResolvedValueOnce({
          id: 1,
          user_id: 1,
          title: 'Test Article',
          content: 'This is test content with more than 50 characters for validation.',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com/article' }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      });
    });

    describe('Content Extraction', () => {
      it('should extract content from URL', async () => {
        const { extractContentFromUrl, validateExtractedContent } = await import('@/lib/services/contentExtractor');
        const { createContentItem } = await import('@/lib/db/repositories/contentItemsRepository');

        const mockExtracted = {
          title: 'Extracted Title',
          description: 'Extracted description',
          content: 'This is extracted content with more than 50 characters for validation.',
          images: ['https://example.com/image.jpg'],
          author: 'John Doe',
          publishedDate: '2025-01-01',
          siteName: 'example.com',
          url: 'https://example.com',
        };

        vi.mocked(extractContentFromUrl).mockResolvedValueOnce(mockExtracted);
        vi.mocked(validateExtractedContent).mockReturnValueOnce({
          isValid: true,
          errors: [],
        });
        vi.mocked(createContentItem).mockResolvedValueOnce({
          id: 1,
          user_id: 1,
          title: 'Extracted Title',
          content: 'This is extracted content with more than 50 characters for validation.',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.extractedContent).toEqual(mockExtracted);
        expect(extractContentFromUrl).toHaveBeenCalledWith('https://example.com');
      });

      it('should validate extracted content', async () => {
        const { extractContentFromUrl, validateExtractedContent } = await import('@/lib/services/contentExtractor');

        vi.mocked(extractContentFromUrl).mockResolvedValueOnce({
          title: 'AB',
          description: '',
          content: 'Short',
          images: [],
          url: 'https://example.com',
          siteName: 'example.com',
        });

        vi.mocked(validateExtractedContent).mockReturnValueOnce({
          isValid: false,
          errors: ['Title is too short', 'Content is too short'],
        });

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(422);
        expect(data.error).toContain('Failed to extract sufficient content');
        expect(data.details).toEqual(['Title is too short', 'Content is too short']);
      });
    });

    describe('Draft Creation', () => {
      it('should create draft content item', async () => {
        const { extractContentFromUrl, validateExtractedContent } = await import('@/lib/services/contentExtractor');
        const { createContentItem } = await import('@/lib/db/repositories/contentItemsRepository');

        vi.mocked(extractContentFromUrl).mockResolvedValueOnce({
          title: 'Test Article',
          description: 'Test description',
          content: 'This is test content with more than 50 characters for validation.',
          images: ['https://example.com/image.jpg'],
          author: 'John Doe',
          publishedDate: '2025-01-01',
          siteName: 'example.com',
          url: 'https://example.com',
        });

        vi.mocked(validateExtractedContent).mockReturnValueOnce({
          isValid: true,
          errors: [],
        });

        vi.mocked(createContentItem).mockResolvedValueOnce({
          id: 1,
          user_id: 1,
          title: 'Test Article',
          content: 'This is test content with more than 50 characters for validation.',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.contentItem).toBeDefined();
        expect(data.contentItem.status).toBe('draft');
        expect(createContentItem).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 1,
            title: 'Test Article',
            status: 'draft',
            metadata: expect.objectContaining({
              source: 'url_import',
              sourceUrl: 'https://example.com',
            }),
          })
        );
      });

      it('should include metadata in draft', async () => {
        const { extractContentFromUrl, validateExtractedContent } = await import('@/lib/services/contentExtractor');
        const { createContentItem } = await import('@/lib/db/repositories/contentItemsRepository');

        vi.mocked(extractContentFromUrl).mockResolvedValueOnce({
          title: 'Test Article',
          description: 'Test description',
          content: 'This is test content with more than 50 characters for validation.',
          images: ['https://example.com/image.jpg'],
          author: 'John Doe',
          publishedDate: '2025-01-01',
          siteName: 'example.com',
          url: 'https://example.com',
        });

        vi.mocked(validateExtractedContent).mockReturnValueOnce({
          isValid: true,
          errors: [],
        });

        vi.mocked(createContentItem).mockResolvedValueOnce({
          id: 1,
          user_id: 1,
          title: 'Test Article',
          content: 'This is test content with more than 50 characters for validation.',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        });

        await POST(request);

        expect(createContentItem).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              source: 'url_import',
              sourceUrl: 'https://example.com',
              extractedData: expect.objectContaining({
                description: 'Test description',
                author: 'John Doe',
                publishedDate: '2025-01-01',
                siteName: 'example.com',
                images: ['https://example.com/image.jpg'],
              }),
            }),
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle extraction errors', async () => {
        const { extractContentFromUrl } = await import('@/lib/services/contentExtractor');

        vi.mocked(extractContentFromUrl).mockRejectedValueOnce(
          new Error('Failed to fetch URL')
        );

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to import content from URL');
        expect(data.details).toContain('Failed to fetch URL');
      });

      it('should handle database errors', async () => {
        const { extractContentFromUrl, validateExtractedContent } = await import('@/lib/services/contentExtractor');
        const { createContentItem } = await import('@/lib/db/repositories/contentItemsRepository');

        vi.mocked(extractContentFromUrl).mockResolvedValueOnce({
          title: 'Test Article',
          description: 'Test description',
          content: 'This is test content with more than 50 characters for validation.',
          images: [],
          url: 'https://example.com',
          siteName: 'example.com',
        });

        vi.mocked(validateExtractedContent).mockReturnValueOnce({
          isValid: true,
          errors: [],
        });

        vi.mocked(createContentItem).mockRejectedValueOnce(
          new Error('Database connection failed')
        );

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to import content from URL');
      });
    });

    describe('Response Format', () => {
      it('should return success response with all data', async () => {
        const { extractContentFromUrl, validateExtractedContent } = await import('@/lib/services/contentExtractor');
        const { createContentItem } = await import('@/lib/db/repositories/contentItemsRepository');

        const mockExtracted = {
          title: 'Test Article',
          description: 'Test description',
          content: 'This is test content with more than 50 characters for validation.',
          images: ['https://example.com/image.jpg'],
          author: 'John Doe',
          publishedDate: '2025-01-01',
          siteName: 'example.com',
          url: 'https://example.com',
        };

        vi.mocked(extractContentFromUrl).mockResolvedValueOnce(mockExtracted);
        vi.mocked(validateExtractedContent).mockReturnValueOnce({
          isValid: true,
          errors: [],
        });
        vi.mocked(createContentItem).mockResolvedValueOnce({
          id: 1,
          user_id: 1,
          title: 'Test Article',
          content: 'This is test content with more than 50 characters for validation.',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const request = new NextRequest('http://localhost:3000/api/content/import/url', {
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('contentItem');
        expect(data).toHaveProperty('extractedContent');
        expect(data).toHaveProperty('message');
        expect(data.message).toContain('Review and edit before publishing');
      });
    });
  });
});
