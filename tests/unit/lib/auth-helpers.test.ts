/**
 * Unit Tests for Auth Helpers
 * 
 * Tests the auth helper functions in lib/auth-helpers.ts
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession, requireAuth, getCurrentUser, requireUser } from '@/lib/auth-helpers';

// Mock the auth function from @/auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/auth';

describe('Auth Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSession()', () => {
    it('should return session when authenticated', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2024-12-31',
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      // Act
      const result = await getSession();

      // Assert
      expect(result).toEqual(mockSession);
      expect(auth).toHaveBeenCalledTimes(1);
    });

    it('should return null when not authenticated', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValue(null);

      // Act
      const result = await getSession();

      // Assert
      expect(result).toBeNull();
      expect(auth).toHaveBeenCalledTimes(1);
    });
  });

  describe('requireAuth()', () => {
    it('should return session when authenticated', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2024-12-31',
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      // Act
      const result = await requireAuth();

      // Assert
      expect(result).toEqual(mockSession);
      expect(auth).toHaveBeenCalledTimes(1);
    });

    it('should throw when not authenticated', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValue(null);

      // Act & Assert
      await expect(requireAuth()).rejects.toThrow('Unauthorized');
      expect(auth).toHaveBeenCalledTimes(1);
    });

    it('should throw when session exists but user is missing', async () => {
      // Arrange
      const mockSession = {
        expires: '2024-12-31',
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      // Act & Assert
      await expect(requireAuth()).rejects.toThrow('Unauthorized');
      expect(auth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentUser()', () => {
    it('should return user when authenticated', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };
      const mockSession = {
        user: mockUser,
        expires: '2024-12-31',
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toEqual(mockUser);
      expect(auth).toHaveBeenCalledTimes(1);
    });

    it('should return null when not authenticated', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValue(null);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(auth).toHaveBeenCalledTimes(1);
    });

    it('should return null when session exists but user is missing', async () => {
      // Arrange
      const mockSession = {
        expires: '2024-12-31',
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(auth).toHaveBeenCalledTimes(1);
    });
  });

  describe('requireUser()', () => {
    it('should return user when authenticated', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };
      const mockSession = {
        user: mockUser,
        expires: '2024-12-31',
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      // Act
      const result = await requireUser();

      // Assert
      expect(result).toEqual(mockUser);
      expect(auth).toHaveBeenCalledTimes(1);
    });

    it('should throw when not authenticated', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValue(null);

      // Act & Assert
      await expect(requireUser()).rejects.toThrow('Unauthorized');
      expect(auth).toHaveBeenCalledTimes(1);
    });

    it('should throw when session exists but user is missing', async () => {
      // Arrange
      const mockSession = {
        expires: '2024-12-31',
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      // Act & Assert
      await expect(requireUser()).rejects.toThrow('Unauthorized');
      expect(auth).toHaveBeenCalledTimes(1);
    });
  });
});
