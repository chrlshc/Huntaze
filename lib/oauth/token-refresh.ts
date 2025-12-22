/**
 * Token Refresh Module
 *
 * Provides unified token refresh functionality for TikTok and Instagram.
 * Automatically refreshes tokens before publication if expired.
 *
 * Requirements: 2.3
 */

import { PrismaClient, SocialAccount, ContentPlatform } from "@prisma/client";
import { tiktokOAuth } from "../services/tiktokOAuth";
import { instagramOAuth } from "../services/instagramOAuth";
import { encryptToken, decryptToken } from "../crypto/token-encryption";
import { makeReqLogger } from "../logger";

const logger = makeReqLogger({ service: "token-refresh" });

// Buffer time before expiration to trigger refresh (1 hour)
const REFRESH_BUFFER_MS = 60 * 60 * 1000;

// Minimum time between refresh attempts for same account (5 minutes)
const MIN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// Track recent refresh attempts to prevent hammering
const refreshAttempts = new Map<string, number>();

export interface TokenRefreshResult {
  success: boolean;
  newAccessToken?: string;
  newRefreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Check if a token needs refresh based on expiration time
 */
export function isTokenExpired(
  expiresAt: Date | null,
  bufferMs: number = REFRESH_BUFFER_MS
): boolean {
  if (!expiresAt) {
    // No expiration set - assume it needs refresh
    return true;
  }

  const now = Date.now();
  const expirationTime = expiresAt.getTime();

  // Token is expired or will expire within buffer time
  return now >= expirationTime - bufferMs;
}

/**
 * Refresh Instagram token
 *
 * Instagram uses long-lived tokens that last 60 days.
 * They can be refreshed once per day to extend for another 60 days.
 */
export async function refreshInstagramToken(
  account: SocialAccount,
  prisma: PrismaClient
): Promise<TokenRefreshResult> {
  const accountKey = `instagram:${account.id}`;

  logger.info("instagram_token_refresh_start", {
    accountId: account.id,
    userId: account.userId,
  });

  // Check if we recently attempted refresh
  const lastAttempt = refreshAttempts.get(accountKey);
  if (lastAttempt && Date.now() - lastAttempt < MIN_REFRESH_INTERVAL_MS) {
    logger.warn("instagram_token_refresh_throttled", {
      accountId: account.id,
      lastAttemptAgo: Date.now() - lastAttempt,
    });
    return {
      success: false,
      error: "Token refresh attempted too recently. Please wait before retrying.",
    };
  }

  refreshAttempts.set(accountKey, Date.now());

  try {
    // Get the current token (decrypt if encrypted)
    let currentToken = account.pageAccessToken;
    if (!currentToken) {
      throw new Error("No pageAccessToken found for Instagram account");
    }

    // Try to decrypt if it looks encrypted
    try {
      currentToken = decryptToken(currentToken);
    } catch {
      // Token might not be encrypted, use as-is
    }

    // Refresh the token
    const refreshResult = await instagramOAuth.refreshLongLivedToken(currentToken);

    // Encrypt the new token
    const encryptedToken = encryptToken(refreshResult.access_token);

    // Calculate new expiration (60 days from now)
    const expiresAt = new Date(Date.now() + refreshResult.expires_in * 1000);

    // Update the database
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        pageAccessToken: encryptedToken,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    logger.info("instagram_token_refresh_success", {
      accountId: account.id,
      userId: account.userId,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      success: true,
      newAccessToken: refreshResult.access_token,
      expiresAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error("instagram_token_refresh_failed", {
      accountId: account.id,
      userId: account.userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: `Instagram token refresh failed: ${errorMessage}`,
    };
  }
}

/**
 * Refresh TikTok token
 *
 * TikTok access tokens expire in 24 hours.
 * Refresh tokens last 365 days and may be rotated on refresh.
 */
export async function refreshTikTokToken(
  account: SocialAccount,
  prisma: PrismaClient
): Promise<TokenRefreshResult> {
  const accountKey = `tiktok:${account.id}`;

  logger.info("tiktok_token_refresh_start", {
    accountId: account.id,
    userId: account.userId,
  });

  // Check if we recently attempted refresh
  const lastAttempt = refreshAttempts.get(accountKey);
  if (lastAttempt && Date.now() - lastAttempt < MIN_REFRESH_INTERVAL_MS) {
    logger.warn("tiktok_token_refresh_throttled", {
      accountId: account.id,
      lastAttemptAgo: Date.now() - lastAttempt,
    });
    return {
      success: false,
      error: "Token refresh attempted too recently. Please wait before retrying.",
    };
  }

  refreshAttempts.set(accountKey, Date.now());

  try {
    // Get the current refresh token (decrypt if encrypted)
    let currentRefreshToken = account.refreshToken;
    if (!currentRefreshToken) {
      throw new Error("No refreshToken found for TikTok account");
    }

    // Try to decrypt if it looks encrypted
    try {
      currentRefreshToken = decryptToken(currentRefreshToken);
    } catch {
      // Token might not be encrypted, use as-is
    }

    // Refresh the token
    const refreshResult = await tiktokOAuth.refreshAccessToken(currentRefreshToken);

    // Encrypt the new tokens
    const encryptedAccessToken = encryptToken(refreshResult.access_token);
    const encryptedRefreshToken = refreshResult.refresh_token
      ? encryptToken(refreshResult.refresh_token)
      : account.refreshToken; // Keep old if not rotated

    // Calculate new expiration (typically 24 hours)
    const expiresAt = new Date(Date.now() + refreshResult.expires_in * 1000);

    // Update the database
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    logger.info("tiktok_token_refresh_success", {
      accountId: account.id,
      userId: account.userId,
      expiresAt: expiresAt.toISOString(),
      tokenRotated: !!refreshResult.refresh_token,
    });

    return {
      success: true,
      newAccessToken: refreshResult.access_token,
      newRefreshToken: refreshResult.refresh_token,
      expiresAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error("tiktok_token_refresh_failed", {
      accountId: account.id,
      userId: account.userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: `TikTok token refresh failed: ${errorMessage}`,
    };
  }
}

/**
 * Refresh token for any platform
 *
 * Automatically detects platform and calls appropriate refresh function.
 */
export async function refreshToken(
  account: SocialAccount,
  prisma: PrismaClient
): Promise<TokenRefreshResult> {
  if (account.platform === ContentPlatform.INSTAGRAM) {
    return refreshInstagramToken(account, prisma);
  } else if (account.platform === ContentPlatform.TIKTOK) {
    return refreshTikTokToken(account, prisma);
  } else {
    return {
      success: false,
      error: `Unsupported platform: ${account.platform}`,
    };
  }
}

/**
 * Ensure token is valid before publication
 *
 * Checks if token is expired and refreshes if needed.
 * Returns the valid access token (decrypted).
 */
export async function ensureValidToken(
  account: SocialAccount,
  prisma: PrismaClient
): Promise<{ token: string; refreshed: boolean }> {
  const needsRefresh = isTokenExpired(account.expiresAt);

  if (needsRefresh) {
    logger.info("token_needs_refresh", {
      accountId: account.id,
      platform: account.platform,
      expiresAt: account.expiresAt?.toISOString(),
    });

    const result = await refreshToken(account, prisma);

    if (!result.success) {
      throw new Error(result.error || "Token refresh failed");
    }

    // Return the new token
    return {
      token: result.newAccessToken!,
      refreshed: true,
    };
  }

  // Token is still valid - decrypt and return
  let token: string;

  if (account.platform === ContentPlatform.INSTAGRAM) {
    token = account.pageAccessToken || "";
  } else {
    token = account.accessToken || "";
  }

  // Try to decrypt
  try {
    token = decryptToken(token);
  } catch {
    // Token might not be encrypted
  }

  return {
    token,
    refreshed: false,
  };
}

/**
 * Clear refresh attempt tracking (for testing)
 */
export function clearRefreshAttempts(): void {
  refreshAttempts.clear();
}
