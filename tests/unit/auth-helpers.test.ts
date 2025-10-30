/**
 * Unit Tests - Auth Helpers (Complete Module)
 * Tests for Requirement 3: Auth helper functions
 * 
 * Coverage:
 * - getSession() - Get session (can return null)
 * - requireAuth() - Require session (throws if null)
 * - getCurrentUser() - Get user (can return null)
 * - requireUser() - Require user (throws if null)
 * - Session retrieval
 * - Error throwing on null session
 * - Session return on success
 * - Async/await support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth function
const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

describe('Auth Helpers - Complete Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Module Exports', () => {
    it('should export all four helper functions', async () => {
      const authHelpers = await import('@/lib/auth-helpers');
      
      expect(authHelpers).toHaveProperty('getSession');
      expect(authHelpers).toHaveProperty('requireAuth');
      expect(authHelpers).toHaveProperty('getCurrentUser');
      expect(authHelpers).toHaveProperty('requireUser');
      
      expect(typeof authHelpers.getSession).toBe('function');
      expect(typeof authHelpers.requireAuth).toBe('function');
      expect(typeof authHelpers.getCurrentUser).toBe('function');
      expect(typeof authHelpers.requireUser).toBe('function');
    });
  });
});

describe('Auth Helpers - getSession()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should call auth() when invoked', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { getSession } = await import('@/lib/auth-helpers');
      await getSession();
      
      expect(mockAuth).toHaveBeenCalledTimes(1);
      expect(mockAuth).toHaveBeenCalledWith();
    });

    it('should return session when authenticated', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { getSession } = await import('@/lib/auth-helpers');
      const result = await getSession();
      
      expect(result).toEqual(mockSession);
    });

    it('should return null when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      
      const { getSession } = await import('@/lib/auth-helpers');
      const result = await getSession();
      
      expect(result).toBeNull();
    });

    it('should return undefined when auth returns undefined', async () => {
      mockAuth.mockResolvedValue(undefined);
      
      const { getSession } = await import('@/lib/auth-helpers');
      const result = await getSession();
      
      expect(result).toBeUndefined();
    });
  });

  describe('Async Support', () => {
    it('should be awaitable', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { getSession } = await import('@/lib/auth-helpers');
      const result = await getSession();
      
      expect(result).toBeDefined();
    });

    it('should return a Promise', async () => {
      mockAuth.mockResolvedValue(null);
      
      const { getSession } = await import('@/lib/auth-helpers');
      const result = getSession();
      
      expect(result).toBeInstanceOf(Promise);
      await result;
    });
  });
});

describe('Auth Helpers - getCurrentUser()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return user when authenticated', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { getCurrentUser } = await import('@/lib/auth-helpers');
      const result = await getCurrentUser();
      
      expect(result).toEqual(mockSession.user);
      expect(result?.id).toBe('user-123');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      
      const { getCurrentUser } = await import('@/lib/auth-helpers');
      const result = await getCurrentUser();
      
      expect(result).toBeNull();
    });

    it('should return null when session has no user', async () => {
      const mockSession = {
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { getCurrentUser } = await import('@/lib/auth-helpers');
      const result = await getCurrentUser();
      
      expect(result).toBeNull();
    });

    it('should handle session with undefined user', async () => {
      const mockSession = {
        user: undefined,
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { getCurrentUser } = await import('@/lib/auth-helpers');
      const result = await getCurrentUser();
      
      expect(result).toBeNull();
    });
  });

  describe('User Data Handling', () => {
    it('should return complete user object', async () => {
      const mockSession = {
        user: {
          id: 'user-456',
          email: 'creator@huntaze.com',
          name: 'Creator User',
          image: 'https://example.com/avatar.jpg',
        },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { getCurrentUser } = await import('@/lib/auth-helpers');
      const result = await getCurrentUser();
      
      expect(result).toEqual(mockSession.user);
      expect(result?.name).toBe('Creator User');
      expect(result?.image).toBe('https://example.com/avatar.jpg');
    });

    it('should handle user with minimal data', async () => {
      const mockSession = {
        user: { id: 'user-789' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { getCurrentUser } = await import('@/lib/auth-helpers');
      const result = await getCurrentUser();
      
      expect(result).toEqual({ id: 'user-789' });
    });
  });
});

describe('Auth Helpers - requireUser()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return user when authenticated', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireUser } = await import('@/lib/auth-helpers');
      const result = await requireUser();
      
      expect(result).toEqual(mockSession.user);
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      
      const { requireUser } = await import('@/lib/auth-helpers');
      
      await expect(requireUser()).rejects.toThrow('Unauthorized');
    });

    it('should throw error when session has no user', async () => {
      const mockSession = {
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireUser } = await import('@/lib/auth-helpers');
      
      await expect(requireUser()).rejects.toThrow('Unauthorized');
    });

    it('should throw with exact message "Unauthorized"', async () => {
      mockAuth.mockResolvedValue(null);
      
      const { requireUser } = await import('@/lib/auth-helpers');
      
      try {
        await requireUser();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toBe('Unauthorized');
      }
    });
  });

  describe('User Data Handling', () => {
    it('should return complete user object', async () => {
      const mockSession = {
        user: {
          id: 'user-456',
          email: 'creator@huntaze.com',
          name: 'Creator User',
          image: 'https://example.com/avatar.jpg',
        },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireUser } = await import('@/lib/auth-helpers');
      const result = await requireUser();
      
      expect(result).toEqual(mockSession.user);
      expect(result.name).toBe('Creator User');
      expect(result.image).toBe('https://example.com/avatar.jpg');
    });

    it('should handle user with minimal data', async () => {
      const mockSession = {
        user: { id: 'user-789' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireUser } = await import('@/lib/auth-helpers');
      const result = await requireUser();
      
      expect(result).toEqual({ id: 'user-789' });
    });
  });
});

describe('Auth Helpers - requireAuth()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 3.1: Export from @/lib/auth-helpers', () => {
    it('should export requireAuth function', async () => {
      const authHelpers = await import('@/lib/auth-helpers');
      
      expect(authHelpers).toHaveProperty('requireAuth');
      expect(typeof authHelpers.requireAuth).toBe('function');
    });
  });

  describe('Requirement 3.2: Invoke auth() to retrieve session', () => {
    it('should call auth() when invoked', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      await requireAuth();
      
      expect(mockAuth).toHaveBeenCalledTimes(1);
      expect(mockAuth).toHaveBeenCalledWith();
    });

    it('should call auth() without parameters', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      await requireAuth();
      
      expect(mockAuth).toHaveBeenCalledWith();
    });
  });

  describe('Requirement 3.3: Throw error on null session', () => {
    it('should throw error when session is null', async () => {
      mockAuth.mockResolvedValue(null);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      
      await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });

    it('should throw error with exact message "Unauthorized"', async () => {
      mockAuth.mockResolvedValue(null);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      
      try {
        await requireAuth();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toBe('Unauthorized');
      }
    });

    it('should throw error when session is undefined', async () => {
      mockAuth.mockResolvedValue(undefined);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      
      await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });
  });

  describe('Requirement 3.4: Return session on success', () => {
    it('should return session object when auth succeeds', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      const result = await requireAuth();
      
      expect(result).toEqual(mockSession);
    });

    it('should return complete session with user data', async () => {
      const mockSession = {
        user: {
          id: 'user-456',
          email: 'creator@huntaze.com',
          name: 'Creator User',
          image: 'https://example.com/avatar.jpg',
        },
        expires: '2025-12-31T23:59:59Z',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      const result = await requireAuth();
      
      expect(result.user.id).toBe('user-456');
      expect(result.user.email).toBe('creator@huntaze.com');
      expect(result.user.name).toBe('Creator User');
      expect(result.user.image).toBe('https://example.com/avatar.jpg');
    });

    it('should preserve all session properties', async () => {
      const mockSession = {
        user: { id: 'user-789', email: 'test@example.com' },
        expires: '2025-12-31',
        accessToken: 'token-abc123',
        customField: 'custom-value',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      const result = await requireAuth();
      
      expect(result).toHaveProperty('accessToken', 'token-abc123');
      expect(result).toHaveProperty('customField', 'custom-value');
    });
  });

  describe('Requirement 3.5: Support async/await', () => {
    it('should be awaitable', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      
      // Should not throw
      const result = await requireAuth();
      expect(result).toBeDefined();
    });

    it('should return a Promise', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      const result = requireAuth();
      
      expect(result).toBeInstanceOf(Promise);
      await result; // Clean up
    });

    it('should work in Server Components', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      // Simulate Server Component usage
      const { requireAuth } = await import('@/lib/auth-helpers');
      const session = await requireAuth();
      
      expect(session).toBeDefined();
      expect(session.user.id).toBe('user-123');
    });

    it('should handle async errors properly', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service error'));
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      
      await expect(requireAuth()).rejects.toThrow('Auth service error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle session with minimal user data', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      const result = await requireAuth();
      
      expect(result.user.id).toBe('user-123');
    });

    it('should handle session with extra properties', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
        extraProp1: 'value1',
        extraProp2: { nested: 'value2' },
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      const result = await requireAuth();
      
      expect(result).toHaveProperty('extraProp1', 'value1');
      expect(result).toHaveProperty('extraProp2');
    });

    it('should handle auth() returning falsy values', async () => {
      const falsyValues = [null, undefined, false, 0, ''];
      
      for (const falsyValue of falsyValues) {
        mockAuth.mockResolvedValue(falsyValue);
        
        const { requireAuth } = await import('@/lib/auth-helpers');
        
        await expect(requireAuth()).rejects.toThrow('Unauthorized');
      }
    });

    it('should not throw on empty session object', async () => {
      const mockSession = {
        user: {},
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      const result = await requireAuth();
      
      expect(result).toBeDefined();
      expect(result.user).toEqual({});
    });
  });

  describe('Performance', () => {
    it('should complete quickly', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      
      const startTime = Date.now();
      await requireAuth();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should not cache results between calls', async () => {
      const session1 = {
        user: { id: 'user-1', email: 'user1@example.com' },
        expires: '2025-12-31',
      };
      
      const session2 = {
        user: { id: 'user-2', email: 'user2@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValueOnce(session1).mockResolvedValueOnce(session2);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      
      const result1 = await requireAuth();
      const result2 = await requireAuth();
      
      expect(result1.user.id).toBe('user-1');
      expect(result2.user.id).toBe('user-2');
    });
  });

  describe('Type Safety', () => {
    it('should return typed session object', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      
      const { requireAuth } = await import('@/lib/auth-helpers');
      const result = await requireAuth();
      
      // TypeScript should infer these properties
      expect(typeof result.user.id).toBe('string');
      expect(typeof result.expires).toBe('string');
    });
  });
});
