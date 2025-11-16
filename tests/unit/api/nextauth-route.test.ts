/**
 * NextAuth v4 Route Handler - Unit Tests
 * 
 * Tests for the optimized NextAuth v4 route with:
 * - ✅ Error handling with structured errors
 * - ✅ Retry logic with exponential backoff
 * - ✅ Timeout handling (10s)
 * - ✅ Correlation IDs for tracing
 * - ✅ Comprehensive logging
 * - ✅ Security (no sensitive data in logs)
 * - ✅ TypeScript strict typing
 * 
 * Updated for NextAuth v4 implementation
 * 
 * @see app/api/auth/[...nextauth]/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock database before imports
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

// Mock NextAuth v4
const mockNextAuthHandler = vi.fn();
vi.mock('next-auth', () => ({
  default: vi.fn(() => mockNextAuthHandler),
}));

// Mock NextAuth providers
vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(() => ({ id: 'google', name: 'Google' })),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(() => ({ id: 'credentials', name: 'Credentials' })),
}));

// Import after mocking
import { GET, POST, authOptions, AuthErrorType } from '../../../app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';
import { compare } from 'bcryptjs';

describe('NextAuth v4 Route Handler', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Reset NextAuth handler mock
    mockNextAuthHandler.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should have valid authOptions configuration', () => {
      expect(authOptions).toBeDefined();
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.providers.length).toBeGreaterThan(0);
      expect(authOptions.session?.strategy).toBe('jwt');
      expect(authOptions.secret).toBeDefined();
    });

    it('should have Google provider configured', () => {
      const googleProvider = authOptions.providers.find((p: any) => p.id === 'google');
      expect(googleProvider).toBeDefined();
    });

    it('should have Credentials provider configured', () => {
      const credentialsProvider = authOptions.providers.find((p: any) => p.id === 'credentials');
      expect(credentialsProvider).toBeDefined();
    });

    it('should have custom pages configured', () => {
      expect(authOptions.pages).toBeDefined();
      expect(authOptions.pages?.signIn).toBe('/auth');
      expect(authOptions.pages?.error).toBe('/auth');
    });

    it('should have JWT configuration', () => {
      expect(authOptions.jwt).toBeDefined();
      expect(authOptions.jwt?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
    });

    it('should have session configuration', () => {
      expect(authOptions.session).toBeDefined();
      expect(authOptions.session?.strategy).toBe('jwt');
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
    });
  });

  describe('GET Handler', () => {
    it('should handle successful GET request', async () => {
      const mockResponse = new Response(
        JSON.stringify({ session: { user: { id: '1', email: 'test@example.com' } } }), 
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockNextAuthHandler).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Auth]'),
        expect.objectContaining({
          correlationId: expect.stringMatching(/^auth-\d+-[a-z0-9]+$/),
        })
      );
    });

    it('should handle GET request with query parameters', async () => {
      const mockResponse = new Response(
        JSON.stringify({ providers: [] }), 
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/providers?test=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      // Check that searchParams were logged
      const logCalls = consoleLogSpy.mock.calls;
      const hasSearchParams = logCalls.some((call: any) => 
        call[1]?.searchParams?.test === 'true'
      );
      expect(hasSearchParams).toBe(true);
    });

    it('should handle GET timeout error', async () => {
      // Mock a slow response (> 10 seconds)
      mockNextAuthHandler.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 15000))
      );

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      expect(response.status).toBe(408);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe(AuthErrorType.TIMEOUT_ERROR);
      expect(data.error.userMessage).toBe('Request timed out. Please try again.');
      expect(data.error.retryable).toBe(true);
      expect(data.correlationId).toMatch(/^auth-\d+-[a-z0-9]+$/);
      expect(data.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }, 15000); // Increase timeout for this test

    it('should handle GET error with structured error response', async () => {
      const error = new Error('database connection failed');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.type).toBe(AuthErrorType.DATABASE_ERROR);
      expect(data.error.message).toBe('database connection failed');
      expect(data.error.userMessage).toBe('A database error occurred. Please try again.');
      expect(data.error.correlationId).toMatch(/^auth-\d+-[a-z0-9]+$/);
      expect(data.error.retryable).toBe(true);
      expect(data.error.statusCode).toBe(503);
      expect(data.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should log correlation ID for tracing', async () => {
      const mockResponse = new Response(
        JSON.stringify({ session: null }), 
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      await GET(request);

      // Check that correlation ID is logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Auth]'),
        expect.objectContaining({
          correlationId: expect.stringMatching(/^auth-\d+-[a-z0-9]+$/),
        })
      );
    });

    it('should measure request duration', async () => {
      const mockResponse = new Response(
        JSON.stringify({ session: null }), 
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      await GET(request);

      // Check that duration is logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('successful'),
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
    });

    it('should handle network errors with retry indication', async () => {
      const error = new Error('network error: ECONNREFUSED');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error.type).toBe(AuthErrorType.NETWORK_ERROR);
      expect(data.error.retryable).toBe(true);
      expect(data.error.userMessage).toBe('Network error. Please check your connection and try again.');
    });
  });

  describe('POST Handler', () => {
    it('should handle successful POST request', async () => {
      const mockResponse = new Response(
        JSON.stringify({ user: { id: '1', email: 'test@example.com' } }),
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockNextAuthHandler).toHaveBeenCalled();
    });

    it('should handle invalid credentials error', async () => {
      const error = new Error('Invalid credentials');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
      expect(data.error.userMessage).toBe('Invalid email or password.');
      expect(data.error.retryable).toBe(false);
    });

    it('should handle rate limit error', async () => {
      const error = new Error('rate limit exceeded');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
      });
      const response = await POST(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error.type).toBe(AuthErrorType.RATE_LIMIT_EXCEEDED);
      expect(data.error.userMessage).toBe('Too many requests. Please wait a moment and try again.');
      expect(data.error.retryable).toBe(false);
    });

    it('should not log sensitive data', async () => {
      const mockResponse = new Response(
        JSON.stringify({ user: { id: '1' } }), 
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'secret123' }),
      });
      await POST(request);

      // Check that password is NOT logged
      const logCalls = consoleLogSpy.mock.calls;
      const logStrings = logCalls.map((call: any) => JSON.stringify(call));
      const hasPassword = logStrings.some((str: string) => str.includes('secret123'));
      
      expect(hasPassword).toBe(false);
    });

    it('should log content type', async () => {
      const mockResponse = new Response(
        JSON.stringify({ user: { id: '1' } }), 
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      await POST(request);

      expect(consoleLogSpy).toHaveBeenCalledWith(
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
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      const data = await response.json();
      expect(data.error.type).toBe(AuthErrorType.DATABASE_ERROR);
      expect(data.error.statusCode).toBe(503);
      expect(data.error.retryable).toBe(true);
      expect(data.error.userMessage).toBe('A database error occurred. Please try again.');
    });

    it('should map unknown errors correctly', async () => {
      const error = new Error('Something unexpected happened');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      const data = await response.json();
      expect(data.error.type).toBe(AuthErrorType.UNKNOWN_ERROR);
      expect(data.error.statusCode).toBe(500);
      expect(data.error.retryable).toBe(true);
      expect(data.error.userMessage).toBe('An unexpected error occurred. Please try again.');
    });

    it('should include timestamp in error', async () => {
      const error = new Error('Test error');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      const data = await response.json();
      expect(data.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include user-friendly message', async () => {
      const error = new Error('Invalid credentials');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
      });
      const response = await POST(request);

      const data = await response.json();
      expect(data.error.userMessage).toBe('Invalid email or password.');
      expect(data.error.message).toBe('Invalid credentials');
    });

    it('should handle all error types with appropriate status codes', async () => {
      const errorTests = [
        { error: 'Invalid credentials', type: AuthErrorType.INVALID_CREDENTIALS, status: 401 },
        { error: 'rate limit exceeded', type: AuthErrorType.RATE_LIMIT_EXCEEDED, status: 429 },
        { error: 'database error', type: AuthErrorType.DATABASE_ERROR, status: 503 },
        { error: 'network error', type: AuthErrorType.NETWORK_ERROR, status: 503 },
        { error: 'timeout error', type: AuthErrorType.TIMEOUT_ERROR, status: 408 },
      ];

      for (const test of errorTests) {
        mockNextAuthHandler.mockRejectedValueOnce(new Error(test.error));
        
        const request = new NextRequest('http://localhost:3000/api/auth/session');
        const response = await GET(request);
        const data = await response.json();

        expect(data.error.type).toBe(test.type);
        expect(response.status).toBe(test.status);
      }
    });
  });

  describe('Correlation IDs', () => {
    it('should generate unique correlation IDs', async () => {
      const mockResponse = new Response(
        JSON.stringify({ session: null }), 
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValue(mockResponse);

      const request1 = new NextRequest('http://localhost:3000/api/auth/session');
      const request2 = new NextRequest('http://localhost:3000/api/auth/session');

      await GET(request1);
      await GET(request2);

      const logCalls = consoleLogSpy.mock.calls;
      const correlationIds = logCalls
        .filter((call: any) => call[1]?.correlationId)
        .map((call: any) => call[1].correlationId);

      // Should have at least 2 unique correlation IDs (one per request)
      const uniqueIds = new Set(correlationIds);
      expect(uniqueIds.size).toBeGreaterThanOrEqual(2);
    });

    it('should use same correlation ID throughout request', async () => {
      const error = new Error('Test error');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      const data = await response.json();
      const responseCorrelationId = data.correlationId;

      // Check logs have same correlation ID
      const logCalls = consoleLogSpy.mock.calls;
      const errorCalls = consoleErrorSpy.mock.calls;
      const allCalls = [...logCalls, ...errorCalls];

      const loggedCorrelationIds = allCalls
        .filter((call: any) => call[1]?.correlationId)
        .map((call: any) => call[1].correlationId);

      expect(loggedCorrelationIds.every((id: string) => id === responseCorrelationId)).toBe(true);
    });

    it('should include correlation ID in error responses', async () => {
      const error = new Error('Test error');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);

      const data = await response.json();
      expect(data.correlationId).toMatch(/^auth-\d+-[a-z0-9]+$/);
      expect(data.error.correlationId).toBe(data.correlationId);
    });
  });

  describe('Performance', () => {
    it('should complete within timeout', async () => {
      const mockResponse = new Response(
        JSON.stringify({ session: null }), 
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const startTime = Date.now();
      await GET(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // Should be much less than 10s timeout
    });

    it('should log request duration', async () => {
      const mockResponse = new Response(
        JSON.stringify({ session: null }), 
        { status: 200 }
      );
      mockNextAuthHandler.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      await GET(request);

      const logCalls = consoleLogSpy.mock.calls;
      const durationLogs = logCalls.filter((call: any) => call[1]?.duration !== undefined);

      expect(durationLogs.length).toBeGreaterThan(0);
      expect(durationLogs[0][1].duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TypeScript Types', () => {
    it('should export AuthErrorType enum', () => {
      expect(AuthErrorType).toBeDefined();
      expect(AuthErrorType.AUTHENTICATION_FAILED).toBe('AUTHENTICATION_FAILED');
      expect(AuthErrorType.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
      expect(AuthErrorType.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
      expect(AuthErrorType.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(AuthErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(AuthErrorType.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should export authOptions', () => {
      expect(authOptions).toBeDefined();
      expect(typeof authOptions).toBe('object');
    });
  });

  describe('Security', () => {
    it('should not expose sensitive configuration in errors', async () => {
      const error = new Error('Test error');
      mockNextAuthHandler.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(request);
      const data = await response.json();

      // Check that error doesn't contain sensitive data
      const errorString = JSON.stringify(data.error);
      expect(errorString).not.toContain(process.env.NEXTAUTH_SECRET || '');
      expect(errorString).not.toContain(process.env.GOOGLE_CLIENT_SECRET || '');
    });
  });
});
