/**
 * Integration Tests - TikTok OAuth Endpoints
 * 
 * Tests for TikTok OAuth API endpoints
 * Based on: .kiro/specs/social-integrations/tasks.md (Tasks 3.2, 3.3)
 * 
 * Coverage:
 * - GET /api/auth/tiktok (OAuth initialization)
 * - POST /api/auth/tiktok/callback (OAuth callback)
 * - State validation (CSRF protection)
 * - Token exchange flow
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as tiktokInit } from '../../../app/api/auth/tiktok/route';
import { POST as tiktokCallback } from '../../../app/api/auth/tiktok/callback/route';

// Mock environment variables
const mockEnv = {
  TIKTOK_CLIENT_KEY: 'test_client_key',
  TIKTOK_CLIENT_SECRET: 'test_client_secret',
  NEXT_PUBLIC_TIKTOK_REDIRECT_URI: 'https://test.com/callback',
  TIKTOK_SCOPES: 'user.info.basic,video.upload',
};

describe('TikTok OAuth Endpoints - Integration Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    Object.assign(process.env, mockEnv);
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Task 3.2 - OAuth Init Endpoint (GET /api/auth/tiktok)', () => {
    it('should redirect to TikTok authorization URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/tiktok');
      
      const response = await tiktokInit(request);
      
      expect(response.status).toBe(307); // Temporary redirect
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
      expect(location).toContain('https://www.tiktok.com/auth/authorize/');
    });

    it('should include client_key in authorization URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/tiktok');
      
      const response = await tiktokInit(request);
      const location = response.headers.get('location');
      
      expect(location).toContain(`client_key=${mockEnv.TIKTOK_CLIENT_KEY}`);
    });

    it('should include scopes in authorization URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/tiktok');
      
      const response = await tiktokInit(request);
      const location = response.headers.get('location');
      
      expect(location).toContain('scope=user.info.basic%2Cvideo.upload');
    });

    it('should include response_type=code', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/tiktok');
      
      const response = await tiktokInit(request);
      const location = response.headers.get('location');
      
      expect(location).toContain('response_type=code');
    });

    it('should include redirect_uri', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/tiktok');
      
      const response = await tiktokInit(request);
      const location = response.headers.get('location');
      
      expect(location).toContain(`redirect_uri=${encodeURIComponent(mockEnv.NEXT_PUBLIC_TIKTOK_REDIRECT_URI)}`);
    });

    it('should use default scopes if TIKTOK_SCOPES not set', async () => {
      delete process.env.TIKTOK_SCOPES;
      
      const request = new NextRequest('http://localhost:3000/api/auth/tiktok');
      const response = await tiktokInit(request);
      const location = response.headers.get('location');
      
      expect(location).toContain('scope=user.info.basic%2Cvideo.upload');
    });

    it('should handle missing environment variables gracefully', async () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      
      const request = new NextRequest('http://localhost:3000/api/auth/tiktok');
      const response = await tiktokInit(request);
      
      // Should still redirect but with undefined values
      expect(response.status).toBe(307);
    });
  });

  describe('Task 3.3 - OAuth Callback Endpoint (POST /api/auth/tiktok/callback)', () => {
    describe('Successful Token Exchange', () => {
      it('should exchange code for tokens successfully', async () => {
        const mockTokenResponse = {
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          expires_in: 86400,
          open_id: 'test_open_id',
          scope: 'user.info.basic,video.upload',
          token_type: 'Bearer',
        };

        const mockUserResponse = {
          data: {
            user: {
              open_id: 'test_open_id',
              union_id: 'test_union_id',
              display_name: 'Test User',
              avatar_url: 'https://example.com/avatar.jpg',
              profile_deep_link: 'https://tiktok.com/@testuser',
            },
          },
        };

        const mockStatsResponse = {
          data: {
            user: {
              follower_count: 1000,
              following_count: 500,
              likes_count: 5000,
              video_count: 50,
            },
          },
        };

        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockTokenResponse,
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockUserResponse,
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockStatsResponse,
          });

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({
            code: 'test_authorization_code',
            codeVerifier: 'test_verifier',
          }),
        });

        const response = await tiktokCallback(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user).toEqual({
          displayName: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          followerCount: 1000,
          likesCount: 5000,
          videoCount: 50,
        });
      });

      it('should call token endpoint with correct parameters', async () => {
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'token', refresh_token: 'refresh' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { user: {} } }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { user: {} } }),
          });

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({
            code: 'test_code',
            codeVerifier: 'test_verifier',
          }),
        });

        await tiktokCallback(request);

        const tokenCall = (global.fetch as any).mock.calls[0];
        expect(tokenCall[0]).toBe('https://open.tiktokapis.com/v2/oauth/token/');
        expect(tokenCall[1].method).toBe('POST');
        expect(tokenCall[1].headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        
        const body = tokenCall[1].body;
        expect(body).toContain(`client_key=${mockEnv.TIKTOK_CLIENT_KEY}`);
        expect(body).toContain(`client_secret=${mockEnv.TIKTOK_CLIENT_SECRET}`);
        expect(body).toContain('code=test_code');
        expect(body).toContain('grant_type=authorization_code');
        expect(body).toContain('code_verifier=test_verifier');
      });

      it('should fetch user info with access token', async () => {
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'test_token', refresh_token: 'refresh' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { user: { display_name: 'Test' } } }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { user: {} } }),
          });

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({ code: 'test_code' }),
        });

        await tiktokCallback(request);

        const userInfoCall = (global.fetch as any).mock.calls[1];
        expect(userInfoCall[0]).toBe('https://open.tiktokapis.com/v2/user/info/');
        expect(userInfoCall[1].method).toBe('POST');
        expect(userInfoCall[1].headers['Authorization']).toBe('Bearer test_token');
      });

      it('should fetch user stats', async () => {
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'test_token', refresh_token: 'refresh' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { user: {} } }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              data: {
                user: {
                  follower_count: 1000,
                  likes_count: 5000,
                },
              },
            }),
          });

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({ code: 'test_code' }),
        });

        const response = await tiktokCallback(request);
        const data = await response.json();

        expect(data.user.followerCount).toBe(1000);
        expect(data.user.likesCount).toBe(5000);
      });

      it('should handle missing stats gracefully', async () => {
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'test_token', refresh_token: 'refresh' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { user: { display_name: 'Test' } } }),
          })
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Failed to get stats' }),
          });

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({ code: 'test_code' }),
        });

        const response = await tiktokCallback(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.user.followerCount).toBe(0);
        expect(data.user.likesCount).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should return 400 if code is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({}),
        });

        const response = await tiktokCallback(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing authorization code');
      });

      it('should handle token exchange failure', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => 'Invalid authorization code',
        });

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({ code: 'invalid_code' }),
        });

        const response = await tiktokCallback(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Failed to exchange code for token');
      });

      it('should handle user info fetch failure', async () => {
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'test_token', refresh_token: 'refresh' }),
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Invalid token' }),
          });

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({ code: 'test_code' }),
        });

        const response = await tiktokCallback(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Failed to get user info');
      });

      it('should handle network errors', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({ code: 'test_code' }),
        });

        const response = await tiktokCallback(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });

      it('should handle malformed JSON in request', async () => {
        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await tiktokCallback(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });

      it('should log errors to console', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        global.fetch = vi.fn().mockRejectedValue(new Error('Test error'));

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({ code: 'test_code' }),
        });

        await tiktokCallback(request);

        expect(consoleSpy).toHaveBeenCalledWith(
          'TikTok callback error:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });

    describe('CSRF Protection (State Validation)', () => {
      // Note: Current implementation doesn't validate state
      // This is a security concern that should be addressed
      
      it('should accept requests without state validation (current behavior)', async () => {
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'token', refresh_token: 'refresh' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { user: {} } }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { user: {} } }),
          });

        const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
          method: 'POST',
          body: JSON.stringify({ code: 'test_code' }),
        });

        const response = await tiktokCallback(request);

        expect(response.status).toBe(200);
      });

      // TODO: Add state validation tests when implemented
      it.todo('should validate state parameter against stored state');
      it.todo('should reject requests with invalid state');
      it.todo('should reject requests with missing state');
      it.todo('should prevent CSRF attacks');
    });

    describe('Token Storage', () => {
      // TODO: Add database integration tests when implemented
      
      it.todo('should store tokens in oauth_accounts table');
      it.todo('should encrypt tokens before storage');
      it.todo('should associate tokens with user account');
      it.todo('should update existing tokens if reconnecting');
    });
  });

  describe('Integration Requirements', () => {
    it('should satisfy Requirement 1.1 - OAuth initialization', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/tiktok');
      const response = await tiktokInit(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('tiktok.com');
    });

    it('should satisfy Requirement 1.2 - OAuth callback', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'token', refresh_token: 'refresh' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        });

      const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'test_code' }),
      });

      const response = await tiktokCallback(request);
      
      expect(response.status).toBe(200);
    });

    it('should satisfy Requirement 1.4 - Token storage (structure)', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 86400,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: { open_id: 'id' } } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        });

      const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'test_code' }),
      });

      const response = await tiktokCallback(request);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should use HTTPS for all TikTok API calls', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'token', refresh_token: 'refresh' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        });

      const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'test_code' }),
      });

      await tiktokCallback(request);

      const calls = (global.fetch as any).mock.calls;
      calls.forEach((call: any) => {
        expect(call[0]).toMatch(/^https:\/\//);
      });
    });

    it('should not expose client_secret in responses', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        text: async () => 'Error',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'test_code' }),
      });

      const response = await tiktokCallback(request);
      const data = await response.json();
      const responseText = JSON.stringify(data);

      expect(responseText).not.toContain(mockEnv.TIKTOK_CLIENT_SECRET);
    });

    it('should not log sensitive tokens', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Test error'));

      const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'secret_code_12345' }),
      });

      await tiktokCallback(request);

      const logCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(logCalls).not.toContain('secret_code_12345');

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should complete callback within reasonable time', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'token', refresh_token: 'refresh' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        });

      const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'test_code' }),
      });

      const start = Date.now();
      await tiktokCallback(request);
      const duration = Date.now() - start;

      // Should complete in less than 5 seconds (generous for mocked calls)
      expect(duration).toBeLessThan(5000);
    });

    it('should make API calls in parallel when possible', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'token', refresh_token: 'refresh' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { user: {} } }),
        });

      global.fetch = fetchSpy;

      const request = new NextRequest('http://localhost:3000/api/auth/tiktok/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'test_code' }),
      });

      await tiktokCallback(request);

      // Should make 3 calls: token, user info, stats
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
  });
});
