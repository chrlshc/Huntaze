/**
 * Property-Based Tests for Auth Middleware
 * 
 * Tests universal properties that should hold for all auth middleware behavior
 * using fast-check for property-based testing.
 * 
 * Feature: production-critical-fixes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import * as fc from 'fast-check';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import type { RouteHandler } from '@/lib/middleware/types';

// Mock dependencies
vi.mock('../../../lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('../../../lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('../../../lib/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { auth } from '../../../lib/auth/config';
import { query } from '../../../lib/db';

describe('Auth Middleware Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 2: Auth Middleware Rejection
   * 
   * For any unauthenticated request to a protected route, the auth middleware
   * should return a 401 status code without calling the wrapped handler.
   * 
   * Validates: Requirements 3.2
   * 
   * Feature: production-critical-fixes, Property 2: Auth Middleware Rejection
   */
  describe('Property 2: Auth Middleware Rejection', () => {
    it('should return 401 for any unauthenticated request without calling handler', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random URL paths
          fc.webPath(),
          // Generate random HTTP methods
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          async (path, method) => {
            // Setup: Mock no session (unauthenticated)
            vi.mocked(auth).mockResolvedValue(null);

            // Create a mock handler that should NOT be called
            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            // Wrap handler with auth middleware
            const wrappedHandler = withAuth(mockHandler);

            // Create request with random properties
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, {
              method,
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Should return 401
            expect(response.status).toBe(401);

            // Verify: Handler should NOT have been called
            expect(handlerCalled.value).toBe(false);

            // Verify: Response should contain error message
            const body = await response.json();
            expect(body).toHaveProperty('error');
            expect(body.error).toBe('Unauthorized');
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    it('should return 401 when session exists but user is missing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          async (path, method) => {
            // Setup: Mock session without user
            vi.mocked(auth).mockResolvedValue({
              user: null as any,
              expires: new Date(Date.now() + 3600000).toISOString(),
            });

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withAuth(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method });

            // Execute
            const response = await wrappedHandler(req);

            // Verify
            expect(response.status).toBe(401);
            expect(handlerCalled.value).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 401 when session user is missing required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          // Generate sessions with missing fields
          fc.record({
            hasId: fc.boolean(),
            hasEmail: fc.boolean(),
          }),
          async (path, method, sessionConfig) => {
            // Skip cases where both are present (those should succeed)
            if (sessionConfig.hasId && sessionConfig.hasEmail) {
              return;
            }

            // Setup: Mock session with missing fields
            vi.mocked(auth).mockResolvedValue({
              user: {
                id: sessionConfig.hasId ? '123' : undefined,
                email: sessionConfig.hasEmail ? 'test@example.com' : undefined,
                name: 'Test User',
                onboardingCompleted: true,
              } as any,
              expires: new Date(Date.now() + 3600000).toISOString(),
            });

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withAuth(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method });

            // Execute
            const response = await wrappedHandler(req);

            // Verify
            expect(response.status).toBe(401);
            expect(handlerCalled.value).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Admin Access Control
   * 
   * For any non-admin user attempting to access an admin route, the auth
   * middleware should return a 403 status code.
   * 
   * Validates: Requirements 3.4
   * 
   * Feature: production-critical-fixes, Property 3: Admin Access Control
   */
  describe('Property 3: Admin Access Control', () => {
    it('should return 403 for any non-admin user accessing admin route', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 1000000 }),
          // Generate non-admin roles
          fc.constantFrom('user', 'moderator', 'guest', 'viewer', 'editor'),
          async (path, method, email, name, userId, role) => {
            // Setup: Mock valid session with non-admin user
            vi.mocked(auth).mockResolvedValue({
              user: {
                id: userId.toString(),
                email,
                name,
                onboardingCompleted: true,
              },
              expires: new Date(Date.now() + 3600000).toISOString(),
            });

            // Mock database query to return non-admin role
            vi.mocked(query).mockResolvedValue({
              rows: [{ role }],
              rowCount: 1,
              command: 'SELECT',
              oid: 0,
              fields: [],
            });

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            // Wrap handler with auth middleware requiring admin
            const wrappedHandler = withAuth(mockHandler, { requireAdmin: true });

            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Should return 403 Forbidden
            expect(response.status).toBe(403);

            // Verify: Handler should NOT have been called
            expect(handlerCalled.value).toBe(false);

            // Verify: Response should contain error message
            const body = await response.json();
            expect(body).toHaveProperty('error');
            expect(body.error).toBe('Forbidden');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call handler for any admin user accessing admin route', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 1000000 }),
          async (path, method, email, name, userId) => {
            // Setup: Mock valid session with admin user
            vi.mocked(auth).mockResolvedValue({
              user: {
                id: userId.toString(),
                email,
                name,
                onboardingCompleted: true,
              },
              expires: new Date(Date.now() + 3600000).toISOString(),
            });

            // Mock database query to return admin role
            vi.mocked(query).mockResolvedValue({
              rows: [{ role: 'admin' }],
              rowCount: 1,
              command: 'SELECT',
              oid: 0,
              fields: [],
            });

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              
              // Verify user is attached to request with role
              const authReq = req as AuthenticatedRequest;
              expect(authReq.user).toBeDefined();
              expect(authReq.user?.id).toBe(userId.toString());
              expect(authReq.user?.email).toBe(email);
              expect(authReq.user?.role).toBe('admin');
              
              return NextResponse.json({ success: true });
            };

            // Wrap handler with auth middleware requiring admin
            const wrappedHandler = withAuth(mockHandler, { requireAdmin: true });

            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called
            expect(handlerCalled.value).toBe(true);
            
            // Verify: Should return success response from handler
            expect(response.status).toBe(200);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Authenticated requests should call handler
   * 
   * This verifies the positive case - when authentication succeeds,
   * the handler should be called.
   */
  describe('Authenticated Request Handling', () => {
    it('should call handler for any authenticated request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 1000000 }),
          async (path, method, email, name, userId) => {
            // Setup: Mock valid session
            vi.mocked(auth).mockResolvedValue({
              user: {
                id: userId.toString(),
                email,
                name,
                onboardingCompleted: true,
              },
              expires: new Date(Date.now() + 3600000).toISOString(),
            });

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              
              // Verify user is attached to request
              const authReq = req as AuthenticatedRequest;
              expect(authReq.user).toBeDefined();
              expect(authReq.user?.id).toBe(userId.toString());
              expect(authReq.user?.email).toBe(email);
              
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withAuth(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called
            expect(handlerCalled.value).toBe(true);
            
            // Verify: Should return success response from handler
            expect(response.status).toBe(200);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
