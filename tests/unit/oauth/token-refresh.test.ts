/**
 * Unit Tests for Token Refresh
 *
 * **Feature: content-posting-system**
 * **Validates: Requirements 2.3**
 *
 * Tests token refresh functionality for Instagram and TikTok.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  refreshInstagramToken,
  refreshTikTokToken,
  refreshToken,
  ensureValidToken,
  isTokenExpired,
  clearRefreshAttempts,
} from "../../../lib/oauth/token-refresh";
import { ContentPlatform, SocialAccount } from "@prisma/client";

// Mock dependencies
vi.mock("../../../lib/services/tiktokOAuth", () => ({
  tiktokOAuth: {
    refreshAccessToken: vi.fn(),
  },
}));

vi.mock("../../../lib/services/instagramOAuth", () => ({
  instagramOAuth: {
    refreshLongLivedToken: vi.fn(),
  },
}));

vi.mock("../../../lib/crypto/token-encryption", () => ({
  encryptToken: vi.fn((token: string) => `encrypted:${token}`),
  decryptToken: vi.fn((token: string) => {
    if (token.startsWith("encrypted:")) {
      return token.replace("encrypted:", "");
    }
    return token;
  }),
}));

vi.mock("../../../lib/logger", () => ({
  makeReqLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Import mocked modules
import { tiktokOAuth } from "../../../lib/services/tiktokOAuth";
import { instagramOAuth } from "../../../lib/services/instagramOAuth";

// Mock Prisma client
const mockPrisma = {
  socialAccount: {
    update: vi.fn(),
  },
} as any;

describe("Token Refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRefreshAttempts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isTokenExpired", () => {
    it("should return true if expiresAt is null", () => {
      expect(isTokenExpired(null)).toBe(true);
    });

    it("should return true if token is expired", () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(isTokenExpired(pastDate)).toBe(true);
    });

    it("should return true if token expires within buffer time", () => {
      // Token expires in 30 minutes, buffer is 1 hour
      const soonDate = new Date(Date.now() + 30 * 60 * 1000);
      expect(isTokenExpired(soonDate)).toBe(true);
    });

    it("should return false if token is valid beyond buffer time", () => {
      // Token expires in 2 hours, buffer is 1 hour
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      expect(isTokenExpired(futureDate)).toBe(false);
    });

    it("should respect custom buffer time", () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000);
      // With 15 minute buffer, token should be valid
      expect(isTokenExpired(futureDate, 15 * 60 * 1000)).toBe(false);
      // With 45 minute buffer, token should need refresh
      expect(isTokenExpired(futureDate, 45 * 60 * 1000)).toBe(true);
    });
  });

  describe("refreshInstagramToken", () => {
    const mockInstagramAccount: SocialAccount = {
      id: "test-ig-account",
      userId: 1,
      platform: ContentPlatform.INSTAGRAM,
      platformUserId: "ig-user-123",
      pageId: "page-123",
      pageAccessToken: "old-ig-token",
      accessToken: null,
      refreshToken: null,
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should refresh Instagram token successfully", async () => {
      vi.mocked(instagramOAuth.refreshLongLivedToken).mockResolvedValue({
        access_token: "new-ig-token",
        token_type: "bearer",
        expires_in: 5184000, // 60 days
      });

      mockPrisma.socialAccount.update.mockResolvedValue({});

      const result = await refreshInstagramToken(mockInstagramAccount, mockPrisma);

      expect(result.success).toBe(true);
      expect(result.newAccessToken).toBe("new-ig-token");
      expect(result.expiresAt).toBeDefined();

      // Verify database was updated
      expect(mockPrisma.socialAccount.update).toHaveBeenCalledWith({
        where: { id: "test-ig-account" },
        data: expect.objectContaining({
          pageAccessToken: "encrypted:new-ig-token",
        }),
      });
    });

    it("should return error if no pageAccessToken exists", async () => {
      const accountWithoutToken = {
        ...mockInstagramAccount,
        pageAccessToken: null,
      };

      const result = await refreshInstagramToken(accountWithoutToken, mockPrisma);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No pageAccessToken found");
    });

    it("should return error if refresh API fails", async () => {
      vi.mocked(instagramOAuth.refreshLongLivedToken).mockRejectedValue(
        new Error("Token has expired and cannot be refreshed")
      );

      const result = await refreshInstagramToken(mockInstagramAccount, mockPrisma);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Token has expired");
    });

    it("should throttle rapid refresh attempts", async () => {
      vi.mocked(instagramOAuth.refreshLongLivedToken).mockResolvedValue({
        access_token: "new-ig-token",
        token_type: "bearer",
        expires_in: 5184000,
      });

      mockPrisma.socialAccount.update.mockResolvedValue({});

      // First attempt should succeed
      const result1 = await refreshInstagramToken(mockInstagramAccount, mockPrisma);
      expect(result1.success).toBe(true);

      // Second attempt should be throttled
      const result2 = await refreshInstagramToken(mockInstagramAccount, mockPrisma);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain("too recently");
    });
  });

  describe("refreshTikTokToken", () => {
    const mockTikTokAccount: SocialAccount = {
      id: "test-tt-account",
      userId: 1,
      platform: ContentPlatform.TIKTOK,
      platformUserId: "tt-user-123",
      pageId: null,
      pageAccessToken: null,
      accessToken: "old-tt-access-token",
      refreshToken: "old-tt-refresh-token",
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should refresh TikTok token successfully", async () => {
      vi.mocked(tiktokOAuth.refreshAccessToken).mockResolvedValue({
        access_token: "new-tt-access-token",
        refresh_token: "new-tt-refresh-token",
        expires_in: 86400, // 24 hours
        token_type: "Bearer",
      });

      mockPrisma.socialAccount.update.mockResolvedValue({});

      const result = await refreshTikTokToken(mockTikTokAccount, mockPrisma);

      expect(result.success).toBe(true);
      expect(result.newAccessToken).toBe("new-tt-access-token");
      expect(result.newRefreshToken).toBe("new-tt-refresh-token");
      expect(result.expiresAt).toBeDefined();

      // Verify database was updated with encrypted tokens
      expect(mockPrisma.socialAccount.update).toHaveBeenCalledWith({
        where: { id: "test-tt-account" },
        data: expect.objectContaining({
          accessToken: "encrypted:new-tt-access-token",
          refreshToken: "encrypted:new-tt-refresh-token",
        }),
      });
    });

    it("should handle token rotation (new refresh token)", async () => {
      vi.mocked(tiktokOAuth.refreshAccessToken).mockResolvedValue({
        access_token: "new-tt-access-token",
        refresh_token: "rotated-refresh-token",
        expires_in: 86400,
        token_type: "Bearer",
      });

      mockPrisma.socialAccount.update.mockResolvedValue({});

      const result = await refreshTikTokToken(mockTikTokAccount, mockPrisma);

      expect(result.success).toBe(true);
      expect(result.newRefreshToken).toBe("rotated-refresh-token");
    });

    it("should keep old refresh token if not rotated", async () => {
      vi.mocked(tiktokOAuth.refreshAccessToken).mockResolvedValue({
        access_token: "new-tt-access-token",
        // No refresh_token in response
        expires_in: 86400,
        token_type: "Bearer",
      });

      mockPrisma.socialAccount.update.mockResolvedValue({});

      const result = await refreshTikTokToken(mockTikTokAccount, mockPrisma);

      expect(result.success).toBe(true);
      expect(result.newRefreshToken).toBeUndefined();

      // Should keep old refresh token
      expect(mockPrisma.socialAccount.update).toHaveBeenCalledWith({
        where: { id: "test-tt-account" },
        data: expect.objectContaining({
          refreshToken: "old-tt-refresh-token",
        }),
      });
    });

    it("should return error if no refreshToken exists", async () => {
      const accountWithoutToken = {
        ...mockTikTokAccount,
        refreshToken: null,
      };

      const result = await refreshTikTokToken(accountWithoutToken, mockPrisma);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No refreshToken found");
    });

    it("should return error if refresh API fails", async () => {
      vi.mocked(tiktokOAuth.refreshAccessToken).mockRejectedValue(
        new Error("Invalid refresh token")
      );

      const result = await refreshTikTokToken(mockTikTokAccount, mockPrisma);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid refresh token");
    });

    it("should throttle rapid refresh attempts", async () => {
      vi.mocked(tiktokOAuth.refreshAccessToken).mockResolvedValue({
        access_token: "new-tt-access-token",
        expires_in: 86400,
        token_type: "Bearer",
      });

      mockPrisma.socialAccount.update.mockResolvedValue({});

      // First attempt should succeed
      const result1 = await refreshTikTokToken(mockTikTokAccount, mockPrisma);
      expect(result1.success).toBe(true);

      // Second attempt should be throttled
      const result2 = await refreshTikTokToken(mockTikTokAccount, mockPrisma);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain("too recently");
    });
  });

  describe("refreshToken", () => {
    it("should call refreshInstagramToken for Instagram accounts", async () => {
      const igAccount: SocialAccount = {
        id: "test-ig",
        userId: 1,
        platform: ContentPlatform.INSTAGRAM,
        platformUserId: "ig-123",
        pageId: "page-123",
        pageAccessToken: "token",
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(instagramOAuth.refreshLongLivedToken).mockResolvedValue({
        access_token: "new-token",
        token_type: "bearer",
        expires_in: 5184000,
      });

      mockPrisma.socialAccount.update.mockResolvedValue({});

      const result = await refreshToken(igAccount, mockPrisma);

      expect(result.success).toBe(true);
      expect(instagramOAuth.refreshLongLivedToken).toHaveBeenCalled();
    });

    it("should call refreshTikTokToken for TikTok accounts", async () => {
      const ttAccount: SocialAccount = {
        id: "test-tt",
        userId: 1,
        platform: ContentPlatform.TIKTOK,
        platformUserId: "tt-123",
        pageId: null,
        pageAccessToken: null,
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(tiktokOAuth.refreshAccessToken).mockResolvedValue({
        access_token: "new-token",
        expires_in: 86400,
        token_type: "Bearer",
      });

      mockPrisma.socialAccount.update.mockResolvedValue({});

      const result = await refreshToken(ttAccount, mockPrisma);

      expect(result.success).toBe(true);
      expect(tiktokOAuth.refreshAccessToken).toHaveBeenCalled();
    });
  });

  describe("ensureValidToken", () => {
    it("should return existing token if not expired", async () => {
      const validAccount: SocialAccount = {
        id: "test-account",
        userId: 1,
        platform: ContentPlatform.TIKTOK,
        platformUserId: "tt-123",
        pageId: null,
        pageAccessToken: null,
        accessToken: "valid-token",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await ensureValidToken(validAccount, mockPrisma);

      expect(result.token).toBe("valid-token");
      expect(result.refreshed).toBe(false);
      expect(tiktokOAuth.refreshAccessToken).not.toHaveBeenCalled();
    });

    it("should refresh and return new token if expired", async () => {
      const expiredAccount: SocialAccount = {
        id: "test-account",
        userId: 1,
        platform: ContentPlatform.TIKTOK,
        platformUserId: "tt-123",
        pageId: null,
        pageAccessToken: null,
        accessToken: "old-token",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(tiktokOAuth.refreshAccessToken).mockResolvedValue({
        access_token: "new-token",
        expires_in: 86400,
        token_type: "Bearer",
      });

      mockPrisma.socialAccount.update.mockResolvedValue({});

      const result = await ensureValidToken(expiredAccount, mockPrisma);

      expect(result.token).toBe("new-token");
      expect(result.refreshed).toBe(true);
    });

    it("should throw error if refresh fails", async () => {
      const expiredAccount: SocialAccount = {
        id: "test-account",
        userId: 1,
        platform: ContentPlatform.TIKTOK,
        platformUserId: "tt-123",
        pageId: null,
        pageAccessToken: null,
        accessToken: "old-token",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(tiktokOAuth.refreshAccessToken).mockRejectedValue(
        new Error("Refresh failed")
      );

      await expect(ensureValidToken(expiredAccount, mockPrisma)).rejects.toThrow(
        "Refresh failed"
      );
    });

    it("should handle encrypted tokens", async () => {
      const accountWithEncryptedToken: SocialAccount = {
        id: "test-account",
        userId: 1,
        platform: ContentPlatform.TIKTOK,
        platformUserId: "tt-123",
        pageId: null,
        pageAccessToken: null,
        accessToken: "encrypted:my-secret-token",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await ensureValidToken(accountWithEncryptedToken, mockPrisma);

      expect(result.token).toBe("my-secret-token");
      expect(result.refreshed).toBe(false);
    });
  });
});
