/**
 * useAuthSession Hook Tests
 * 
 * Tests for the authentication session management hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('useAuthSession', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it('should return null user when not authenticated', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return user data when authenticated', () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        onboardingCompleted: true,
      },
      expires: '2024-12-31',
    };

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.user).toEqual({
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      onboardingCompleted: true,
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should show loading state', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'loading',
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle logout', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
        onboardingCompleted: true,
      },
      expires: '2024-12-31',
    };

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: mockUpdate,
    });

    (signOut as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuthSession());

    await act(async () => {
      await result.current.logout();
    });

    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(mockRouter.push).toHaveBeenCalledWith('/auth');
  });

  it('should handle session refresh', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
        onboardingCompleted: true,
      },
      expires: '2024-12-31',
    };

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: mockUpdate,
    });

    mockUpdate.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuthSession());

    await act(async () => {
      await result.current.refreshSession();
    });

    expect(mockUpdate).toHaveBeenCalled();
  });
});
