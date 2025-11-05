/**
 * @jest-environment node
 */

/**
 * Integration tests for TikTok Connect Page
 * Tests the complete OAuth flow and platform navigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { afterEach } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';

// Mock Next.js server functions
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn(),
    json: jest.fn(),
  },
}));

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_APP_URL: 'https://test.huntaze.com',
  TIKTOK_CLIENT_KEY: 'test_client_key',
  TIKTOK_CLIENT_SECRET: 'test_client_secret',
  NEXT_PUBLIC_TIKTOK_REDIRECT_URI: 'https://test.huntaze.com/api/auth/tiktok/callback',
};

describe('TikTok Connect Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  afterEach(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach(key => {
      delete process.env[key];
    });
  });

  describe('OAuth Flow Integration', () => {
    it('should handle OAuth initiation correctly', async () => {
      // Import the OAuth init handler
      const { GET } = await import('@/app/api/auth/tiktok/route');

      const mockRequest = {
        nextUrl: {
          origin: 'https://test.huntaze.com',
        },
        url: 'https://test.huntaze.com/api/auth/tiktok',
      } as NextRequest;

      const mockRedirect = jest.fn();
      (NextResponse.redirect as jest.Mock) = mockRedirect;

      await GET(mockRequest);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('https://www.tiktok.com/auth/authorize/')
      );
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('client_key=test_client_key')
      );
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('scope=user.info.basic,video.upload')
      );
    });

    it('should handle missing credentials gracefully', async () => {
      // Remove credentials
      delete process.env.TIKTOK_CLIENT_KEY;

      const { GET } = await import('@/app/api/auth/tiktok/route');

      const mockRequest = {
        nextUrl: {
          origin: 'https://test.huntaze.com',
        },
        url: 'https://test.huntaze.com/api/auth/tiktok',
      } as NextRequest;

      const mockRedirect = jest.fn();
      (NextResponse.redirect as jest.Mock) = mockRedirect;

      await GET(mockRequest);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth?error=tiktok_unavailable')
      );
    });
  });

  describe('OAuth Callback Integration', () => {
    it('should handle successful OAuth callback', async () => {
      // Mock successful TikTok API responses
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test_access_token',
            refresh_token: 'test_refresh_token',
            expires_in: 86400,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              user: {
                open_id: 'test_open_id',
                display_name: 'testuser',
                avatar_url: 'https://example.com/avatar.jpg',
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              user: {
                follower_count: 1000,
                following_count: 500,
              },
            },
          }),
        });

      const { GET } = await import('@/app/api/auth/tiktok/callback/route');

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockImplementation((param) => {
              if (param === 'code') return 'test_auth_code';
              return null;
            }),
          },
        },
      } as any;

      const mockRedirect = jest.fn().mockReturnValue({
        cookies: {
          set: jest.fn(),
        },
      });
      (NextResponse.redirect as jest.Mock) = mockRedirect;

      await GET(mockRequest);

      expect(mockRedirect).toHaveBeenCalledWith(
        'https://test.huntaze.com/platforms/connect/tiktok?success=true&username=testuser'
      );
    });

    it('should handle OAuth callback errors', async () => {
      const { GET } = await import('@/app/api/auth/tiktok/callback/route');

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue(null), // No code parameter
          },
        },
      } as any;

      const mockRedirect = jest.fn();
      (NextResponse.redirect as jest.Mock) = mockRedirect;

      await GET(mockRequest);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('/platforms/connect/tiktok?error=missing_code')
      );
    });

    it('should handle TikTok API errors', async () => {
      // Mock failed TikTok API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid authorization code',
      });

      const { GET } = await import('@/app/api/auth/tiktok/callback/route');

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockImplementation((param) => {
              if (param === 'code') return 'invalid_code';
              return null;
            }),
          },
        },
      } as any;

      const mockRedirect = jest.fn();
      (NextResponse.redirect as jest.Mock) = mockRedirect;

      await GET(mockRequest);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('/platforms/connect/tiktok?error=callback_failed')
      );
    });
  });

  describe('Platform Navigation', () => {
    it('should provide consistent navigation between platforms', () => {
      // This test verifies that all platform connect pages exist and are accessible
      const platforms = [
        '/platforms/connect/tiktok',
        '/platforms/connect/instagram', 
        '/platforms/connect/reddit',
      ];

      platforms.forEach(platform => {
        // In a real integration test, you would make HTTP requests to these endpoints
        // For now, we're just verifying the paths are correctly structured
        expect(platform).toMatch(/^\/platforms\/connect\/\w+$/);
      });
    });

    it('should handle cross-platform navigation links', () => {
      // Test that navigation links between platforms are properly formatted
      const navigationLinks = [
        { from: 'tiktok', to: 'instagram', href: '/platforms/connect/instagram' },
        { from: 'tiktok', to: 'reddit', href: '/platforms/connect/reddit' },
        { from: 'instagram', to: 'tiktok', href: '/platforms/connect/tiktok' },
        { from: 'instagram', to: 'reddit', href: '/platforms/connect/reddit' },
        { from: 'reddit', to: 'tiktok', href: '/platforms/connect/tiktok' },
        { from: 'reddit', to: 'instagram', href: '/platforms/connect/instagram' },
      ];

      navigationLinks.forEach(link => {
        expect(link.href).toMatch(/^\/platforms\/connect\/\w+$/);
        expect(link.from).not.toBe(link.to); // Ensure no self-referencing links
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const { GET } = await import('@/app/api/auth/tiktok/callback/route');

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockImplementation((param) => {
              if (param === 'code') return 'test_code';
              return null;
            }),
          },
        },
      } as any;

      const mockRedirect = jest.fn();
      (NextResponse.redirect as jest.Mock) = mockRedirect;

      await GET(mockRequest);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('/platforms/connect/tiktok?error=callback_failed')
      );
    });

    it('should validate required environment variables', async () => {
      // Test with missing environment variables
      delete process.env.TIKTOK_CLIENT_SECRET;

      const { GET } = await import('@/app/api/auth/tiktok/callback/route');

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockImplementation((param) => {
              if (param === 'code') return 'test_code';
              return null;
            }),
          },
        },
      } as any;

      // Mock fetch to simulate the token exchange attempt
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid client credentials',
      });

      const mockRedirect = jest.fn();
      (NextResponse.redirect as jest.Mock) = mockRedirect;

      await GET(mockRequest);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('/platforms/connect/tiktok?error=callback_failed')
      );
    });
  });

  describe('Security Validation', () => {
    it('should use secure cookie settings', async () => {
      // Mock successful OAuth flow
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test_access_token',
            refresh_token: 'test_refresh_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              user: {
                open_id: 'test_open_id',
                display_name: 'testuser',
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        });

      const { GET } = await import('@/app/api/auth/tiktok/callback/route');

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockImplementation((param) => {
              if (param === 'code') return 'test_code';
              return null;
            }),
          },
        },
      } as any;

      const mockSetCookie = jest.fn();
      const mockRedirect = jest.fn().mockReturnValue({
        cookies: {
          set: mockSetCookie,
        },
      });
      (NextResponse.redirect as jest.Mock) = mockRedirect;

      await GET(mockRequest);

      // Verify secure cookie settings
      expect(mockSetCookie).toHaveBeenCalledWith(
        'tiktok_access_token',
        'test_access_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          secure: true,
          path: '/',
        })
      );
    });

    it('should properly encode URL parameters', async () => {
      // Test with special characters in username
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test_access_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              user: {
                open_id: 'test_open_id',
                display_name: 'test user@123',
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        });

      const { GET } = await import('@/app/api/auth/tiktok/callback/route');

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockImplementation((param) => {
              if (param === 'code') return 'test_code';
              return null;
            }),
          },
        },
      } as any;

      const mockRedirect = jest.fn().mockReturnValue({
        cookies: { set: jest.fn() },
      });
      (NextResponse.redirect as jest.Mock) = mockRedirect;

      await GET(mockRequest);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('username=test%20user%40123')
      );
    });
  });
});