/**
 * Response Utilities - Unit Tests
 * 
 * Tests for the enhanced response utilities with:
 * - Success response builders
 * - Error response builders
 * - Pagination support
 * - Correlation ID tracking
 * - Performance metrics
 * - Cache control headers
 * - Retry information
 * 
 * @see lib/api/utils/response.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  successResponse,
  successResponseWithStatus,
  errorResponse,
  errorResponseWithStatus,
  paginatedResponse,
  ok,
  created,
  accepted,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalServerError,
  serviceUnavailable,
} from '@/lib/api';

describe('Response Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successResponse', () => {
    it('should create success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = successResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta.requestId).toBeDefined();
      expect(response.meta.timestamp).toBeDefined();
      expect(response.meta.version).toBeDefined();
    });

    it('should include correlation ID when provided', () => {
      const response = successResponse({ id: '123' }, {
        correlationId: 'test-correlation-123',
      });

      expect(response.meta.requestId).toBe('test-correlation-123');
    });

    it('should calculate duration when startTime provided', () => {
      const startTime = Date.now() - 100;
      const response = successResponse({ id: '123' }, { startTime });

      expect(response.meta.duration).toBeGreaterThanOrEqual(100);
      expect(response.meta.duration).toBeLessThan(200);
    });

    it('should include custom version', () => {
      const response = successResponse({ id: '123' }, {
        version: '2.0',
      });

      expect(response.meta.version).toBe('2.0');
    });

    it('should handle null data', () => {
      const response = successResponse(null);

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    it('should handle undefined data', () => {
      const response = successResponse(undefined);

      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
    });

    it('should handle complex nested data', () => {
      const data = {
        user: {
          id: '123',
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
            },
          },
        },
      };

      const response = successResponse(data);

      expect(response.data).toEqual(data);
    });
  });

  describe('successResponseWithStatus', () => {
    it('should create 201 Created response', async () => {
      const data = { id: '123', status: 'created' };
      const response = successResponseWithStatus(data, 201);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });

    it('should include custom headers', async () => {
      const response = successResponseWithStatus({ id: '123' }, 201, {
        headers: {
          'Location': '/api/users/123',
          'X-Custom-Header': 'value',
        },
      });

      expect(response.headers.get('Location')).toBe('/api/users/123');
      expect(response.headers.get('X-Custom-Header')).toBe('value');
    });

    it('should include cache control headers', async () => {
      const response = successResponseWithStatus({ id: '123' }, 200, {
        cache: {
          public: true,
          maxAge: 3600,
          sMaxAge: 7200,
          staleWhileRevalidate: 86400,
        },
      });

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=3600');
      expect(cacheControl).toContain('s-maxage=7200');
      expect(cacheControl).toContain('stale-while-revalidate=86400');
    });
  });

  describe('errorResponse', () => {
    it('should create error response', () => {
      const response = errorResponse('VALIDATION_ERROR', 'Invalid input');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
      expect(response.error?.message).toBe('Invalid input');
      expect(response.error?.retryable).toBe(false);
      expect(response.meta.requestId).toBeDefined();
    });

    it('should mark retryable errors correctly', () => {
      const retryableErrors = [
        'RATE_LIMIT_ERROR',
        'TIMEOUT_ERROR',
        'NETWORK_ERROR',
        'SERVICE_UNAVAILABLE',
        'INTERNAL_ERROR',
      ];

      retryableErrors.forEach(code => {
        const response = errorResponse(code, 'Error message');
        expect(response.error?.retryable).toBe(true);
        expect(response.error?.retryAfter).toBeGreaterThan(0);
      });
    });

    it('should not mark non-retryable errors', () => {
      const nonRetryableErrors = [
        'VALIDATION_ERROR',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'CONFLICT',
      ];

      nonRetryableErrors.forEach(code => {
        const response = errorResponse(code, 'Error message');
        expect(response.error?.retryable).toBe(false);
        expect(response.error?.retryAfter).toBeUndefined();
      });
    });

    it('should include error details', () => {
      const details = {
        field: 'email',
        value: 'invalid',
        expected: 'user@example.com',
      };

      const response = errorResponse('VALIDATION_ERROR', 'Invalid email', details);

      expect(response.error?.details).toEqual(details);
    });

    it('should calculate duration', () => {
      const startTime = Date.now() - 50;
      const response = errorResponse('INTERNAL_ERROR', 'Server error', undefined, {
        startTime,
      });

      expect(response.meta.duration).toBeGreaterThanOrEqual(50);
    });

    it('should include correlation ID', () => {
      const response = errorResponse('INTERNAL_ERROR', 'Server error', undefined, {
        correlationId: 'error-123',
      });

      expect(response.meta.requestId).toBe('error-123');
    });
  });

  describe('errorResponseWithStatus', () => {
    it('should create error response with status code', async () => {
      const response = errorResponseWithStatus(
        'VALIDATION_ERROR',
        'Invalid input',
        400,
        { field: 'email' }
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should include Retry-After header for rate limiting', async () => {
      const response = errorResponseWithStatus(
        'RATE_LIMIT_ERROR',
        'Too many requests',
        429
      );

      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('paginatedResponse', () => {
    it('should create paginated response', () => {
      const items = [{ id: '1' }, { id: '2' }];
      const response = paginatedResponse(items, 100, 20, 0);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(items);
      expect(response.pagination.total).toBe(100);
      expect(response.pagination.limit).toBe(20);
      expect(response.pagination.offset).toBe(0);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.totalPages).toBe(5);
      expect(response.pagination.hasMore).toBe(true);
    });

    it('should calculate pagination metadata correctly', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
      const response = paginatedResponse(items, 100, 20, 40);

      expect(response.pagination.page).toBe(3);
      expect(response.pagination.totalPages).toBe(5);
      expect(response.pagination.hasMore).toBe(true);
    });

    it('should detect last page', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
      const response = paginatedResponse(items, 100, 20, 80);

      expect(response.pagination.page).toBe(5);
      expect(response.pagination.hasMore).toBe(false);
    });

    it('should generate navigation links when baseUrl provided', () => {
      const items = [{ id: '1' }];
      const response = paginatedResponse(items, 100, 20, 20, '/api/users');

      expect(response.pagination.nextPage).toBe('/api/users?limit=20&offset=40');
      expect(response.pagination.prevPage).toBe('/api/users?limit=20&offset=0');
    });

    it('should not generate prev link on first page', () => {
      const items = [{ id: '1' }];
      const response = paginatedResponse(items, 100, 20, 0, '/api/users');

      expect(response.pagination.nextPage).toBeDefined();
      expect(response.pagination.prevPage).toBeUndefined();
    });

    it('should not generate next link on last page', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
      const response = paginatedResponse(items, 100, 20, 80, '/api/users');

      expect(response.pagination.nextPage).toBeUndefined();
      expect(response.pagination.prevPage).toBeDefined();
    });

    it('should handle empty results', () => {
      const response = paginatedResponse([], 0, 20, 0);

      expect(response.data).toEqual([]);
      expect(response.pagination.total).toBe(0);
      expect(response.pagination.totalPages).toBe(0);
      expect(response.pagination.hasMore).toBe(false);
    });
  });

  describe('Convenience Methods', () => {
    describe('ok', () => {
      it('should create 200 OK response', async () => {
        const response = ok({ id: '123' });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toEqual({ id: '123' });
      });
    });

    describe('created', () => {
      it('should create 201 Created response', async () => {
        const response = created({ id: '123', status: 'created' });
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(body.success).toBe(true);
      });
    });

    describe('accepted', () => {
      it('should create 202 Accepted response', async () => {
        const response = accepted({ jobId: '456', status: 'processing' });
        const body = await response.json();

        expect(response.status).toBe(202);
        expect(body.success).toBe(true);
      });
    });

    describe('noContent', () => {
      it('should create 204 No Content response', () => {
        const response = noContent();

        expect(response.status).toBe(204);
        expect(response.body).toBeNull();
      });
    });

    describe('badRequest', () => {
      it('should create 400 Bad Request response', async () => {
        const response = badRequest('Invalid input', { field: 'email' });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('BAD_REQUEST');
        expect(body.error.details).toEqual({ field: 'email' });
      });
    });

    describe('unauthorized', () => {
      it('should create 401 Unauthorized response', async () => {
        const response = unauthorized('Please sign in');
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error.code).toBe('UNAUTHORIZED');
        expect(body.error.message).toBe('Please sign in');
      });

      it('should use default message', async () => {
        const response = unauthorized();
        const body = await response.json();

        expect(body.error.message).toBe('Authentication required');
      });
    });

    describe('forbidden', () => {
      it('should create 403 Forbidden response', async () => {
        const response = forbidden('Insufficient permissions');
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error.code).toBe('FORBIDDEN');
      });
    });

    describe('notFound', () => {
      it('should create 404 Not Found response', async () => {
        const response = notFound('User');
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.error.code).toBe('NOT_FOUND');
        expect(body.error.message).toContain('User not found');
      });
    });

    describe('conflict', () => {
      it('should create 409 Conflict response', async () => {
        const response = conflict('Email already exists', { field: 'email' });
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.error.code).toBe('CONFLICT');
      });
    });

    describe('unprocessableEntity', () => {
      it('should create 422 Unprocessable Entity response', async () => {
        const response = unprocessableEntity('Validation failed', {
          errors: [{ field: 'email', message: 'Invalid format' }],
        });
        const body = await response.json();

        expect(response.status).toBe(422);
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('tooManyRequests', () => {
      it('should create 429 Too Many Requests response', async () => {
        const response = tooManyRequests(60);
        const body = await response.json();

        expect(response.status).toBe(429);
        expect(body.error.code).toBe('RATE_LIMIT_ERROR');
        expect(body.error.retryable).toBe(true);
        expect(body.error.retryAfter).toBe(60);
        expect(response.headers.get('Retry-After')).toBe('60');
      });
    });

    describe('internalServerError', () => {
      it('should create 500 Internal Server Error response', async () => {
        const response = internalServerError('Database connection failed');
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error.code).toBe('INTERNAL_ERROR');
        expect(body.error.retryable).toBe(true);
      });

      it('should use default message', async () => {
        const response = internalServerError();
        const body = await response.json();

        expect(body.error.message).toBe('Internal server error');
      });
    });

    describe('serviceUnavailable', () => {
      it('should create 503 Service Unavailable response', async () => {
        const response = serviceUnavailable('Maintenance in progress');
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
        expect(body.error.retryable).toBe(true);
      });
    });
  });

  describe('Response Headers', () => {
    it('should include Content-Type header', async () => {
      const response = ok({ id: '123' });

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include X-Request-ID header', async () => {
      const response = ok({ id: '123' }, {
        correlationId: 'test-123',
      });

      expect(response.headers.get('X-Request-ID')).toBe('test-123');
    });

    it('should include custom headers', async () => {
      const response = ok({ id: '123' }, {
        headers: {
          'X-Custom-Header': 'value',
          'X-Rate-Limit-Remaining': '99',
        },
      });

      expect(response.headers.get('X-Custom-Header')).toBe('value');
      expect(response.headers.get('X-Rate-Limit-Remaining')).toBe('99');
    });

    it('should include cache control headers', async () => {
      const response = ok({ id: '123' }, {
        cache: {
          public: true,
          maxAge: 3600,
        },
      });

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=3600');
    });

    it('should use private cache by default', async () => {
      const response = ok({ id: '123' }, {
        cache: {
          maxAge: 300,
        },
      });

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('private');
    });
  });

  describe('Type Safety', () => {
    it('should preserve data types', () => {
      interface User {
        id: string;
        name: string;
        age: number;
      }

      const user: User = { id: '123', name: 'John', age: 30 };
      const response = successResponse<User>(user);

      // TypeScript should infer the correct type
      expect(response.data?.id).toBe('123');
      expect(response.data?.name).toBe('John');
      expect(response.data?.age).toBe(30);
    });

    it('should handle array types', () => {
      const users = [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ];

      const response = successResponse(users);

      expect(response.data).toBeInstanceOf(Array);
      expect(response.data?.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const response = errorResponse('INTERNAL_ERROR', longMessage);

      expect(response.error?.message).toBe(longMessage);
    });

    it('should handle special characters in messages', () => {
      const message = 'Error: <script>alert("xss")</script>';
      const response = errorResponse('VALIDATION_ERROR', message);

      expect(response.error?.message).toBe(message);
    });

    it('should handle circular references in details', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      // Should not throw
      expect(() => {
        errorResponse('INTERNAL_ERROR', 'Error', obj);
      }).not.toThrow();
    });

    it('should handle very large pagination totals', () => {
      const response = paginatedResponse([], 1000000, 20, 0);

      expect(response.pagination.totalPages).toBe(50000);
    });

    it('should handle zero limit pagination', () => {
      const response = paginatedResponse([], 100, 0, 0);

      expect(response.pagination.totalPages).toBe(Infinity);
    });
  });
});
