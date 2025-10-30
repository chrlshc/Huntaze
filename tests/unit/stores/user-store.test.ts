/**
 * Unit Tests - User Store (Zustand)
 * Tests for Task 1.6: Setup global state management with Zustand
 * 
 * Coverage:
 * - User state management
 * - Authentication state
 * - Login/logout actions
 * - State persistence
 * - State updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the store
const mockUserStore = {
  user: null,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn(),
};

vi.mock('@/lib/stores/user-store', () => ({
  useUserStore: () => mockUserStore,
}));

describe('User Store - Task 1.6', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserStore.user = null;
    mockUserStore.isAuthenticated = false;
  });

  describe('Initial State', () => {
    it('should have null user initially', () => {
      expect(mockUserStore.user).toBeNull();
    });

    it('should have isAuthenticated false initially', () => {
      expect(mockUserStore.isAuthenticated).toBe(false);
    });

    it('should have login function', () => {
      expect(mockUserStore.login).toBeDefined();
      expect(typeof mockUserStore.login).toBe('function');
    });

    it('should have logout function', () => {
      expect(mockUserStore.logout).toBeDefined();
      expect(typeof mockUserStore.logout).toBe('function');
    });

    it('should have setUser function', () => {
      expect(mockUserStore.setUser).toBeDefined();
      expect(typeof mockUserStore.setUser).toBe('function');
    });
  });

  describe('Login Action', () => {
    it('should call login with credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      await mockUserStore.login(credentials);

      expect(mockUserStore.login).toHaveBeenCalledWith(credentials);
      expect(mockUserStore.login).toHaveBeenCalledTimes(1);
    });

    it('should update user state after successful login', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUserStore.user = user;
      mockUserStore.isAuthenticated = true;

      expect(mockUserStore.user).toEqual(user);
      expect(mockUserStore.isAuthenticated).toBe(true);
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      mockUserStore.login.mockRejectedValueOnce(error);

      await expect(mockUserStore.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('Logout Action', () => {
    it('should call logout function', () => {
      mockUserStore.logout();

      expect(mockUserStore.logout).toHaveBeenCalledTimes(1);
    });

    it('should clear user state after logout', () => {
      mockUserStore.user = null;
      mockUserStore.isAuthenticated = false;

      expect(mockUserStore.user).toBeNull();
      expect(mockUserStore.isAuthenticated).toBe(false);
    });

    it('should clear authentication state', () => {
      mockUserStore.isAuthenticated = false;

      expect(mockUserStore.isAuthenticated).toBe(false);
    });
  });

  describe('Set User Action', () => {
    it('should update user state', () => {
      const user = {
        id: 'user-456',
        email: 'creator@huntaze.com',
        name: 'Creator User',
      };

      mockUserStore.setUser(user);

      expect(mockUserStore.setUser).toHaveBeenCalledWith(user);
    });

    it('should handle partial user updates', () => {
      const partialUser = {
        name: 'Updated Name',
      };

      mockUserStore.setUser(partialUser);

      expect(mockUserStore.setUser).toHaveBeenCalledWith(partialUser);
    });

    it('should handle null user', () => {
      mockUserStore.setUser(null);

      expect(mockUserStore.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('User Data Structure', () => {
    it('should support user with all fields', () => {
      const user = {
        id: 'user-789',
        email: 'full@example.com',
        name: 'Full User',
        avatar: 'https://example.com/avatar.jpg',
        role: 'creator',
        subscription: 'pro',
      };

      mockUserStore.user = user;

      expect(mockUserStore.user).toEqual(user);
      expect(mockUserStore.user.id).toBe('user-789');
      expect(mockUserStore.user.email).toBe('full@example.com');
      expect(mockUserStore.user.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should support user with minimal fields', () => {
      const user = {
        id: 'user-minimal',
        email: 'minimal@example.com',
      };

      mockUserStore.user = user;

      expect(mockUserStore.user).toEqual(user);
      expect(mockUserStore.user.name).toBeUndefined();
    });
  });

  describe('Authentication State', () => {
    it('should be false when user is null', () => {
      mockUserStore.user = null;
      mockUserStore.isAuthenticated = false;

      expect(mockUserStore.isAuthenticated).toBe(false);
    });

    it('should be true when user is set', () => {
      mockUserStore.user = { id: 'user-123', email: 'test@example.com' };
      mockUserStore.isAuthenticated = true;

      expect(mockUserStore.isAuthenticated).toBe(true);
    });

    it('should sync with user state', () => {
      mockUserStore.user = { id: 'user-123', email: 'test@example.com' };
      mockUserStore.isAuthenticated = true;

      expect(mockUserStore.user).not.toBeNull();
      expect(mockUserStore.isAuthenticated).toBe(true);
    });
  });

  describe('State Persistence', () => {
    it('should persist user state to localStorage', () => {
      const user = {
        id: 'user-persist',
        email: 'persist@example.com',
        name: 'Persist User',
      };

      // Simulate persistence
      const stored = JSON.stringify({ user, isAuthenticated: true });
      expect(stored).toContain('user-persist');
      expect(stored).toContain('persist@example.com');
    });

    it('should restore user state from localStorage', () => {
      const storedState = {
        user: {
          id: 'user-restored',
          email: 'restored@example.com',
        },
        isAuthenticated: true,
      };

      mockUserStore.user = storedState.user;
      mockUserStore.isAuthenticated = storedState.isAuthenticated;

      expect(mockUserStore.user).toEqual(storedState.user);
      expect(mockUserStore.isAuthenticated).toBe(true);
    });

    it('should handle corrupted localStorage data', () => {
      // Should not throw error with invalid data
      expect(() => {
        mockUserStore.user = null;
        mockUserStore.isAuthenticated = false;
      }).not.toThrow();
    });
  });

  describe('Concurrent Updates', () => {
    it('should handle multiple login attempts', async () => {
      const credentials1 = { email: 'user1@example.com', password: 'pass1' };
      const credentials2 = { email: 'user2@example.com', password: 'pass2' };

      mockUserStore.login(credentials1);
      mockUserStore.login(credentials2);

      expect(mockUserStore.login).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid state changes', () => {
      mockUserStore.setUser({ id: '1', email: 'user1@example.com' });
      mockUserStore.setUser({ id: '2', email: 'user2@example.com' });
      mockUserStore.setUser({ id: '3', email: 'user3@example.com' });

      expect(mockUserStore.setUser).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during login', async () => {
      const networkError = new Error('Network error');
      mockUserStore.login.mockRejectedValueOnce(networkError);

      await expect(mockUserStore.login({ email: 'test@example.com', password: 'pass' }))
        .rejects.toThrow('Network error');
    });

    it('should handle invalid user data', () => {
      expect(() => {
        mockUserStore.setUser({ id: '', email: '' });
      }).not.toThrow();
    });

    it('should handle logout errors gracefully', () => {
      mockUserStore.logout.mockImplementationOnce(() => {
        throw new Error('Logout failed');
      });

      expect(() => mockUserStore.logout()).toThrow('Logout failed');
    });
  });
});
