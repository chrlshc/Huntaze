/**
 * NextAuth Route Handler - Unit Tests
 * 
 * Tests for the optimized NextAuth route with:
 * - Error handling
 * - Timeout handling
 * - Logging
 * - Correlation IDs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock handlers before import
vi.mock('@/auth', () => ({
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}));

// Import after mocking
import { GET, POST } from '../../../app/api/auth/[...nextauth]/route';
import { handlers } from '@/auth';

const mockHandlers = handlers as {
  GET: ReturnType<typeof vi.fn>;
  POST: ReturnType<typeof vi.fn>;
};

describe('NextAuth Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET Handler', () => {
    it('should handle successful GET request', async () => {
      const mockResponse = new Response(JSON.stringify({ session: { user: { id: '1' } } }), {
        status: 200,
      });
      mockHandlers.GET.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockHandlers.GET).toHaveBeenCalledWith(request);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[Auth]'),
        expect.objectContaining({
          correlationId: expect.stringMatching(/^auth-\d+-[a-z0-9]+$/),
        })
      );
    });

    it('should handle GET request with query parameters', async () => {
      const mockResponse = new Response(JSON.stringify({ providers: [] }), {
        status: 200,
      });
      mockHandlers.GET.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/providers?test=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      // Check that searchParams were logged
      const logCalls = (console.log as any).mock.calls;
      const hasSearchParams = logCalls.some((call: any) => 
        call[1]?.searchParams?.test === 'true'
      );
      expect(hasSearchParams).toBe(true);
    });

    it('should handle GET timeout error', async () => {
      // Mock a slow response (> 10 seconds)
      mockHandlers.GET.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 15000))
      );

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      expect(response.status).toBe(408);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe('TIMEOUT_ERROR');
      expect(data.correlationId).toMatch(/^auth-\d+-[a-z0-9]+$/);
    }, 15000); // Increase timeout for this test

    it('should handle GET error with structured error response', async () => {
      const error = new Error('database connection failed');
      mockHandlers.GET.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.type).toBe('DATABASE_ERROR');
      expect(data.error.userMessage).toBeDefined();
      expect(data.error.correlationId).toMatch(/^auth-\d+-[a-z0-9]+$/);
      expect(data.error.retryable).toBe(true);
    });

    it('should log correlation ID for tracing', async () => {
      const mockResponse = new Response(JSON.stringify({ session: null }), {
        status: 200,
      });
      mockHandlers.GET.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      await GET(request);

      // Check that correlation ID is logged
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[Auth]'),
        expect.objectContaining({
          correlationId: expect.stringMatching(/^auth-\d+-[a-z0-9]+$/),
        })
      );
    });

    it('should measure request duration', async () => {
      const mockResponse = new Response(JSON.stringify({ session: null }), {
        status: 200,
      });
      mockHandlers.GET.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      await GET(request);

      // Check that duration is logged
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('successful'),
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
    });
  });

  describe('POST Handler', () => {
    it('should handle successful POST request', async () => {
      const mockResponse = new Response(
        JSON.stringify({ user: { id: '1', email: 'test@example.com' } }),
        { status: 200 }
      );
      mockHandlers.POST.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockHandlers.POST).toHaveBeenCalledWith(request);
    });

    it('should handle invalid credentials error', async () => {
      const error = new Error('Invalid credentials');
      mockHandlers.POST.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe('INVALID_CREDENTIALS');
      expect(data.error.userMessage).toBe('Invalid email or password.');
      expect(data.error.retryable).toBe(false);
    });

    it('should handle rate limit error', async () => {
      const error = new Error('rate limit exceeded');
      mockHandlers.POST.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
      });
      const response = await POST(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error.type).toBe('RATE_LIMIT_EXCEEDED');
      expect(data.error.retryable).toBe(false);
    });

    it('should handle network error', async () => {
      const error = new Error('network error: ECONNREFUSED');
      mockHandlers.POST.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
      });
      const response = await POST(request);

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error.type).toBe('NETWORK_ERROR');
      expect(data.error.retryable).toBe(true);
    });

    it('should handle POST timeout error', async () => {
      // Mock a slow response
      mockHandlers.POST.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 15000))
      );

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
      });
      const response = await POST(request);

      expect(response.status).toBe(408);
      const data = await response.json();
      expect(data.error.type).toBe('TIMEOUT_ERROR');
      expect(data.error.retryable).toBe(true);
    }, 15000); // Increase timeout for this test

    it('should not log sensitive data', async () => {
      const mockResponse = new Response(JSON.stringify({ user: { id: '1' } }), {
        status: 200,
      });
      mockHandlers.POST.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'secret123' }),
      });
      await POST(request);

      // Check that password is NOT logged
      const logCalls = (console.log as any).mock.calls;
      const logStrings = logCalls.map((call: any) => JSON.stringify(call));
      const hasPassword = logStrings.some((str: string) => str.includes('secret123'));
      
      expect(hasPassword).toBe(false);
    });

    it('should log content type', async () => {
      const mockResponse = new Response(JSON.stringify({ user: { id: '1' } }), {
        status: 200,
      });
      mockHandlers.POST.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      await POST(request);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('POST'),
        expect.objectContaining({
          contentType: 'application/json',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should map database errors correctly', async () => {
      const error = new Error('database query failed');
      mockHandlers.GET.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      const data = await response.json();
      expect(data.error.type).toBe('DATABASE_ERROR');
      expect(data.error.statusCode).toBe(503);
      expect(data.error.retryable).toBe(true);
    });

    it('should map unknown errors correctly', async () => {
      const error = new Error('Something unexpected happened');
      mockHandlers.GET.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      const data = await response.json();
      expect(data.error.type).toBe('UNKNOWN_ERROR');
      expect(data.error.statusCode).toBe(500);
      expect(data.error.retryable).toBe(true);
    });

    it('should include timestamp in error', async () => {
      const error = new Error('Test error');
      mockHandlers.GET.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      const data = await response.json();
      expect(data.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include user-friendly message', async () => {
      const error = new Error('Invalid credentials');
      mockHandlers.POST.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
      });
      const response = await POST(request);

      const data = await response.json();
      expect(data.error.userMessage).toBe('Invalid email or password.');
      expect(data.error.message).toBe('Invalid credentials');
    });
  });

  describe('Correlation IDs', () => {
    it('should generate unique correlation IDs', async () => {
      const mockResponse = new Response(JSON.stringify({ session: null }), {
        status: 200,
      });
      mockHandlers.GET.mockResolvedValue(mockResponse);

      const request1 = new NextRequest('http://localhost:3000/api/auth/session');
      const request2 = new NextRequest('http://localhost:3000/api/auth/session');

      await GET(request1);
      await GET(request2);

      const logCalls = (console.log as any).mock.calls;
      const correlationIds = logCalls
        .filter((call: any) => call[1]?.correlationId)
        .map((call: any) => call[1].correlationId);

      // Should have at least 2 unique correlation IDs (one per request)
      const uniqueIds = new Set(correlationIds);
      expect(uniqueIds.size).toBeGreaterThanOrEqual(2);
    });

    it('should use same correlation ID throughout request', async () => {
      const error = new Error('Test error');
      mockHandlers.GET.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      const data = await response.json();
      const responseCorrelationId = data.correlationId;

      // Check logs have same correlation ID
      const logCalls = (console.log as any).mock.calls;
      const errorCalls = (console.error as any).mock.calls;
      const allCalls = [...logCalls, ...errorCalls];

      const loggedCorrelationIds = allCalls
        .filter((call: any) => call[1]?.correlationId)
        .map((call: any) => call[1].correlationId);

      expect(loggedCorrelationIds.every((id: string) => id === responseCorrelationId)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete within timeout', async () => {
      const mockResponse = new Response(JSON.stringify({ session: null }), {
        status: 200,
      });
      mockHandlers.GET.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const startTime = Date.now();
      await GET(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // Should be much less than 10s timeout
    });

    it('should log request duration', async () => {
      const mockResponse = new Response(JSON.stringify({ session: null }), {
        status: 200,
      });
      mockHandlers.GET.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      await GET(request);

      const logCalls = (console.log as any).mock.calls;
      const durationLogs = logCalls.filter((call: any) => call[1]?.duration !== undefined);

      expect(durationLogs.length).toBeGreaterThan(0);
      expect(durationLogs[0][1].duration).toBeGreaterThanOrEqual(0);
    });
  });
});
