/**
 * Token Refresh Scheduler - Instagram Tests
 * 
 * Tests for Instagram token refresh functionality in the scheduler
 */

import { TokenRefreshScheduler } from '@/lib/workers/tokenRefreshScheduler';
import { oauthAccountsRepository } from '@/lib/db/repositories/oauthAccountsRepository';
import { tokenEncryption } from '@/lib/services/tokenEncryption';

// Mock dependencies
vi.mock('@/lib/db/repositories/oauthAccountsRepository');
vi.mock('@/lib/services/tokenEncryption');
vi.mock('@/lib/services/instagramOAuth', () => ({
  InstagramOAuthService: vi.fn().mockImplementation(() => ({
    refreshLongLivedToken: vi.fn(),
  })),
}));

const mockOAuthRepository = oauthAccountsRepository as jest.Mocked<typeof oauthAccountsRepository>;
const mockTokenEncryption = tokenEncryption as jest.Mocked<typeof tokenEncryption>;

describe('TokenRefreshScheduler - Instagram Integration', () => {
  let scheduler: TokenRefreshScheduler;
  let mockInstagramOAuth: any;

  beforeEach(() => {
    scheduler = new TokenRefreshScheduler();
    
    // Get the mocked Instagram OAuth service
    const { InstagramOAuthService } = require('@/lib/services/instagramOAuth');
    mockInstagramOAuth = new InstagramOAuthService();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Instagram Token Refresh', () => {
    it('should refresh Instagram tokens successfully', async () => {
      const mockAccount = {
        id: 1,
        provider: 'instagram',
        openId: 'ig_user_123',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      };

      const mockEncryptedTokens = {
        accessToken: 'encrypted_access_token',
        refreshToken: null, // Instagram doesn't use refresh tokens
      };

      const mockDecryptedAccessToken = 'decrypted_access_token';

      const mockRefreshedToken = {
        access_token: 'new_access_token',
        token_type: 'bearer',
        expires_in: 5184000, // 60 days
      };

      // Mock repository calls
      mockOAuthRepository.findExpiringSoon.mockResolvedValue([mockAccount]);
      mockOAuthRepository.getEncryptedTokens.mockResolvedValue(mockEncryptedTokens);
      mockOAuthRepository.updateTokens.mockResolvedValue(undefined);

      // Mock token encryption
      mockTokenEncryption.decryptAccessToken.mockReturnValue(mockDecryptedAccessToken);

      // Mock Instagram OAuth service
      mockInstagramOAuth.refreshLongLivedToken.mockResolvedValue(mockRefreshedToken);

      // Run the scheduler
      const result = await scheduler.refreshExpiringTokens();

      // Verify results
      expect(result.total).toBe(1);
      expect(result.refreshed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify Instagram OAuth service was called correctly
      expect(mockInstagramOAuth.refreshLongLivedToken).toHaveBeenCalledWith(mockDecryptedAccessToken);

      // Verify database was updated
      expect(mockOAuthRepository.updateTokens).toHaveBeenCalledWith({
        id: 1,
        accessToken: 'new_access_token',
        refreshToken: undefined, // Instagram doesn't use refresh tokens
        expiresAt: expect.any(Date),
      });

      // Verify expiry date is approximately 60 days from now
      const updateCall = mockOAuthRepository.updateTokens.mock.calls[0][0];
      const expiryDate = updateCall.expiresAt as Date;
      const expectedExpiry = new Date(Date.now() + 5184000 * 1000);
      const timeDiff = Math.abs(expiryDate.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it('should handle missing access token for Instagram', async () => {
      const mockAccount = {
        id: 1,
        provider: 'instagram',
        openId: 'ig_user_123',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      };

      const mockEncryptedTokens = {
        accessToken: null, // No access token
        refreshToken: null,
      };

      mockOAuthRepository.findExpiringSoon.mockResolvedValue([mockAccount]);
      mockOAuthRepository.getEncryptedTokens.mockResolvedValue(mockEncryptedTokens);

      const result = await scheduler.refreshExpiringTokens();

      expect(result.total).toBe(1);
      expect(result.refreshed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('No access token available for Instagram');
    });

    it('should handle Instagram OAuth service errors', async () => {
      const mockAccount = {
        id: 1,
        provider: 'instagram',
        openId: 'ig_user_123',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      };

      const mockEncryptedTokens = {
        accessToken: 'encrypted_access_token',
        refreshToken: null,
      };

      mockOAuthRepository.findExpiringSoon.mockResolvedValue([mockAccount]);
      mockOAuthRepository.getEncryptedTokens.mockResolvedValue(mockEncryptedTokens);
      mockTokenEncryption.decryptAccessToken.mockReturnValue('decrypted_access_token');

      // Mock Instagram OAuth service to throw error
      mockInstagramOAuth.refreshLongLivedToken.mockRejectedValue(
        new Error('Token has expired and cannot be refreshed')
      );

      const result = await scheduler.refreshExpiringTokens();

      expect(result.total).toBe(1);
      expect(result.refreshed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Token has expired and cannot be refreshed');
    });

    it('should handle rate limiting errors gracefully', async () => {
      const mockAccount = {
        id: 1,
        provider: 'instagram',
        openId: 'ig_user_123',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      };

      const mockEncryptedTokens = {
        accessToken: 'encrypted_access_token',
        refreshToken: null,
      };

      mockOAuthRepository.findExpiringSoon.mockResolvedValue([mockAccount]);
      mockOAuthRepository.getEncryptedTokens.mockResolvedValue(mockEncryptedTokens);
      mockTokenEncryption.decryptAccessToken.mockReturnValue('decrypted_access_token');

      // Mock rate limiting error
      mockInstagramOAuth.refreshLongLivedToken.mockRejectedValue(
        new Error('Rate limit exceeded. Please try again later.')
      );

      const result = await scheduler.refreshExpiringTokens();

      expect(result.total).toBe(1);
      expect(result.refreshed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toBe('Rate limit exceeded. Please try again later.');
    });
  });

  describe('Mixed Provider Refresh', () => {
    it('should handle both TikTok and Instagram accounts', async () => {
      const mockAccounts = [
        {
          id: 1,
          provider: 'tiktok',
          openId: 'tiktok_user_123',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
        {
          id: 2,
          provider: 'instagram',
          openId: 'ig_user_123',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      ];

      // Mock TikTok tokens (has refresh token)
      const mockTikTokTokens = {
        accessToken: 'encrypted_tiktok_access',
        refreshToken: 'encrypted_tiktok_refresh',
      };

      // Mock Instagram tokens (no refresh token)
      const mockInstagramTokens = {
        accessToken: 'encrypted_instagram_access',
        refreshToken: null,
      };

      mockOAuthRepository.findExpiringSoon.mockResolvedValue(mockAccounts);
      mockOAuthRepository.getEncryptedTokens
        .mockResolvedValueOnce(mockTikTokTokens)
        .mockResolvedValueOnce(mockInstagramTokens);

      mockTokenEncryption.decryptRefreshToken.mockReturnValue('decrypted_tiktok_refresh');
      mockTokenEncryption.decryptAccessToken.mockReturnValue('decrypted_instagram_access');

      // Mock successful Instagram refresh
      mockInstagramOAuth.refreshLongLivedToken.mockResolvedValue({
        access_token: 'new_instagram_token',
        token_type: 'bearer',
        expires_in: 5184000,
      });

      // Mock TikTok OAuth (would need to be mocked separately)
      // For this test, we'll assume TikTok fails to focus on Instagram
      mockOAuthRepository.updateTokens.mockResolvedValue(undefined);

      const result = await scheduler.refreshExpiringTokens();

      // Should process both accounts
      expect(result.total).toBe(2);
      
      // Verify Instagram OAuth was called
      expect(mockInstagramOAuth.refreshLongLivedToken).toHaveBeenCalledWith('decrypted_instagram_access');
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customScheduler = new TokenRefreshScheduler({
        expiryWindowMinutes: 120,
        batchSize: 25,
      });

      expect(customScheduler).toBeDefined();
    });

    it('should check if scheduler is running', () => {
      expect(scheduler.isSchedulerRunning()).toBe(false);
    });
  });
});