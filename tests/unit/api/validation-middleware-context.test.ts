/**
 * Validation Middleware Context Support - Unit Tests
 * 
 * Tests for Next.js 15 context parameter support in validation middleware.
 * Validates that context is properly passed through to route handlers.
 * 
 * @see lib/api/middleware/validation.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { withValidation, validators } from '@/lib/api/middleware/validation';

describe('withValidation - Context Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Context Parameter Passing', () => {
    it('should pass context to handler for dynamic routes', async () => {
      const schema = {
        name: validators.string({ required: true }),
      };

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/content/123', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Content' }),
      });

      const context = { params: { id: '123' } };

      await wrapped(req, context);

      // Verify handler was called with context
      expect(handler).toHaveBeenCalledWith(
        req,
        { name: 'Test Content' },
        context
      );
    });

    it('should work without context for static routes', async () => {
      const schema = {
        title: validators.string({ required: true }),
      };

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });

      // Call without context (static route)
      await wrapped(req);

      // Verify handler was called with undefined context
      expect(handler).toHaveBeenCalledWith(
        req,
        { title: 'Test' },
        undefined
      );
    });

    it('should pass empty context object', async () => {
      const schema = {
        name: validators.string({ required: true }),
      };

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      const context = {};

      await wrapped(req, context);

      expect(handler).toHaveBeenCalledWith(
        req,
        { name: 'Test' },
        context
      );
    });

    it('should pass complex context with multiple params', async () => {
      const schema = {
        content: validators.string({ required: true }),
      };

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/campaigns/123/posts/456', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test' }),
      });

      const context = {
        params: {
          campaignId: '123',
          postId: '456',
        },
      };

      await wrapped(req, context);

      expect(handler).toHaveBeenCalledWith(
        req,
        { content: 'Test' },
        context
      );
    });
  });

  describe('Context with Validation Errors', () => {
    it('should not call handler if validation fails, even with context', async () => {
      const schema = {
        name: validators.string({ required: true }),
      };

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/content/123', {
        method: 'POST',
        body: JSON.stringify({ name: '' }), // Invalid: empty string
      });

      const context = { params: { id: '123' } };

      const response = await wrapped(req, context);

      // Handler should not be called
      expect(handler).not.toHaveBeenCalled();

      // Should return validation error
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.type).toBe('VALIDATION_ERROR');
    });

    it('should return validation error without exposing context', async () => {
      const schema = {
        title: validators.string({ required: true, maxLength: 10 }),
      };

      const handler = vi.fn();
      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/content/123', {
        method: 'POST',
        body: JSON.stringify({ title: 'This is a very long title' }),
      });

      const context = {
        params: { id: '123' },
        secretData: 'should-not-be-exposed',
      };

      const response = await wrapped(req, context);
      const data = await response.json();

      // Context should not be in error response
      expect(JSON.stringify(data)).not.toContain('secretData');
      expect(JSON.stringify(data)).not.toContain('should-not-be-exposed');
    });
  });

  describe('Context with Sanitization', () => {
    it('should sanitize input before passing to handler with context', async () => {
      const schema = {
        content: validators.string({ required: true }),
      };

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/content/123', {
        method: 'POST',
        body: JSON.stringify({
          content: '<script>alert("xss")</script>Hello',
        }),
      });

      const context = { params: { id: '123' } };

      await wrapped(req, context);

      // Verify XSS was sanitized
      const calledWith = handler.mock.calls[0][1];
      expect(calledWith.content).not.toContain('<script>');
      expect(calledWith.content).toContain('Hello');

      // Verify context was passed
      expect(handler.mock.calls[0][2]).toEqual(context);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with handlers that do not use context', async () => {
      const schema = {
        name: validators.string({ required: true }),
      };

      // Handler without context parameter
      const handler = vi.fn(async (req: NextRequest, body: any) => {
        return Response.json({ success: true, data: body });
      });

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      const context = { params: { id: '123' } };

      const response = await wrapped(req, context);

      // Should work even though handler doesn't use context
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    it('should maintain existing behavior for routes without context', async () => {
      const schema = {
        email: validators.email({ required: true }),
      };

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      // Call without context (old behavior)
      const response = await wrapped(req);

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledWith(
        req,
        { email: 'test@example.com' },
        undefined
      );
    });
  });

  describe('Error Handling with Context', () => {
    it('should handle handler errors gracefully with context', async () => {
      const schema = {
        name: validators.string({ required: true }),
      };

      const handler = vi.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/content/123', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      const context = { params: { id: '123' } };

      const response = await wrapped(req, context);

      // Should return 500 error
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error.type).toBe('INTERNAL_ERROR');

      // Context should not be exposed in error
      expect(JSON.stringify(data)).not.toContain('params');
    });

    it('should handle JSON parsing errors with context', async () => {
      const schema = {
        name: validators.string({ required: true }),
      };

      const handler = vi.fn();
      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/content/123', {
        method: 'POST',
        body: 'invalid json{',
      });

      const context = { params: { id: '123' } };

      const response = await wrapped(req, context);

      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();

      const data = await response.json();
      expect(data.error.type).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('JSON');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle GET /api/content/[id] with context', async () => {
      const schema = {}; // No body validation for GET

      const handler = vi.fn(async (req: NextRequest, body: any, context: any) => {
        const { id } = context.params;
        return Response.json({ id, content: 'Test Content' });
      });

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/content/123', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const context = { params: { id: '123' } };

      const response = await wrapped(req, context);
      const data = await response.json();

      expect(data.id).toBe('123');
      expect(data.content).toBe('Test Content');
    });

    it('should handle PUT /api/campaigns/[id] with validation and context', async () => {
      const schema = {
        name: validators.string({ required: true, maxLength: 100 }),
        status: validators.enum(['draft', 'active', 'paused'], { required: true }),
      };

      const handler = vi.fn(async (req: NextRequest, body: any, context: any) => {
        const { id } = context.params;
        return Response.json({
          id,
          ...body,
          updatedAt: new Date().toISOString(),
        });
      });

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/campaigns/456', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Campaign',
          status: 'active',
        }),
      });

      const context = { params: { id: '456' } };

      const response = await wrapped(req, context);
      const data = await response.json();

      expect(data.id).toBe('456');
      expect(data.name).toBe('Updated Campaign');
      expect(data.status).toBe('active');
      expect(data.updatedAt).toBeDefined();
    });

    it('should handle nested routes with multiple params', async () => {
      const schema = {
        comment: validators.string({ required: true, maxLength: 500 }),
      };

      const handler = vi.fn(async (req: NextRequest, body: any, context: any) => {
        const { campaignId, postId } = context.params;
        return Response.json({
          campaignId,
          postId,
          comment: body.comment,
        });
      });

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest(
        'http://localhost/api/campaigns/123/posts/456/comments',
        {
          method: 'POST',
          body: JSON.stringify({ comment: 'Great post!' }),
        }
      );

      const context = {
        params: {
          campaignId: '123',
          postId: '456',
        },
      };

      const response = await wrapped(req, context);
      const data = await response.json();

      expect(data.campaignId).toBe('123');
      expect(data.postId).toBe('456');
      expect(data.comment).toBe('Great post!');
    });
  });

  describe('Performance with Context', () => {
    it('should not add significant overhead with context', async () => {
      const schema = {
        data: validators.string({ required: true }),
      };

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const wrapped = withValidation(schema, handler);

      const req = new NextRequest('http://localhost/api/test/123', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      const context = { params: { id: '123' } };

      const startTime = Date.now();
      await wrapped(req, context);
      const duration = Date.now() - startTime;

      // Should complete in < 50ms
      expect(duration).toBeLessThan(50);
    });

    it('should handle 100 concurrent requests with context', async () => {
      const schema = {
        value: validators.number({ required: true }),
      };

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const wrapped = withValidation(schema, handler);

      const requests = Array.from({ length: 100 }, (_, i) => {
        const req = new NextRequest(`http://localhost/api/test/${i}`, {
          method: 'POST',
          body: JSON.stringify({ value: i }),
        });

        const context = { params: { id: i.toString() } };

        return wrapped(req, context);
      });

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All should succeed
      expect(responses.every(r => r.status === 200)).toBe(true);

      // Should complete in < 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});

